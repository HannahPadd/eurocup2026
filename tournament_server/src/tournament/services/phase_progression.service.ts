import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  Match,
  Phase,
  PhaseProgressionAction,
  PhaseProgressionResult,
  Player,
  Standing,
} from '@persistence/entities';

type TiePolicy = 'MANUAL_EXTRA_SONG' | 'MANUAL_ADMIN';

type PhaseRule =
  | {
      type: 'ADVANCE_TOP_N';
      count: number;
      targetPhaseId: number;
      targetMatchId?: number;
    }
  | {
      type: 'ADVANCE_TOP_PERCENT';
      percent: number;
      targetPhaseId: number;
      targetMatchId?: number;
      rounding?: 'UP' | 'DOWN' | 'NEAREST';
    }
  | {
      type: 'SEND_RANK_RANGE_TO_PHASE';
      fromRank: number;
      toRank: number;
      targetPhaseId: number;
      targetMatchId?: number;
      lane?: 'LOSERS' | 'WINNERS';
    }
  | {
      type: 'SEND_REMAINING_TO_PHASE';
      targetPhaseId: number;
      targetMatchId?: number;
      lane?: 'LOSERS' | 'WINNERS';
    }
  | {
      type: 'ELIMINATE_BOTTOM_N';
      count: number;
    }
  | {
      type: 'ELIMINATE_BOTTOM_PERCENT';
      percent: number;
      rounding?: 'UP' | 'DOWN' | 'NEAREST';
    };

type PhaseRulesetConfig = {
  tiePolicy?: TiePolicy;
  rules?: PhaseRule[];
  steps?: {
    name?: string;
    sourceMatchId?: number | string;
    tiePolicy?: TiePolicy;
    rules?: PhaseRule[];
  }[];
};

type RankingEntry = {
  player: Player;
  totalPoints: number;
  averagePercentage: number;
  failCount: number;
  rank: number;
};

type PlannedAction = {
  player: Player;
  action: PhaseProgressionAction;
  targetPhaseId?: number;
  targetMatchId?: number;
  rank: number;
  tiedAtBoundary: boolean;
  reason: string;
};

type PreviewResponse = {
  phaseId: number;
  matchId?: number;
  stepIndex?: number;
  stepName?: string;
  rulesetId: number;
  tiePolicy: TiePolicy;
  ranking: RankingEntry[];
  actions: PlannedAction[];
  unresolvedTies: {
    playerIds: number[];
    reason: string;
  }[];
};

@Injectable()
export class PhaseProgressionService {
  constructor(
    @InjectRepository(Phase)
    private phaseRepo: Repository<Phase>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    @InjectRepository(PhaseProgressionResult)
    private progressionRepo: Repository<PhaseProgressionResult>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    private dataSource: DataSource,
  ) {}

  async preview(phaseId: number, stepIndex?: number): Promise<PreviewResponse> {
    const phase = await this.phaseRepo.findOneBy({ id: phaseId });
    if (!phase) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }
    return this.evaluateAndBuildPreview(
      phase,
      this.buildPhaseRanking(phase),
      phaseId,
      undefined,
      stepIndex,
    );
  }

  async commit(
    phaseId: number,
    autoAssignPlayersToTargetMatches = true,
    stepIndex?: number,
  ): Promise<{
    runId: string;
    saved: number;
    autoAssignedPlayers: number;
    preview: PreviewResponse;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const phase = await manager
        .getRepository(Phase)
        .findOneBy({ id: phaseId });
      if (!phase) {
        throw new NotFoundException(`Phase ${phaseId} not found`);
      }
      const preview = this.evaluateAndBuildPreview(
        phase,
        this.buildPhaseRanking(phase),
        phaseId,
        undefined,
        stepIndex,
      );

      const runId = `phase-${phaseId}-${Date.now()}`;
      const records = this.buildProgressionRecords(
        runId,
        phase,
        preview.actions,
      );

      if (records.length > 0) {
        await manager.getRepository(PhaseProgressionResult).save(records);
      }

      let autoAssignedPlayers = 0;
      if (autoAssignPlayersToTargetMatches) {
        autoAssignedPlayers = await this.autoAssignToTargetPhaseMatches(
          preview.actions,
          manager,
        );
      }

      return {
        runId,
        saved: records.length,
        autoAssignedPlayers,
        preview,
      };
    });
  }

  async previewMatch(
    matchId: number,
    stepIndex?: number,
  ): Promise<PreviewResponse> {
    const match = await this.matchRepo.findOneBy({ id: matchId });
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    const phase = await match.phase;
    if (!phase) {
      throw new BadRequestException(`Match ${matchId} has no phase`);
    }

    const ranking = this.buildMatchRanking(match);
    return this.evaluateAndBuildPreview(
      phase,
      ranking,
      phase.id,
      matchId,
      stepIndex,
    );
  }

  async commitMatch(
    matchId: number,
    autoAssignPlayersToTargetMatches = true,
    stepIndex?: number,
  ): Promise<{
    runId: string;
    saved: number;
    autoAssignedPlayers: number;
    preview: PreviewResponse;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const match = await manager
        .getRepository(Match)
        .findOneBy({ id: matchId });
      if (!match) {
        throw new NotFoundException(`Match ${matchId} not found`);
      }
      const phase = await match.phase;
      if (!phase) {
        throw new BadRequestException(`Match ${matchId} has no phase`);
      }
      const preview = this.evaluateAndBuildPreview(
        phase,
        this.buildMatchRanking(match),
        phase.id,
        matchId,
        stepIndex,
      );

      const runId = `match-${matchId}-${Date.now()}`;
      const records = this.buildProgressionRecords(
        runId,
        phase,
        preview.actions,
      );

      if (records.length > 0) {
        await manager.getRepository(PhaseProgressionResult).save(records);
      }

      let autoAssignedPlayers = 0;
      if (autoAssignPlayersToTargetMatches) {
        autoAssignedPlayers = await this.autoAssignToTargetPhaseMatches(
          preview.actions,
          manager,
        );
      }

      return {
        runId,
        saved: records.length,
        autoAssignedPlayers,
        preview,
      };
    });
  }

  private buildProgressionRecords(
    runId: string,
    phase: Phase,
    actions: PlannedAction[],
  ): PhaseProgressionResult[] {
    return actions.map((action) => {
      const entity = new PhaseProgressionResult();
      entity.runId = runId;
      entity.phase = phase;
      entity.player = action.player;
      entity.action = action.action;
      entity.targetPhaseId = action.targetPhaseId;
      entity.targetMatchId = action.targetMatchId;
      entity.rankingPosition = action.rank;
      entity.tiedAtBoundary = action.tiedAtBoundary;
      entity.reason = action.reason;
      return entity;
    });
  }

  private evaluateAndBuildPreview(
    phase: Phase,
    ranking: RankingEntry[],
    phaseId: number,
    matchId?: number,
    stepIndex?: number,
  ): PreviewResponse {
    if (!phase.ruleset) {
      throw new BadRequestException(`Phase ${phaseId} has no ruleset assigned`);
    }
    const config = this.getPhaseConfig(phase.ruleset.config, phaseId);
    let activeRanking = ranking;
    let rules = config.rules ?? [];
    let tiePolicy = config.tiePolicy ?? 'MANUAL_EXTRA_SONG';
    let resolvedMatchId = matchId;
    let resolvedStepIndex: number | undefined;
    let resolvedStepName: string | undefined;

    if (config.steps && config.steps.length > 0) {
      const selectedStepIndex = this.resolveStepIndexForEvaluation(
        config.steps,
        stepIndex,
        matchId,
      );
      const step = config.steps[selectedStepIndex];
      if (!step) {
        throw new BadRequestException(
          `Ruleset step ${selectedStepIndex} not found`,
        );
      }

      const rawSourceMatchId =
        typeof step.sourceMatchId === 'number'
          ? step.sourceMatchId
          : Number(step.sourceMatchId);
      const sourceMatchId =
        Number.isFinite(rawSourceMatchId) && rawSourceMatchId > 0
          ? rawSourceMatchId
          : matchId;
      if (!sourceMatchId) {
        throw new BadRequestException(
          `Ruleset step ${selectedStepIndex} has no sourceMatchId`,
        );
      }

      const sourceMatch = (phase.matches ?? []).find(
        (item) => item.id === sourceMatchId,
      );
      if (!sourceMatch) {
        throw new BadRequestException(
          `Source match ${sourceMatchId} not found in phase ${phaseId}`,
        );
      }

      activeRanking = this.buildMatchRanking(sourceMatch);
      rules = step.rules ?? [];
      tiePolicy = step.tiePolicy ?? tiePolicy;
      resolvedMatchId = sourceMatchId;
      resolvedStepIndex = selectedStepIndex;
      resolvedStepName = step.name;
    }

    const actionsByPlayer = new Map<number, PlannedAction>();
    const unresolvedTies: { playerIds: number[]; reason: string }[] = [];

    for (const rule of rules) {
      this.applyRule(rule, activeRanking, actionsByPlayer, unresolvedTies);
    }

    const actions = Array.from(actionsByPlayer.values()).sort(
      (a, b) => a.rank - b.rank,
    );

    return {
      phaseId,
      matchId: resolvedMatchId,
      stepIndex: resolvedStepIndex,
      stepName: resolvedStepName,
      rulesetId: phase.ruleset.id,
      tiePolicy,
      ranking: activeRanking,
      actions,
      unresolvedTies,
    };
  }

  private resolveStepIndexForEvaluation(
    steps: PhaseRulesetConfig['steps'],
    requestedStepIndex: number | undefined,
    matchId: number | undefined,
  ): number {
    if (!steps || steps.length === 0) {
      return 0;
    }
    if (requestedStepIndex !== undefined) {
      return requestedStepIndex;
    }
    if (!matchId) {
      return 0;
    }

    const matchesBySourceId = steps
      .map((step, index) => ({
        index,
        sourceMatchId: this.parsePositiveInteger(step?.sourceMatchId),
      }))
      .filter(
        (item): item is { index: number; sourceMatchId: number } =>
          item.sourceMatchId !== undefined,
      )
      .filter((item) => item.sourceMatchId === matchId);

    const hasAnySourceMapping = steps.some(
      (step) => this.parsePositiveInteger(step?.sourceMatchId) !== undefined,
    );
    if (!hasAnySourceMapping) {
      return 0;
    }

    if (matchesBySourceId.length === 1) {
      return matchesBySourceId[0].index;
    }
    if (matchesBySourceId.length > 1) {
      throw new BadRequestException(
        `Multiple ruleset steps map to match ${matchId}; provide stepIndex explicitly`,
      );
    }

    throw new BadRequestException(
      `No ruleset step maps to match ${matchId}; provide stepIndex explicitly`,
    );
  }

  private buildMatchRanking(match: Match): RankingEntry[] {
    const tempPhase = new Phase();
    tempPhase.matches = [match];
    return this.buildPhaseRanking(tempPhase);
  }

  private buildPhaseRanking(phase: Phase): RankingEntry[] {
    const byPlayer = new Map<
      number,
      {
        player: Player;
        points: number;
        percentageTotal: number;
        percentageCount: number;
        failCount: number;
      }
    >();

    for (const match of phase.matches ?? []) {
      for (const player of match.players ?? []) {
        if (!byPlayer.has(player.id)) {
          byPlayer.set(player.id, {
            player,
            points: 0,
            percentageTotal: 0,
            percentageCount: 0,
            failCount: 0,
          });
        }
      }

      for (const round of match.rounds ?? []) {
        const disabledPlayerIds = new Set(round.disabledPlayerIds ?? []);
        const latestStandingByPlayerId = new Map<number, Standing>();
        for (const standing of round.standings ?? []) {
          const playerId = standing.score?.player?.id;
          if (!playerId || disabledPlayerIds.has(playerId)) {
            continue;
          }

          const previous = latestStandingByPlayerId.get(playerId);
          if (!previous || standing.id > previous.id) {
            latestStandingByPlayerId.set(playerId, standing);
          }
        }

        for (const standing of latestStandingByPlayerId.values()) {
          const player = standing.score?.player;
          if (!player) {
            continue;
          }

          const current = byPlayer.get(player.id) ?? {
            player,
            points: 0,
            percentageTotal: 0,
            percentageCount: 0,
            failCount: 0,
          };

          current.points += Number(standing.points ?? 0);
          current.percentageTotal += Number(standing.score?.percentage ?? 0);
          current.percentageCount += 1;
          if (standing.score?.isFailed) {
            current.failCount += 1;
          }
          byPlayer.set(player.id, current);
        }
      }
    }

    const sorted = Array.from(byPlayer.values())
      .map((value) => ({
        player: value.player,
        totalPoints: value.points,
        averagePercentage: value.percentageCount
          ? Number((value.percentageTotal / value.percentageCount).toFixed(4))
          : 0,
        failCount: value.failCount,
        rank: 0,
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        if (b.averagePercentage !== a.averagePercentage) {
          return b.averagePercentage - a.averagePercentage;
        }
        if (a.failCount !== b.failCount) {
          return a.failCount - b.failCount;
        }
        return (a.player.playerName ?? '').localeCompare(
          b.player.playerName ?? '',
        );
      });

    this.assignRanks(sorted);
    return sorted;
  }

  private assignRanks(entries: RankingEntry[]) {
    for (let i = 0; i < entries.length; i++) {
      if (i === 0) {
        entries[i].rank = 1;
        continue;
      }

      if (this.sameMetrics(entries[i - 1], entries[i])) {
        entries[i].rank = entries[i - 1].rank;
      } else {
        entries[i].rank = i + 1;
      }
    }
  }

  private applyRule(
    rule: PhaseRule,
    ranking: RankingEntry[],
    actionsByPlayer: Map<number, PlannedAction>,
    unresolvedTies: { playerIds: number[]; reason: string }[],
  ) {
    const undecided = ranking.filter(
      (entry) => !actionsByPlayer.has(entry.player.id),
    );
    if (undecided.length === 0) {
      return;
    }

    if (rule.type === 'ADVANCE_TOP_N') {
      const count = Math.max(0, Math.min(rule.count, undecided.length));
      this.applyAdvanceTopNRule(
        count,
        rule.targetPhaseId,
        rule.targetMatchId,
        `ADVANCE_TOP_N(${rule.count})`,
        ranking,
        undecided,
        actionsByPlayer,
        unresolvedTies,
      );
      return;
    }

    if (rule.type === 'ADVANCE_TOP_PERCENT') {
      const count = this.calculateCountFromPercent(
        undecided.length,
        rule.percent,
        rule.rounding ?? 'UP',
      );
      this.applyAdvanceTopNRule(
        count,
        rule.targetPhaseId,
        rule.targetMatchId,
        `ADVANCE_TOP_PERCENT(${rule.percent}%)`,
        ranking,
        undecided,
        actionsByPlayer,
        unresolvedTies,
      );
      return;
    }

    if (rule.type === 'ELIMINATE_BOTTOM_N') {
      const count = Math.max(0, Math.min(rule.count, undecided.length));
      this.applyEliminateBottomNRule(
        count,
        `ELIMINATE_BOTTOM_N(${rule.count})`,
        ranking,
        undecided,
        actionsByPlayer,
        unresolvedTies,
      );
      return;
    }

    if (rule.type === 'ELIMINATE_BOTTOM_PERCENT') {
      const count = this.calculateCountFromPercent(
        undecided.length,
        rule.percent,
        rule.rounding ?? 'DOWN',
      );
      this.applyEliminateBottomNRule(
        count,
        `ELIMINATE_BOTTOM_PERCENT(${rule.percent}%)`,
        ranking,
        undecided,
        actionsByPlayer,
        unresolvedTies,
      );
      return;
    }

    if (rule.type === 'SEND_REMAINING_TO_PHASE') {
      for (const entry of undecided) {
        actionsByPlayer.set(entry.player.id, {
          player: entry.player,
          action:
            rule.lane === 'LOSERS'
              ? PhaseProgressionAction.SEND_TO_LOSERS
              : PhaseProgressionAction.ADVANCE,
          targetPhaseId: rule.targetPhaseId,
          targetMatchId: rule.targetMatchId,
          rank: entry.rank,
          tiedAtBoundary: false,
          reason: `Moved by rule SEND_REMAINING_TO_PHASE`,
        });
      }
      return;
    }

    if (rule.type === 'SEND_RANK_RANGE_TO_PHASE') {
      const fromIndex = Math.max(0, rule.fromRank - 1);
      const toIndex = Math.max(fromIndex, rule.toRank - 1);
      const selected = ranking
        .slice(fromIndex, toIndex + 1)
        .filter((entry) => !actionsByPlayer.has(entry.player.id));

      const crossingBoundaryPlayerIds = new Set<number>();
      this.collectCrossingRankBoundaryPlayers(
        ranking,
        fromIndex,
        crossingBoundaryPlayerIds,
      );
      this.collectCrossingRankBoundaryPlayers(
        ranking,
        toIndex + 1,
        crossingBoundaryPlayerIds,
      );

      this.setBoundaryHolds(
        crossingBoundaryPlayerIds,
        ranking,
        actionsByPlayer,
        unresolvedTies,
        `Tie at rank range boundary ${rule.fromRank}-${rule.toRank}`,
      );

      for (const entry of selected) {
        if (crossingBoundaryPlayerIds.has(entry.player.id)) {
          continue;
        }
        actionsByPlayer.set(entry.player.id, {
          player: entry.player,
          action:
            rule.lane === 'LOSERS'
              ? PhaseProgressionAction.SEND_TO_LOSERS
              : PhaseProgressionAction.ADVANCE,
          targetPhaseId: rule.targetPhaseId,
          targetMatchId: rule.targetMatchId,
          rank: entry.rank,
          tiedAtBoundary: false,
          reason: `Moved by rule SEND_RANK_RANGE_TO_PHASE(${rule.fromRank}-${rule.toRank})`,
        });
      }
    }
  }

  private applyAdvanceTopNRule(
    count: number,
    targetPhaseId: number,
    targetMatchId: number | undefined,
    ruleLabel: string,
    ranking: RankingEntry[],
    undecided: RankingEntry[],
    actionsByPlayer: Map<number, PlannedAction>,
    unresolvedTies: { playerIds: number[]; reason: string }[],
  ) {
    const clampedCount = Math.max(0, Math.min(count, undecided.length));
    const { boundaryTiePlayerIds } = this.findTopBoundaryTie(
      undecided,
      clampedCount,
    );
    this.setBoundaryHolds(
      boundaryTiePlayerIds,
      ranking,
      actionsByPlayer,
      unresolvedTies,
      `Tie at advancement boundary top ${clampedCount}`,
    );

    let added = 0;
    for (const entry of undecided) {
      if (added >= clampedCount) {
        break;
      }
      if (boundaryTiePlayerIds.has(entry.player.id)) {
        continue;
      }
      actionsByPlayer.set(entry.player.id, {
        player: entry.player,
        action: PhaseProgressionAction.ADVANCE,
        targetPhaseId,
        targetMatchId,
        rank: entry.rank,
        tiedAtBoundary: false,
        reason: `Advanced by rule ${ruleLabel}`,
      });
      added += 1;
    }
  }

  private applyEliminateBottomNRule(
    count: number,
    ruleLabel: string,
    ranking: RankingEntry[],
    undecided: RankingEntry[],
    actionsByPlayer: Map<number, PlannedAction>,
    unresolvedTies: { playerIds: number[]; reason: string }[],
  ) {
    const clampedCount = Math.max(0, Math.min(count, undecided.length));
    const { boundaryTiePlayerIds } = this.findBottomBoundaryTie(
      undecided,
      clampedCount,
    );
    this.setBoundaryHolds(
      boundaryTiePlayerIds,
      ranking,
      actionsByPlayer,
      unresolvedTies,
      `Tie at elimination boundary bottom ${clampedCount}`,
    );

    const selected = [...undecided].reverse();
    let added = 0;
    for (const entry of selected) {
      if (added >= clampedCount) {
        break;
      }
      if (boundaryTiePlayerIds.has(entry.player.id)) {
        continue;
      }
      actionsByPlayer.set(entry.player.id, {
        player: entry.player,
        action: PhaseProgressionAction.ELIMINATE,
        rank: entry.rank,
        tiedAtBoundary: false,
        reason: `Eliminated by rule ${ruleLabel}`,
      });
      added += 1;
    }
  }

  private calculateCountFromPercent(
    total: number,
    percent: number,
    rounding: 'UP' | 'DOWN' | 'NEAREST',
  ): number {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const raw = (total * clampedPercent) / 100;

    if (rounding === 'DOWN') {
      return Math.floor(raw);
    }
    if (rounding === 'NEAREST') {
      return Math.round(raw);
    }
    return Math.ceil(raw);
  }

  private setBoundaryHolds(
    boundaryTiePlayerIds: Set<number>,
    ranking: RankingEntry[],
    actionsByPlayer: Map<number, PlannedAction>,
    unresolvedTies: { playerIds: number[]; reason: string }[],
    reason: string,
  ) {
    if (boundaryTiePlayerIds.size === 0) {
      return;
    }

    unresolvedTies.push({
      playerIds: Array.from(boundaryTiePlayerIds),
      reason,
    });

    for (const playerId of boundaryTiePlayerIds) {
      if (actionsByPlayer.has(playerId)) {
        continue;
      }
      const entry = ranking.find((item) => item.player.id === playerId);
      if (!entry) {
        continue;
      }
      actionsByPlayer.set(playerId, {
        player: entry.player,
        action: PhaseProgressionAction.HOLD_FOR_TIEBREAKER,
        rank: entry.rank,
        tiedAtBoundary: true,
        reason,
      });
    }
  }

  private findTopBoundaryTie(
    entries: RankingEntry[],
    count: number,
  ): { boundaryTiePlayerIds: Set<number> } {
    const boundaryTiePlayerIds = new Set<number>();
    if (count <= 0 || count >= entries.length) {
      return { boundaryTiePlayerIds };
    }

    const inside = entries[count - 1];
    const outside = entries[count];
    if (!inside || !outside || !this.sameMetrics(inside, outside)) {
      return { boundaryTiePlayerIds };
    }

    for (const entry of entries) {
      if (this.sameMetrics(entry, inside)) {
        boundaryTiePlayerIds.add(entry.player.id);
      }
    }

    return { boundaryTiePlayerIds };
  }

  private findBottomBoundaryTie(
    entries: RankingEntry[],
    count: number,
  ): { boundaryTiePlayerIds: Set<number> } {
    const boundaryTiePlayerIds = new Set<number>();
    if (count <= 0 || count >= entries.length) {
      return { boundaryTiePlayerIds };
    }

    const insideIndex = entries.length - count;
    const outsideIndex = insideIndex - 1;
    const inside = entries[insideIndex];
    const outside = entries[outsideIndex];

    if (!inside || !outside || !this.sameMetrics(inside, outside)) {
      return { boundaryTiePlayerIds };
    }

    for (const entry of entries) {
      if (this.sameMetrics(entry, inside)) {
        boundaryTiePlayerIds.add(entry.player.id);
      }
    }

    return { boundaryTiePlayerIds };
  }

  private collectCrossingRankBoundaryPlayers(
    ranking: RankingEntry[],
    boundaryIndex: number,
    result: Set<number>,
  ) {
    if (boundaryIndex <= 0 || boundaryIndex >= ranking.length) {
      return;
    }

    const before = ranking[boundaryIndex - 1];
    const after = ranking[boundaryIndex];
    if (!before || !after || !this.sameMetrics(before, after)) {
      return;
    }

    for (const entry of ranking) {
      if (this.sameMetrics(entry, before)) {
        result.add(entry.player.id);
      }
    }
  }

  private sameMetrics(a: RankingEntry, b: RankingEntry): boolean {
    return (
      a.totalPoints === b.totalPoints &&
      a.averagePercentage === b.averagePercentage &&
      a.failCount === b.failCount
    );
  }

  private parsePositiveInteger(value: unknown): number | undefined {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      return undefined;
    }
    return parsed;
  }

  private parseNonNegativeInteger(value: unknown): number | undefined {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      return undefined;
    }
    return parsed;
  }

  private parseNonNegativeNumber(value: unknown): number | undefined {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;
    if (!Number.isFinite(parsed) || parsed < 0) {
      return undefined;
    }
    return parsed;
  }

  private ensureMoveRuleHasTarget(
    rule: Record<string, unknown>,
    context: string,
  ) {
    const targetPhaseId = this.parsePositiveInteger(rule.targetPhaseId);
    const targetMatchId = this.parsePositiveInteger(rule.targetMatchId);
    if (!targetPhaseId && !targetMatchId) {
      throw new BadRequestException(
        `${context} must include targetPhaseId or targetMatchId`,
      );
    }
  }

  private validateRule(rule: unknown, context: string) {
    if (!rule || typeof rule !== 'object') {
      throw new BadRequestException(`${context} must be an object`);
    }

    const typedRule = rule as Record<string, unknown>;
    const type = typedRule.type;
    if (typeof type !== 'string') {
      throw new BadRequestException(`${context}.type must be a string`);
    }

    if (type === 'ADVANCE_TOP_N') {
      if (this.parseNonNegativeInteger(typedRule.count) === undefined) {
        throw new BadRequestException(`${context}.count must be >= 0`);
      }
      this.ensureMoveRuleHasTarget(typedRule, context);
      return;
    }

    if (type === 'ADVANCE_TOP_PERCENT') {
      const percent = this.parseNonNegativeNumber(typedRule.percent);
      if (percent === undefined || percent > 100) {
        throw new BadRequestException(
          `${context}.percent must be between 0 and 100`,
        );
      }
      this.ensureMoveRuleHasTarget(typedRule, context);
      return;
    }

    if (type === 'SEND_RANK_RANGE_TO_PHASE') {
      const fromRank = this.parsePositiveInteger(typedRule.fromRank);
      const toRank = this.parsePositiveInteger(typedRule.toRank);
      if (!fromRank || !toRank || fromRank > toRank) {
        throw new BadRequestException(
          `${context} requires valid fromRank/toRank values`,
        );
      }
      this.ensureMoveRuleHasTarget(typedRule, context);
      return;
    }

    if (type === 'SEND_REMAINING_TO_PHASE') {
      this.ensureMoveRuleHasTarget(typedRule, context);
      return;
    }

    if (type === 'ELIMINATE_BOTTOM_N') {
      if (this.parseNonNegativeInteger(typedRule.count) === undefined) {
        throw new BadRequestException(`${context}.count must be >= 0`);
      }
      return;
    }

    if (type === 'ELIMINATE_BOTTOM_PERCENT') {
      const percent = this.parseNonNegativeNumber(typedRule.percent);
      if (percent === undefined || percent > 100) {
        throw new BadRequestException(
          `${context}.percent must be between 0 and 100`,
        );
      }
      return;
    }

    throw new BadRequestException(`${context}.type is not supported`);
  }

  private getPhaseConfig(
    rawConfig: unknown,
    phaseId: number,
  ): PhaseRulesetConfig {
    if (!rawConfig || typeof rawConfig !== 'object') {
      throw new BadRequestException('Ruleset config must be an object');
    }

    const config = rawConfig as PhaseRulesetConfig;
    if (config.rules !== undefined && !Array.isArray(config.rules)) {
      throw new BadRequestException('ruleset.config.rules must be an array');
    }
    if (config.steps !== undefined && !Array.isArray(config.steps)) {
      throw new BadRequestException('ruleset.config.steps must be an array');
    }

    const hasRules = Array.isArray(config.rules) && config.rules.length > 0;
    const hasSteps = Array.isArray(config.steps) && config.steps.length > 0;
    if (!hasRules && !hasSteps) {
      throw new BadRequestException(
        `Phase ${phaseId} ruleset has no progression rules configured`,
      );
    }

    if (Array.isArray(config.rules)) {
      config.rules.forEach((rule, index) => {
        this.validateRule(rule, `ruleset.config.rules[${index}]`);
      });
    }

    if (Array.isArray(config.steps)) {
      config.steps.forEach((step, stepIndex) => {
        if (!step || typeof step !== 'object') {
          throw new BadRequestException(
            `ruleset.config.steps[${stepIndex}] must be an object`,
          );
        }
        if (
          step.sourceMatchId !== undefined &&
          !this.parsePositiveInteger(step.sourceMatchId)
        ) {
          throw new BadRequestException(
            `ruleset.config.steps[${stepIndex}].sourceMatchId must be > 0`,
          );
        }
        if (!Array.isArray(step.rules) || step.rules.length === 0) {
          throw new BadRequestException(
            `ruleset.config.steps[${stepIndex}].rules must be a non-empty array`,
          );
        }
        step.rules.forEach((rule, ruleIndex) => {
          this.validateRule(
            rule,
            `ruleset.config.steps[${stepIndex}].rules[${ruleIndex}]`,
          );
        });
      });
    }

    return config;
  }

  private async autoAssignToTargetPhaseMatches(
    actions: PlannedAction[],
    manager?: EntityManager,
  ): Promise<number> {
    const actionsWithTargets = actions.filter(
      (action) =>
        (action.action === PhaseProgressionAction.ADVANCE ||
          action.action === PhaseProgressionAction.SEND_TO_LOSERS) &&
        (action.targetPhaseId || action.targetMatchId),
    );

    if (actionsWithTargets.length === 0) {
      return 0;
    }

    const activeManager = manager ?? this.dataSource.manager;
    const matchRepo = activeManager.getRepository(Match);
    const phaseRepo = activeManager.getRepository(Phase);
    const playerRepo = activeManager.getRepository(Player);

    const playerIds = Array.from(
      new Set(actionsWithTargets.map((action) => action.player.id)),
    );
    const players = playerIds.length
      ? await playerRepo.findBy({ id: In(playerIds) })
      : [];
    const playerById = new Map(players.map((player) => [player.id, player]));

    const directTargetMatchIds = Array.from(
      new Set(
        actionsWithTargets
          .map((action) => action.targetMatchId)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    );
    const directTargetMatches = directTargetMatchIds.length
      ? await matchRepo.findBy({ id: In(directTargetMatchIds) })
      : [];

    const targetPhaseIds = Array.from(
      new Set(
        actionsWithTargets
          .map((action) => action.targetPhaseId)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    );
    const targetPhases = targetPhaseIds.length
      ? await phaseRepo.findBy({ id: In(targetPhaseIds) })
      : [];
    const targetPhaseById = new Map(
      targetPhases.map((phase) => [phase.id, phase]),
    );

    const matchById = new Map<number, Match>();
    for (const match of directTargetMatches) {
      matchById.set(match.id, match);
    }
    for (const phase of targetPhases) {
      for (const match of phase.matches ?? []) {
        if (!matchById.has(match.id)) {
          matchById.set(match.id, match);
        }
      }
    }

    const assignedKeys = new Set<string>();
    const occupancyByMatchId = new Map<number, number>();
    const dirtyMatches = new Map<number, Match>();

    for (const action of actionsWithTargets) {
      const player = playerById.get(action.player.id);
      if (!player) {
        continue;
      }

      if (action.targetMatchId) {
        const targetMatch = matchById.get(action.targetMatchId);
        if (!targetMatch) {
          continue;
        }
        const currentCount =
          occupancyByMatchId.get(targetMatch.id) ??
          (targetMatch.players ?? []).length;
        occupancyByMatchId.set(targetMatch.id, currentCount);
        const maxPlayers = this.getMatchCapacityFromSetups(targetMatch);
        if (maxPlayers !== undefined && currentCount >= maxPlayers) {
          continue;
        }
        const hasPlayer = (targetMatch.players ?? []).some(
          (p) => p.id === player.id,
        );
        if (!hasPlayer) {
          targetMatch.players = [...(targetMatch.players ?? []), player];
          occupancyByMatchId.set(targetMatch.id, currentCount + 1);
          assignedKeys.add(`${player.id}-${targetMatch.id}`);
          dirtyMatches.set(targetMatch.id, targetMatch);
        }
        continue;
      }

      const targetPhase = action.targetPhaseId
        ? targetPhaseById.get(action.targetPhaseId)
        : undefined;
      if (!targetPhase) {
        continue;
      }

      const targetMatch = this.pickTargetMatchForPhaseAssignment(
        targetPhase.matches ?? [],
        player.id,
        occupancyByMatchId,
      );
      if (!targetMatch) {
        continue;
      }

      const currentCount =
        occupancyByMatchId.get(targetMatch.id) ??
        (targetMatch.players ?? []).length;
      targetMatch.players = [...(targetMatch.players ?? []), player];
      occupancyByMatchId.set(targetMatch.id, currentCount + 1);
      assignedKeys.add(`${player.id}-${targetMatch.id}`);
      dirtyMatches.set(targetMatch.id, targetMatch);
    }

    if (dirtyMatches.size > 0) {
      await matchRepo.save(Array.from(dirtyMatches.values()));
    }

    return assignedKeys.size;
  }

  private pickTargetMatchForPhaseAssignment(
    matches: Match[],
    playerId: number,
    occupancyByMatchId: Map<number, number>,
  ): Match | undefined {
    const candidates = matches.filter((match) => {
      const hasPlayer = (match.players ?? []).some(
        (player) => player.id === playerId,
      );
      if (hasPlayer) {
        return false;
      }

      const maxPlayers = this.getMatchCapacityFromSetups(match);
      const currentCount =
        occupancyByMatchId.get(match.id) ?? (match.players ?? []).length;
      occupancyByMatchId.set(match.id, currentCount);
      if (maxPlayers !== undefined && currentCount >= maxPlayers) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      return undefined;
    }

    candidates.sort((a, b) => {
      const aCount = occupancyByMatchId.get(a.id) ?? (a.players ?? []).length;
      const bCount = occupancyByMatchId.get(b.id) ?? (b.players ?? []).length;
      if (aCount !== bCount) {
        return aCount - bCount;
      }
      return a.id - b.id;
    });

    return candidates[0];
  }

  private getMatchCapacityFromSetups(match: Match): number | undefined {
    const setupIds = new Set<number>();

    for (const round of match.rounds ?? []) {
      for (const assignment of round.matchAssignments ?? []) {
        const setupId = assignment.setup?.id ?? assignment.setupId;
        if (setupId) {
          setupIds.add(setupId);
        }
      }
    }

    return setupIds.size > 0 ? setupIds.size : undefined;
  }
}
