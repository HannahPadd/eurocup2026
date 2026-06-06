import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  Division,
  Match,
  Phase,
  Player,
  QualifierSubmission,
  Ruleset,
  Song,
} from '@persistence/entities';
import {
  CommitQualifierProgressionDto,
  CommitQualifierWaterfallDto,
  CreateQualifierSubmissionDto,
  PreviewQualifierWaterfallDto,
  PreviewQualifierProgressionDto,
  UpdateQualifierSubmissionStatusDto,
} from '../dtos';

type QualifierSong = {
  song: Song;
  submission?: QualifierSubmission;
};

type QualifierPhase = {
  phaseId: number;
  phaseName: string;
  advanceMinPercentage?: number;
  minimumSubmissions?: number;
  songs: QualifierSong[];
};

type QualifierDivision = {
  divisionId: number;
  divisionName: string;
  scoreLead: 'FA' | 'FA_PLUS';
  phases: QualifierPhase[];
};

type QualifierRankingEntry = {
  playerId: number;
  playerName: string;
  playerCountry?: string;
  averagePercentage: number;
  submittedCount: number;
  manualOverride?: boolean;
};

type QualifierDivisionRanking = {
  divisionId: number;
  divisionName: string;
  scoreLead: 'FA' | 'FA_PLUS';
  totalSongs: number;
  rankings: QualifierRankingEntry[];
  recommendedAdvances?: {
    playerId: number;
    playerName: string;
    playerCountry?: string;
    averagePercentage: number;
    submittedCount: number;
  }[];
};

type QualifierRankingBuildEntry = QualifierRankingEntry & {
  songPercentages: Map<number, number>;
};

type QualifierAdminSubmission = {
  id: number;
  percentage: number;
  faPercentage?: number;
  faPlusPercentage?: number;
  screenshotUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  player: {
    id: number;
    playerName: string;
    country?: string;
  };
  song: {
    id: number;
    title: string;
    group: string;
    difficulty: number;
  };
  divisionIds: number[];
};

type QualifierRulesetConfig = {
  sortBy?: 'AVERAGE_PERCENTAGE' | 'SUBMITTED_COUNT' | 'PLAYER_NAME';
  approvedOnly?: boolean;
  minimumSubmissions?: number;
  advanceTopN?: number;
  advanceMinPercentage?: number;
};

type RankedQualifierEntry = QualifierRankingEntry & {
  rank: number;
};

type QualifierProgressionAssignment = RankedQualifierEntry & {
  targetMatchId: number;
  targetMatchName: string;
  status: 'ASSIGN' | 'ALREADY_IN_TARGET' | 'SKIPPED_CAPACITY';
};

type QualifierProgressionBoundaryTie = {
  fromRank: number;
  toRank: number;
  playerIds: number[];
  reason: string;
};

type QualifierProgressionPreviewResponse = {
  divisionId: number;
  divisionName: string;
  source: 'RANKINGS' | 'RECOMMENDED_ADVANCES';
  totalRankedPlayers: number;
  assignments: QualifierProgressionAssignment[];
  unassignedPlayers: RankedQualifierEntry[];
  boundaryTies: QualifierProgressionBoundaryTie[];
  summary: {
    assigned: number;
    alreadyInTarget: number;
    skippedByCapacity: number;
    unassigned: number;
  };
};

type WaterfallMatchKind = 'SEED' | 'WINNER' | 'LOSER' | 'FINAL';

type WaterfallRouteAction = 'ADVANCE' | 'SEND_TO_LOSERS' | 'ELIMINATE';

type PlannedWaterfallRoute = {
  fromRank: number;
  toRank: number;
  count: number;
  action: WaterfallRouteAction;
  targetTempId?: string;
};

type PlannedWaterfallMatch = {
  tempId: string;
  name: string;
  kind: WaterfallMatchKind;
  stage: number;
  estimatedPlayerCount: number;
  seedFromRank?: number;
  seedToRank?: number;
  seedPlayerIds?: number[];
  persistedMatchId?: number;
  routes: PlannedWaterfallRoute[];
};

type PendingWaterfallRoute = {
  source: PlannedWaterfallMatch;
  fromRank: number;
  toRank: number;
  action: Exclude<WaterfallRouteAction, 'ELIMINATE'>;
};

type WaterfallPlan = {
  divisionId: number;
  divisionName: string;
  source: 'RANKINGS' | 'RECOMMENDED_ADVANCES';
  seededEntries: RankedQualifierEntry[];
  settings: {
    phaseName: string;
    matchSize: number;
    advanceCount: number;
    finalistsCount: number;
    scoringSystem: string;
  };
  matches: PlannedWaterfallMatch[];
};

type QualifierWaterfallPreviewResponse = {
  divisionId: number;
  divisionName: string;
  source: 'RANKINGS' | 'RECOMMENDED_ADVANCES';
  totalSeededPlayers: number;
  settings: WaterfallPlan['settings'];
  matches: Array<
    Omit<PlannedWaterfallMatch, 'seedPlayerIds' | 'routes'> & {
      routes: Array<
        PlannedWaterfallRoute & {
          targetMatchName?: string;
          targetMatchId?: number;
        }
      >;
    }
  >;
  summary: {
    seedMatches: number;
    winnerMatches: number;
    loserMatches: number;
    finalMatches: number;
    generatedMatches: number;
  };
};

@Injectable()
export class QualifiersService {
  constructor(
    @InjectRepository(Division)
    private divisionRepo: Repository<Division>,
    @InjectRepository(Phase)
    private phaseRepo: Repository<Phase>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    @InjectRepository(Ruleset)
    private rulesetRepo: Repository<Ruleset>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    @InjectRepository(Song)
    private songRepo: Repository<Song>,
    @InjectRepository(QualifierSubmission)
    private qualifierRepo: Repository<QualifierSubmission>,
    private dataSource: DataSource,
  ) {}

  async list(playerId?: number): Promise<QualifierDivision[]> {
    const divisions = await this.divisionRepo.find();
    const seedingPhases = divisions.map((division) => {
      const phases = (division.phases || []).filter((phase) =>
        this.isQualifierPhase(phase),
      );
      return { division, phases };
    });

    const submissions = playerId
      ? await this.qualifierRepo.find({ where: { player: { id: playerId } } })
      : [];

    return seedingPhases.map(({ division, phases }) => ({
      divisionId: division.id,
      divisionName: division.name,
      scoreLead: this.getDivisionScoreLead(division),
      phases: phases.map((phase) => ({
        ...this.getQualifierPhaseRulesetConfig(phase.ruleset?.config),
        phaseId: phase.id,
        phaseName: phase.name,
        songs: this.extractQualifierSongs(phase, submissions),
      })),
    }));
  }

  async rankings(): Promise<QualifierDivisionRanking[]> {
    const divisions = await this.divisionRepo.find();
    const divisionSongIds = new Map<number, Set<number>>();
    const songToDivisionIds = new Map<number, number[]>();

    for (const division of divisions) {
      const phases = (division.phases || []).filter((phase) =>
        this.isQualifierPhase(phase),
      );
      const songIds = new Set<number>();

      for (const phase of phases) {
        for (const match of phase.matches || []) {
          for (const round of match.rounds || []) {
            const songId = round.song?.id;
            if (!songId) {
              continue;
            }
            songIds.add(songId);
            const existing = songToDivisionIds.get(songId) ?? [];
            if (!existing.includes(division.id)) {
              existing.push(division.id);
              songToDivisionIds.set(songId, existing);
            }
          }
        }
      }

      divisionSongIds.set(division.id, songIds);
    }

    const allSongIds = Array.from(songToDivisionIds.keys());
    if (allSongIds.length === 0) {
      return divisions.map((division) => ({
        divisionId: division.id,
        divisionName: division.name,
        scoreLead: this.getDivisionScoreLead(division),
        totalSongs: 0,
        rankings: [],
      }));
    }

    const allSubmissions = await this.qualifierRepo.find({
      where: { song: { id: In(allSongIds) } },
    });
    const forcedPlayersByDivisionId =
      await this.getForcedQualifierPlayersByDivision();
    const rulesetConfigByDivisionId = new Map<number, QualifierRulesetConfig>();

    for (const division of divisions) {
      rulesetConfigByDivisionId.set(
        division.id,
        this.getQualifierRulesetConfigForDivision(division),
      );
    }

    const rankingsByDivision = new Map<
      number,
      Map<
        number,
        {
          playerId: number;
          playerName: string;
          playerCountry?: string;
          totalPercentage: number;
          submittedCount: number;
          songPercentages: Map<number, number>;
        }
      >
    >();

    for (const submission of allSubmissions) {
      const divisionIds = songToDivisionIds.get(submission.song.id) ?? [];
      const playerId = submission.player?.id;
      if (!playerId) {
        continue;
      }
      for (const divisionId of divisionIds) {
        const division = divisions.find((item) => item.id === divisionId);
        const percentage = this.getSubmissionLeadPercentage(
          submission,
          this.getDivisionScoreLead(division),
        );
        const rulesetConfig = rulesetConfigByDivisionId.get(divisionId) ?? {};
        if (
          rulesetConfig.approvedOnly &&
          submission.status?.toLowerCase() !== 'approved'
        ) {
          continue;
        }

        const divisionMap = rankingsByDivision.get(divisionId) ?? new Map();
        const entry = divisionMap.get(playerId) ?? {
          playerId,
          playerName: submission.player.playerName ?? 'Unnamed player',
          playerCountry: submission.player.country ?? undefined,
          totalPercentage: 0,
          submittedCount: 0,
          songPercentages: new Map<number, number>(),
        };
        entry.totalPercentage += Number.isNaN(percentage) ? 0 : percentage;
        entry.submittedCount += 1;
        entry.songPercentages.set(
          submission.song.id,
          Number.isNaN(percentage) ? 0 : percentage,
        );
        divisionMap.set(playerId, entry);
        rankingsByDivision.set(divisionId, divisionMap);
      }
    }

    const divisionRankings = divisions.map((division) => {
      const rulesetConfig = rulesetConfigByDivisionId.get(division.id) ?? {};
      const minimumSubmissions = rulesetConfig.minimumSubmissions ?? 0;

      const totalSongs = divisionSongIds.get(division.id)?.size ?? 0;
      const divisionSongIdsList = Array.from(
        divisionSongIds.get(division.id)?.values() ?? [],
      );
      const allEntries: QualifierRankingBuildEntry[] = Array.from(
        rankingsByDivision.get(division.id)?.values() ?? [],
      ).map((entry) => ({
        playerId: entry.playerId,
        playerName: entry.playerName,
        playerCountry: entry.playerCountry,
        averagePercentage: entry.submittedCount
          ? Number((entry.totalPercentage / entry.submittedCount).toFixed(2))
          : 0,
        submittedCount: entry.submittedCount,
        songPercentages: entry.songPercentages,
      }));
      let entries: QualifierRankingBuildEntry[] = allEntries;

      if (minimumSubmissions > 0) {
        entries = entries.filter(
          (entry) => entry.submittedCount >= minimumSubmissions,
        );
      }

      const forcedPlayers = forcedPlayersByDivisionId.get(division.id) ?? [];
      const allEntryByPlayerId = new Map(
        allEntries.map((entry) => [entry.playerId, entry]),
      );
      const entryByPlayerId = new Map(
        entries.map((entry) => [entry.playerId, entry]),
      );
      for (const player of forcedPlayers) {
        const existingEntry =
          entryByPlayerId.get(player.id) ?? allEntryByPlayerId.get(player.id);
        if (existingEntry) {
          existingEntry.manualOverride = true;
          if (!entryByPlayerId.has(player.id)) {
            entries.push(existingEntry);
            entryByPlayerId.set(player.id, existingEntry);
          }
          continue;
        }

        const forcedEntry: QualifierRankingBuildEntry = {
          playerId: player.id,
          playerName: player.playerName ?? 'Unnamed player',
          playerCountry: player.country ?? undefined,
          averagePercentage: 0,
          submittedCount: 0,
          manualOverride: true,
          songPercentages: new Map<number, number>(),
        };
        entries.push(forcedEntry);
        entryByPlayerId.set(player.id, forcedEntry);
      }

      entries = entries.sort((a, b) =>
        this.compareQualifierEntries(a, b, rulesetConfig.sortBy),
      );

      const minPercentageThreshold = this.normalizePercentageThreshold(
        rulesetConfig.advanceMinPercentage,
      );
      const advanceTopN = rulesetConfig.advanceTopN ?? 0;
      let recommendedEntries = entries;

      if (minPercentageThreshold !== undefined) {
        recommendedEntries = recommendedEntries.filter(
          (entry) =>
            entry.submittedCount >= totalSongs &&
            divisionSongIdsList.every((songId) => {
              const percentage = entry.songPercentages.get(songId);
              return (
                typeof percentage === 'number' &&
                !Number.isNaN(percentage) &&
                percentage >= minPercentageThreshold
              );
            }),
        );
      }

      if (advanceTopN > 0) {
        recommendedEntries = recommendedEntries.slice(0, advanceTopN);
      }

      const recommendedPlayerIds = new Set(
        recommendedEntries.map((entry) => entry.playerId),
      );
      const forcedRecommendedEntries = entries.filter(
        (entry) =>
          entry.manualOverride && !recommendedPlayerIds.has(entry.playerId),
      );
      if (forcedRecommendedEntries.length > 0) {
        recommendedEntries = [
          ...recommendedEntries,
          ...forcedRecommendedEntries.sort((a, b) =>
            this.compareQualifierEntries(a, b, rulesetConfig.sortBy),
          ),
        ];
      }

      const recommendedAdvances =
        minPercentageThreshold !== undefined || advanceTopN > 0
          ? recommendedEntries
          : undefined;

      const stripSongPercentages = ({
        songPercentages,
        ...entry
      }: (typeof entries)[number]): QualifierRankingEntry => entry;

      return {
        divisionId: division.id,
        divisionName: division.name,
        scoreLead: this.getDivisionScoreLead(division),
        totalSongs,
        rankings: entries.map(stripSongPercentages),
        recommendedAdvances: recommendedAdvances?.map(stripSongPercentages),
      };
    });

    return this.applyExclusiveQualifierPlacement(divisionRankings);
  }

  async listAdminSubmissions(): Promise<QualifierAdminSubmission[]> {
    const { songToDivisionIds } = await this.buildQualifierSongMaps();
    const songIds = Array.from(songToDivisionIds.keys());
    if (songIds.length === 0) {
      return [];
    }

    const submissions = await this.qualifierRepo.find({
      where: { song: { id: In(songIds) } },
    });

    return submissions.map((submission) => ({
      id: submission.id,
      percentage: Number(submission.percentage ?? 0),
      faPercentage:
        submission.faPercentage !== undefined
          ? Number(submission.faPercentage)
          : undefined,
      faPlusPercentage:
        submission.faPlusPercentage !== undefined
          ? Number(submission.faPlusPercentage)
          : undefined,
      screenshotUrl: submission.screenshotUrl,
      status: submission.status ?? 'pending',
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      player: {
        id: submission.player?.id,
        playerName: submission.player?.playerName ?? 'Unnamed player',
        country: submission.player?.country ?? undefined,
      },
      song: {
        id: submission.song?.id,
        title: submission.song?.title,
        group: submission.song?.group,
        difficulty: submission.song?.difficulty,
      },
      divisionIds: songToDivisionIds.get(submission.song?.id) ?? [],
    }));
  }

  async updateSubmissionStatus(
    submissionId: number,
    dto: UpdateQualifierSubmissionStatusDto,
  ) {
    const submission = await this.qualifierRepo.findOne({
      where: { id: submissionId },
    });
    if (!submission) {
      throw new NotFoundException(
        `Qualifier submission ${submissionId} not found`,
      );
    }
    submission.status = dto.status;
    return await this.qualifierRepo.save(submission);
  }

  async deleteSubmission(submissionId: number) {
    await this.qualifierRepo.delete(submissionId);
  }

  async upsert(
    playerId: number,
    songId: number,
    dto: CreateQualifierSubmissionDto,
  ) {
    const qualifierSongIds = await this.getQualifierSongIds();
    if (!qualifierSongIds.has(songId)) {
      throw new BadRequestException(`Song ${songId} is not a qualifier song`);
    }

    const player = await this.playerRepo.findOneBy({ id: playerId });
    if (!player) {
      throw new NotFoundException(`Player with id ${playerId} not found`);
    }

    const song = await this.songRepo.findOneBy({ id: songId });
    if (!song) {
      throw new NotFoundException(`Song with id ${songId} not found`);
    }

    const faPercentage =
      dto.faPercentage !== undefined ? dto.faPercentage : dto.percentage;
    const faPlusPercentage =
      dto.faPlusPercentage !== undefined ? dto.faPlusPercentage : dto.percentage;
    if (faPercentage === undefined && faPlusPercentage === undefined) {
      throw new BadRequestException(
        'At least one qualifier score is required',
      );
    }

    let submission = await this.qualifierRepo.findOne({
      where: { player: { id: playerId }, song: { id: songId } },
    });

    if (!submission) {
      submission = new QualifierSubmission();
      submission.player = player;
      submission.song = song;
      submission.status = 'pending';
    }

    submission.faPercentage = faPercentage;
    submission.faPlusPercentage = faPlusPercentage;
    submission.percentage = faPercentage ?? faPlusPercentage ?? 0;
    submission.screenshotUrl = dto.screenshotUrl?.trim() ?? '';

    return await this.qualifierRepo.save(submission);
  }

  async previewProgression(
    dto: PreviewQualifierProgressionDto,
  ): Promise<QualifierProgressionPreviewResponse> {
    return await this.buildQualifierProgressionPreview(dto, undefined, false);
  }

  async commitProgression(dto: CommitQualifierProgressionDto): Promise<{
    runId: string;
    assignedPlayers: number;
    alreadyInTarget: number;
    skippedByCapacity: number;
    clearedMatches: number;
    preview: QualifierProgressionPreviewResponse;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const clearTargetMatches = dto.clearTargetMatches ?? false;
      const preview = await this.buildQualifierProgressionPreview(
        dto,
        manager,
        clearTargetMatches,
      );

      const assignmentRows = preview.assignments.filter(
        (row) => row.status === 'ASSIGN',
      );
      const assignmentTargetMatchIds = Array.from(
        new Set(assignmentRows.map((row) => row.targetMatchId)),
      );
      const placementTargetMatchIds = Array.from(
        new Set(dto.placements.map((placement) => placement.targetMatchId)),
      );
      const targetMatchIds = clearTargetMatches
        ? placementTargetMatchIds
        : assignmentTargetMatchIds;

      const matchRepo = manager.getRepository(Match);
      const playerRepo = manager.getRepository(Player);
      const targetMatches = targetMatchIds.length
        ? await matchRepo.findBy({ id: In(targetMatchIds) })
        : [];
      const matchById = new Map(
        targetMatches.map((match) => [match.id, match]),
      );

      const dirtyMatches = new Map<number, Match>();
      if (clearTargetMatches) {
        for (const match of targetMatches) {
          match.players = [];
          dirtyMatches.set(match.id, match);
        }
      }

      const playerIds = Array.from(
        new Set(assignmentRows.map((row) => row.playerId)),
      );
      const players = playerIds.length
        ? await playerRepo.findBy({ id: In(playerIds) })
        : [];
      const playerById = new Map(players.map((player) => [player.id, player]));

      let assignedPlayers = 0;
      let alreadyInTarget = 0;
      let skippedByCapacity = 0;
      const occupancyByMatchId = new Map<number, number>();

      for (const row of assignmentRows) {
        const match = matchById.get(row.targetMatchId);
        const player = playerById.get(row.playerId);
        if (!match || !player) {
          continue;
        }

        const hasPlayer = (match.players ?? []).some((p) => p.id === player.id);
        if (hasPlayer) {
          alreadyInTarget += 1;
          continue;
        }

        const currentCount =
          occupancyByMatchId.get(match.id) ?? (match.players ?? []).length;
        const maxPlayers = this.getMatchCapacityFromSetups(match);
        if (maxPlayers !== undefined && currentCount >= maxPlayers) {
          skippedByCapacity += 1;
          continue;
        }

        match.players = [...(match.players ?? []), player];
        occupancyByMatchId.set(match.id, currentCount + 1);
        dirtyMatches.set(match.id, match);
        assignedPlayers += 1;
      }

      if (dirtyMatches.size > 0) {
        await matchRepo.save(Array.from(dirtyMatches.values()));
      }

      return {
        runId: `qualifier-${dto.divisionId}-${Date.now()}`,
        assignedPlayers,
        alreadyInTarget,
        skippedByCapacity,
        clearedMatches: clearTargetMatches ? targetMatches.length : 0,
        preview,
      };
    });
  }

  async previewWaterfall(
    dto: PreviewQualifierWaterfallDto,
  ): Promise<QualifierWaterfallPreviewResponse> {
    const plan = await this.buildWaterfallPlan(dto);
    return this.serializeWaterfallPlan(plan);
  }

  async commitWaterfall(dto: CommitQualifierWaterfallDto): Promise<{
    runId: string;
    phaseId: number;
    rulesetId: number;
    createdMatches: number;
    seededPlayers: number;
    preview: QualifierWaterfallPreviewResponse;
  }> {
    const plan = await this.buildWaterfallPlan(dto);

    return await this.dataSource.transaction(async (manager) => {
      const divisionRepo = manager.getRepository(Division);
      const phaseRepo = manager.getRepository(Phase);
      const matchRepo = manager.getRepository(Match);
      const rulesetRepo = manager.getRepository(Ruleset);
      const playerRepo = manager.getRepository(Player);

      const division = await divisionRepo.findOneBy({ id: plan.divisionId });
      if (!division) {
        throw new NotFoundException(`Division ${plan.divisionId} not found`);
      }

      if (dto.replaceExistingGeneratedPhase) {
        for (const phase of division.phases ?? []) {
          if (
            phase.name === plan.settings.phaseName &&
            this.canReplaceWaterfallPhase(phase)
          ) {
            await phaseRepo.remove(phase);
          }
        }
      }

      const phase = new Phase();
      phase.name = plan.settings.phaseName;
      phase.division = Promise.resolve(division);
      await phaseRepo.save(phase);

      const playerIds = Array.from(
        new Set(plan.seededEntries.map((entry) => entry.playerId)),
      );
      const players = playerIds.length
        ? await playerRepo.findBy({ id: In(playerIds) })
        : [];
      const playerById = new Map(players.map((player) => [player.id, player]));

      for (const plannedMatch of plan.matches) {
        const match = new Match();
        match.name = plannedMatch.name;
        match.subtitle = this.getWaterfallMatchSubtitle(plannedMatch);
        match.notes = 'Generated from qualifier waterfall seeding.';
        match.multiplier = 1;
        match.isManualMatch = false;
        match.scoringSystem = plan.settings.scoringSystem;
        match.players = (plannedMatch.seedPlayerIds ?? [])
          .map((playerId) => playerById.get(playerId))
          .filter((player): player is Player => !!player);
        match.rounds = [];
        match.phase = Promise.resolve(phase);
        await matchRepo.save(match);
        plannedMatch.persistedMatchId = match.id;
      }

      const ruleset = new Ruleset();
      ruleset.name = `Auto Waterfall - ${division.name}`;
      ruleset.description =
        'Generated from qualifier rankings. Edit only if you need custom routing.';
      ruleset.scope = 'PHASE';
      ruleset.isActive = true;
      ruleset.config = this.buildWaterfallRulesetConfig(plan, phase.id);
      await rulesetRepo.save(ruleset);

      phase.ruleset = ruleset;
      await phaseRepo.save(phase);

      const runId = `waterfall-${plan.divisionId}-${Date.now()}`;
      return {
        runId,
        phaseId: phase.id,
        rulesetId: ruleset.id,
        createdMatches: plan.matches.length,
        seededPlayers: plan.seededEntries.length,
        preview: this.serializeWaterfallPlan(plan),
      };
    });
  }

  private async buildQualifierProgressionPreview(
    dto: PreviewQualifierProgressionDto,
    manager?: EntityManager,
    clearTargetMatches = false,
  ): Promise<QualifierProgressionPreviewResponse> {
    this.validatePlacementRanges(dto);

    const divisionRepo = manager?.getRepository(Division) ?? this.divisionRepo;
    const division = await divisionRepo.findOneBy({ id: dto.divisionId });
    if (!division) {
      throw new NotFoundException(`Division ${dto.divisionId} not found`);
    }

    const targetMatchById = new Map<number, Match>();
    for (const phase of division.phases ?? []) {
      for (const match of phase.matches ?? []) {
        targetMatchById.set(match.id, match);
      }
    }

    for (const placement of dto.placements) {
      if (!targetMatchById.has(placement.targetMatchId)) {
        throw new BadRequestException(
          `Target match ${placement.targetMatchId} is not in division ${dto.divisionId}`,
        );
      }
    }

    const source = dto.useRecommendedAdvances
      ? 'RECOMMENDED_ADVANCES'
      : 'RANKINGS';
    const rankedEntries = (
      await this.getQualifierSeedEntries(
        dto.divisionId,
        dto.useRecommendedAdvances ?? false,
      )
    ).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    if (rankedEntries.length === 0) {
      throw new BadRequestException(
        `No qualifier ranking entries found for division ${dto.divisionId}`,
      );
    }

    const assignments: QualifierProgressionAssignment[] = [];
    const unassignedPlayers: RankedQualifierEntry[] = [];
    const occupancyByMatchId = new Map<number, number>();
    const existingPlayersByMatchId = new Map<number, Set<number>>();

    for (const [matchId, match] of targetMatchById.entries()) {
      const seedPlayers = clearTargetMatches ? [] : (match.players ?? []);
      occupancyByMatchId.set(matchId, seedPlayers.length);
      existingPlayersByMatchId.set(
        matchId,
        new Set(seedPlayers.map((player) => player.id)),
      );
    }

    for (const entry of rankedEntries) {
      const placement = dto.placements.find(
        (item) => entry.rank >= item.fromRank && entry.rank <= item.toRank,
      );
      if (!placement) {
        unassignedPlayers.push(entry);
        continue;
      }

      const targetMatch = targetMatchById.get(placement.targetMatchId);
      if (!targetMatch) {
        throw new BadRequestException(
          `Target match ${placement.targetMatchId} was not found`,
        );
      }

      const existingPlayers =
        existingPlayersByMatchId.get(targetMatch.id) ?? new Set<number>();
      if (existingPlayers.has(entry.playerId)) {
        assignments.push({
          ...entry,
          targetMatchId: targetMatch.id,
          targetMatchName: targetMatch.name,
          status: 'ALREADY_IN_TARGET',
        });
        continue;
      }

      const maxPlayers = this.getMatchCapacityFromSetups(targetMatch);
      const currentCount = occupancyByMatchId.get(targetMatch.id) ?? 0;
      if (maxPlayers !== undefined && currentCount >= maxPlayers) {
        assignments.push({
          ...entry,
          targetMatchId: targetMatch.id,
          targetMatchName: targetMatch.name,
          status: 'SKIPPED_CAPACITY',
        });
        continue;
      }

      existingPlayers.add(entry.playerId);
      existingPlayersByMatchId.set(targetMatch.id, existingPlayers);
      occupancyByMatchId.set(targetMatch.id, currentCount + 1);
      assignments.push({
        ...entry,
        targetMatchId: targetMatch.id,
        targetMatchName: targetMatch.name,
        status: 'ASSIGN',
      });
    }

    const boundaryTies = this.findBoundaryTies(rankedEntries, dto.placements);

    return {
      divisionId: division.id,
      divisionName: division.name,
      source,
      totalRankedPlayers: rankedEntries.length,
      assignments,
      unassignedPlayers,
      boundaryTies,
      summary: {
        assigned: assignments.filter((row) => row.status === 'ASSIGN').length,
        alreadyInTarget: assignments.filter(
          (row) => row.status === 'ALREADY_IN_TARGET',
        ).length,
        skippedByCapacity: assignments.filter(
          (row) => row.status === 'SKIPPED_CAPACITY',
        ).length,
        unassigned: unassignedPlayers.length,
      },
    };
  }

  private async buildWaterfallPlan(
    dto: PreviewQualifierWaterfallDto,
  ): Promise<WaterfallPlan> {
    const division = await this.divisionRepo.findOneBy({ id: dto.divisionId });
    if (!division) {
      throw new NotFoundException(`Division ${dto.divisionId} not found`);
    }

    const matchSize = Math.max(2, Math.floor(dto.matchSize ?? 10));
    const advanceCount = Math.max(
      1,
      Math.min(matchSize - 1, Math.floor(dto.advanceCount ?? 5)),
    );
    const finalistsCount = Math.max(
      advanceCount,
      Math.min(128, Math.floor(dto.finalistsCount ?? matchSize)),
    );
    const phaseName = dto.phaseName?.trim() || 'Tournament';
    const scoringSystem = dto.scoringSystem?.trim() || 'EurocupScoreCalculator';
    const useRecommendedAdvances = dto.useRecommendedAdvances ?? true;
    const seededEntries = (
      await this.getQualifierSeedEntries(dto.divisionId, useRecommendedAdvances)
    ).map((entry, index) => ({ ...entry, rank: index + 1 }));

    if (seededEntries.length === 0) {
      throw new BadRequestException(
        `No qualifier ranking entries found for division ${dto.divisionId}`,
      );
    }

    const matches: PlannedWaterfallMatch[] = [];
    let tempId = 1;
    const createMatch = (
      values: Omit<PlannedWaterfallMatch, 'tempId' | 'routes'>,
    ): PlannedWaterfallMatch => {
      const match: PlannedWaterfallMatch = {
        ...values,
        tempId: `m${tempId++}`,
        routes: [],
      };
      matches.push(match);
      return match;
    };

    if (seededEntries.length <= finalistsCount) {
      createMatch({
        name: 'Final',
        kind: 'FINAL',
        stage: 1,
        estimatedPlayerCount: seededEntries.length,
        seedFromRank: 1,
        seedToRank: seededEntries.length,
        seedPlayerIds: seededEntries.map((entry) => entry.playerId),
      });
    } else {
      const seedEntrySize = Math.max(1, matchSize - advanceCount);
      const firstRoundSeedCount = Math.min(matchSize, seededEntries.length);
      let seedCursorEnd = seededEntries.length - firstRoundSeedCount;

      let previousWinner = createMatch({
        name: 'Round 1 winner',
        kind: 'SEED',
        stage: 1,
        estimatedPlayerCount: firstRoundSeedCount,
        seedFromRank: seedCursorEnd + 1,
        seedToRank: seededEntries.length,
        seedPlayerIds: seededEntries
          .slice(seedCursorEnd, seededEntries.length)
          .map((entry) => entry.playerId),
      });
      let previousWinnerAdvanceCount = Math.min(
        advanceCount,
        previousWinner.estimatedPlayerCount,
      );
      let pendingLoserRoutes = this.buildWaterfallPendingRoutes(
        previousWinner,
        previousWinnerAdvanceCount + 1,
        previousWinner.estimatedPlayerCount,
        'SEND_TO_LOSERS',
      );

      let stage = 2;
      while (seedCursorEnd > 0 && previousWinnerAdvanceCount > 0) {
        const seedCount = Math.min(seedEntrySize, seedCursorEnd);
        const seedFromRank = seedCursorEnd - seedCount + 1;
        const seedToRank = seedCursorEnd;
        seedCursorEnd -= seedCount;

        const winner = createMatch({
          name: `Round ${stage} winner`,
          kind: 'WINNER',
          stage,
          estimatedPlayerCount: previousWinnerAdvanceCount + seedCount,
          seedFromRank,
          seedToRank,
          seedPlayerIds: seededEntries
            .slice(seedFromRank - 1, seedToRank)
            .map((entry) => entry.playerId),
        });
        this.addWaterfallRoute(
          previousWinner,
          1,
          previousWinnerAdvanceCount,
          'ADVANCE',
          winner,
        );

        const winnerAdvanceCount = Math.min(
          advanceCount,
          winner.estimatedPlayerCount,
        );
        const winnerDropRoutes = this.buildWaterfallPendingRoutes(
          winner,
          winnerAdvanceCount + 1,
          winner.estimatedPlayerCount,
          'SEND_TO_LOSERS',
        );
        const loserEntryCount =
          this.getWaterfallRouteCount(pendingLoserRoutes) +
          this.getWaterfallRouteCount(winnerDropRoutes);

        if (loserEntryCount > 0) {
          const loser = createMatch({
            name: `Round ${stage} loser`,
            kind: 'LOSER',
            stage,
            estimatedPlayerCount: loserEntryCount,
          });
          for (const route of [...pendingLoserRoutes, ...winnerDropRoutes]) {
            this.addWaterfallRoute(
              route.source,
              route.fromRank,
              route.toRank,
              route.action,
              loser,
            );
          }

          const loserAdvanceCount = Math.min(
            advanceCount,
            loser.estimatedPlayerCount,
          );
          pendingLoserRoutes = this.buildWaterfallPendingRoutes(
            loser,
            1,
            loserAdvanceCount,
            'ADVANCE',
          );
          this.addWaterfallEliminationRoute(
            loser,
            loserAdvanceCount + 1,
            loser.estimatedPlayerCount,
          );
        } else {
          pendingLoserRoutes = [];
        }

        previousWinner = winner;
        previousWinnerAdvanceCount = winnerAdvanceCount;
        stage += 1;
      }

      const finalEntryCount =
        previousWinnerAdvanceCount +
        this.getWaterfallRouteCount(pendingLoserRoutes);
      if (finalEntryCount > 0) {
        const finalMatch = createMatch({
          name: 'Final',
          kind: 'FINAL',
          stage,
          estimatedPlayerCount: finalEntryCount,
        });
        this.addWaterfallRoute(
          previousWinner,
          1,
          previousWinnerAdvanceCount,
          'ADVANCE',
          finalMatch,
        );
        for (const route of pendingLoserRoutes) {
          this.addWaterfallRoute(
            route.source,
            route.fromRank,
            route.toRank,
            route.action,
            finalMatch,
          );
        }
      }
    }

    return {
      divisionId: division.id,
      divisionName: division.name,
      source: useRecommendedAdvances ? 'RECOMMENDED_ADVANCES' : 'RANKINGS',
      seededEntries,
      settings: {
        phaseName,
        matchSize,
        advanceCount,
        finalistsCount,
        scoringSystem,
      },
      matches,
    };
  }

  private buildWaterfallPendingRoutes(
    source: PlannedWaterfallMatch,
    startRank: number,
    endRank: number,
    action: Exclude<WaterfallRouteAction, 'ELIMINATE'>,
  ): PendingWaterfallRoute[] {
    if (startRank > endRank || endRank < 1) {
      return [];
    }
    return [{ source, fromRank: startRank, toRank: endRank, action }];
  }

  private getWaterfallRouteCount(routes: PendingWaterfallRoute[]): number {
    return routes.reduce(
      (sum, route) => sum + Math.max(route.toRank - route.fromRank + 1, 0),
      0,
    );
  }

  private addWaterfallRoute(
    source: PlannedWaterfallMatch,
    fromRank: number,
    toRank: number,
    action: Exclude<WaterfallRouteAction, 'ELIMINATE'>,
    target: PlannedWaterfallMatch,
  ) {
    if (fromRank > toRank || toRank < 1) {
      return;
    }
    source.routes.push({
      fromRank,
      toRank,
      count: toRank - fromRank + 1,
      action,
      targetTempId: target.tempId,
    });
  }

  private addWaterfallEliminationRoute(
    source: PlannedWaterfallMatch,
    fromRank: number,
    toRank: number,
  ) {
    if (fromRank > toRank || toRank < 1) {
      return;
    }
    source.routes.push({
      fromRank,
      toRank,
      count: toRank - fromRank + 1,
      action: 'ELIMINATE',
    });
  }

  private serializeWaterfallPlan(
    plan: WaterfallPlan,
  ): QualifierWaterfallPreviewResponse {
    const matchByTempId = new Map(
      plan.matches.map((match) => [match.tempId, match]),
    );
    const countByKind = (kind: WaterfallMatchKind) =>
      plan.matches.filter((match) => match.kind === kind).length;

    return {
      divisionId: plan.divisionId,
      divisionName: plan.divisionName,
      source: plan.source,
      totalSeededPlayers: plan.seededEntries.length,
      settings: plan.settings,
      matches: plan.matches.map(({ seedPlayerIds, routes, ...match }) => ({
        ...match,
        routes: routes.map((route) => {
          const target = route.targetTempId
            ? matchByTempId.get(route.targetTempId)
            : undefined;
          return {
            ...route,
            targetMatchName: target?.name,
            targetMatchId: target?.persistedMatchId,
          };
        }),
      })),
      summary: {
        seedMatches: countByKind('SEED'),
        winnerMatches: countByKind('WINNER'),
        loserMatches: countByKind('LOSER'),
        finalMatches: countByKind('FINAL'),
        generatedMatches: plan.matches.length,
      },
    };
  }

  private buildWaterfallRulesetConfig(plan: WaterfallPlan, phaseId: number) {
    const matchByTempId = new Map(
      plan.matches.map((match) => [match.tempId, match]),
    );
    return {
      tiePolicy: 'MANUAL_EXTRA_SONG',
      generatedBy: 'QUALIFIER_WATERFALL',
      generatedAt: new Date().toISOString(),
      settings: plan.settings,
      notes:
        'Generated after qualifier seeding. Each step maps one generated match to its next winner/loser target.',
      steps: plan.matches
        .filter((match) => match.routes.length > 0)
        .map((match) => ({
          name: match.name,
          sourceMatchId: match.persistedMatchId,
          rules: this.buildWaterfallRules(match, matchByTempId, phaseId),
        })),
    };
  }

  private buildWaterfallRules(
    match: PlannedWaterfallMatch,
    matchByTempId: Map<string, PlannedWaterfallMatch>,
    phaseId: number,
  ) {
    return match.routes.map((route) => {
      if (route.action === 'ELIMINATE') {
        return {
          type: 'ELIMINATE_BOTTOM_N',
          count: route.count,
        };
      }

      const target = route.targetTempId
        ? matchByTempId.get(route.targetTempId)
        : undefined;
      return {
        type: 'SEND_RANK_RANGE_TO_PHASE',
        fromRank: route.fromRank,
        toRank: route.toRank,
        targetPhaseId: phaseId,
        targetMatchId: target?.persistedMatchId,
        lane: route.action === 'SEND_TO_LOSERS' ? 'LOSERS' : 'WINNERS',
      };
    });
  }

  private canReplaceWaterfallPhase(phase: Phase): boolean {
    const generatedBy = phase.ruleset?.config?.generatedBy;
    if (generatedBy === 'QUALIFIER_WATERFALL') {
      return true;
    }

    return (phase.matches ?? []).every(
      (match) =>
        (match.players ?? []).length === 0 && (match.rounds ?? []).length === 0,
    );
  }

  private getWaterfallMatchSubtitle(match: PlannedWaterfallMatch): string {
    if (match.seedFromRank && match.seedToRank) {
      return `Qualifier ranks ${match.seedFromRank}-${match.seedToRank}`;
    }
    if (match.kind === 'FINAL') {
      return 'Generated final';
    }
    return `Generated ${match.kind.toLowerCase()} stage ${match.stage}`;
  }

  private extractQualifierSongs(
    phase,
    submissions: QualifierSubmission[],
  ): QualifierSong[] {
    const songs: Song[] = [];
    const seen = new Set<number>();

    for (const match of phase.matches || []) {
      for (const round of match.rounds || []) {
        const song = round.song;
        if (song && !seen.has(song.id)) {
          seen.add(song.id);
          songs.push(song);
        }
      }
    }

    return songs.map((song) => ({
      song,
      submission: submissions.find((s) => s.song.id === song.id),
    }));
  }

  private async buildQualifierSongMaps(): Promise<{
    divisionSongIds: Map<number, Set<number>>;
    songToDivisionIds: Map<number, number[]>;
  }> {
    const divisions = await this.divisionRepo.find();
    const divisionSongIds = new Map<number, Set<number>>();
    const songToDivisionIds = new Map<number, number[]>();

    for (const division of divisions) {
      const phases = (division.phases || []).filter((phase) =>
        this.isQualifierPhase(phase),
      );
      const songIds = new Set<number>();

      for (const phase of phases) {
        for (const match of phase.matches || []) {
          for (const round of match.rounds || []) {
            const songId = round.song?.id;
            if (!songId) {
              continue;
            }
            songIds.add(songId);
            const existing = songToDivisionIds.get(songId) ?? [];
            if (!existing.includes(division.id)) {
              existing.push(division.id);
              songToDivisionIds.set(songId, existing);
            }
          }
        }
      }

      divisionSongIds.set(division.id, songIds);
    }

    return { divisionSongIds, songToDivisionIds };
  }

  private isQualifierPhase(phase: {
    name?: string;
    ruleset?: { name?: string; scope?: string };
  }): boolean {
    const rulesetScope = phase.ruleset?.scope?.trim().toUpperCase() ?? '';
    if (rulesetScope === 'QUALIFIER') {
      return true;
    }

    const rulesetName = phase.ruleset?.name?.trim().toLowerCase() ?? '';
    if (rulesetName.includes('qualifier') || rulesetName.includes('seeding')) {
      return true;
    }

    // Backward compatibility for older data that encoded this in the phase name.
    const phaseName = phase.name?.toLowerCase() ?? '';
    return phaseName.includes('qualifier') || phaseName.includes('seeding');
  }

  private async getQualifierSongIds(): Promise<Set<number>> {
    const { songToDivisionIds } = await this.buildQualifierSongMaps();
    return new Set(songToDivisionIds.keys());
  }

  private getQualifierRulesetConfig(
    config: Record<string, unknown> | undefined,
  ): QualifierRulesetConfig {
    if (!config || typeof config !== 'object') {
      return {};
    }
    return config as QualifierRulesetConfig;
  }

  private getQualifierRulesetConfigForDivision(
    division: Division,
  ): QualifierRulesetConfig {
    const qualifierPhaseRuleset = (division.phases || [])
      .filter((phase) => this.isQualifierPhase(phase))
      .map((phase) => phase.ruleset)
      .find((ruleset) => !!ruleset);
    return this.getQualifierRulesetConfig(qualifierPhaseRuleset?.config);
  }

  private getQualifierPhaseRulesetConfig(
    config: Record<string, unknown> | undefined,
  ): Pick<QualifierPhase, 'advanceMinPercentage' | 'minimumSubmissions'> {
    const rulesetConfig = this.getQualifierRulesetConfig(config);
    return {
      advanceMinPercentage: this.normalizePercentageThreshold(
        rulesetConfig.advanceMinPercentage,
      ),
      minimumSubmissions:
        typeof rulesetConfig.minimumSubmissions === 'number' &&
        Number.isFinite(rulesetConfig.minimumSubmissions)
          ? Math.max(0, Math.floor(rulesetConfig.minimumSubmissions))
          : undefined,
    };
  }

  private async getForcedQualifierPlayersByDivision(): Promise<
    Map<number, Player[]>
  > {
    const players = await this.playerRepo.find();
    const forcedPlayersByDivisionId = new Map<number, Player[]>();

    for (const player of players) {
      for (const divisionId of player.forcedDivisionIds ?? []) {
        if (!Number.isInteger(divisionId) || divisionId < 1) {
          continue;
        }
        const playersForDivision =
          forcedPlayersByDivisionId.get(divisionId) ?? [];
        playersForDivision.push(player);
        forcedPlayersByDivisionId.set(divisionId, playersForDivision);
      }
    }

    return forcedPlayersByDivisionId;
  }

  private compareQualifierEntries(
    a: QualifierRankingEntry,
    b: QualifierRankingEntry,
    sortBy: QualifierRulesetConfig['sortBy'] = 'AVERAGE_PERCENTAGE',
  ): number {
    if (sortBy === 'SUBMITTED_COUNT') {
      if (b.submittedCount !== a.submittedCount) {
        return b.submittedCount - a.submittedCount;
      }
      if (b.averagePercentage !== a.averagePercentage) {
        return b.averagePercentage - a.averagePercentage;
      }
      return a.playerName.localeCompare(b.playerName);
    }

    if (sortBy === 'PLAYER_NAME') {
      return a.playerName.localeCompare(b.playerName);
    }

    if (b.averagePercentage !== a.averagePercentage) {
      return b.averagePercentage - a.averagePercentage;
    }
    if (b.submittedCount !== a.submittedCount) {
      return b.submittedCount - a.submittedCount;
    }
    return a.playerName.localeCompare(b.playerName);
  }

  private normalizePercentageThreshold(
    value: number | undefined,
  ): number | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }
    return Math.max(0, Math.min(100, value));
  }

  private async getQualifierSeedEntries(
    divisionId: number,
    useRecommendedAdvances: boolean,
  ): Promise<QualifierRankingEntry[]> {
    const divisionRanking = (await this.rankings()).find(
      (division) => division.divisionId === divisionId,
    );
    if (!divisionRanking) {
      throw new NotFoundException(`Division ${divisionId} not found`);
    }

    if (useRecommendedAdvances) {
      if (!divisionRanking.recommendedAdvances) {
        throw new BadRequestException(
          `Division ${divisionId} has no recommended qualifier advances configured`,
        );
      }
      return divisionRanking.recommendedAdvances.map((entry) => ({ ...entry }));
    }

    return divisionRanking.rankings.map((entry) => ({ ...entry }));
  }

  private applyExclusiveQualifierPlacement(
    divisionRankings: QualifierDivisionRanking[],
  ): QualifierDivisionRanking[] {
    const divisionByPlayerId = new Map<
      number,
      { divisionId: number; strength: number }
    >();

    divisionRankings.forEach((divisionRanking) => {
      const strength = this.getDivisionStrength(divisionRanking.divisionName);
      if (strength === 0) {
        return;
      }

      for (const entry of divisionRanking.recommendedAdvances ?? []) {
        const existing = divisionByPlayerId.get(entry.playerId);
        if (
          existing &&
          (existing.strength > strength || existing.strength === strength)
        ) {
          continue;
        }

        divisionByPlayerId.set(entry.playerId, {
          divisionId: divisionRanking.divisionId,
          strength,
        });
      }
    });

    return divisionRankings.map((divisionRanking) => ({
      ...divisionRanking,
      rankings: divisionRanking.rankings.filter((entry) => {
        const targetDivision = divisionByPlayerId.get(entry.playerId);
        return (
          !targetDivision ||
          targetDivision.divisionId === divisionRanking.divisionId
        );
      }),
      recommendedAdvances: divisionRanking.recommendedAdvances?.filter(
        (entry) =>
          divisionByPlayerId.get(entry.playerId)?.divisionId ===
          divisionRanking.divisionId,
      ),
    }));
  }

  private getDivisionStrength(divisionName: string): number {
    const normalizedName = divisionName.trim().toUpperCase();
    if (/\bHIGH\b/.test(normalizedName)) {
      return 3;
    }
    if (/\bMID\b/.test(normalizedName)) {
      return 2;
    }
    if (/\bLOW\b/.test(normalizedName)) {
      return 1;
    }
    return 0;
  }

  private getDivisionScoreLead(division?: Division): 'FA' | 'FA_PLUS' {
    return division?.scoreLead === 'FA_PLUS' ? 'FA_PLUS' : 'FA';
  }

  private getSubmissionLeadPercentage(
    submission: QualifierSubmission,
    scoreLead: 'FA' | 'FA_PLUS',
  ): number {
    const value =
      scoreLead === 'FA_PLUS'
        ? submission.faPlusPercentage ?? submission.percentage
        : submission.faPercentage ?? submission.percentage;
    const percentage = Number(value ?? 0);
    return Number.isNaN(percentage) ? 0 : percentage;
  }

  private validatePlacementRanges(dto: PreviewQualifierProgressionDto) {
    const ordered = [...dto.placements].sort((a, b) => a.fromRank - b.fromRank);
    for (const placement of ordered) {
      if (placement.fromRank > placement.toRank) {
        throw new BadRequestException(
          `Invalid placement ${placement.fromRank}-${placement.toRank}; fromRank must be <= toRank`,
        );
      }
    }

    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1];
      const current = ordered[i];
      if (current.fromRank <= prev.toRank) {
        throw new BadRequestException(
          `Placement ranges overlap (${prev.fromRank}-${prev.toRank} and ${current.fromRank}-${current.toRank})`,
        );
      }
    }
  }

  private findBoundaryTies(
    rankedEntries: RankedQualifierEntry[],
    placements: PreviewQualifierProgressionDto['placements'],
  ): QualifierProgressionBoundaryTie[] {
    if (rankedEntries.length < 2) {
      return [];
    }

    const placementByRank = new Map<number, number | undefined>();
    for (const entry of rankedEntries) {
      const placement = placements.find(
        (item) => entry.rank >= item.fromRank && entry.rank <= item.toRank,
      );
      placementByRank.set(entry.rank, placement?.targetMatchId);
    }

    const warnings: QualifierProgressionBoundaryTie[] = [];
    const seenGroups = new Set<string>();

    for (let index = 0; index < rankedEntries.length - 1; index++) {
      const current = rankedEntries[index];
      const next = rankedEntries[index + 1];
      const currentTarget = placementByRank.get(current.rank);
      const nextTarget = placementByRank.get(next.rank);

      if (currentTarget === nextTarget) {
        continue;
      }
      if (!this.sameQualifierMetrics(current, next)) {
        continue;
      }

      let start = index;
      while (
        start > 0 &&
        this.sameQualifierMetrics(rankedEntries[start - 1], current)
      ) {
        start -= 1;
      }
      let end = index + 1;
      while (
        end < rankedEntries.length - 1 &&
        this.sameQualifierMetrics(rankedEntries[end + 1], current)
      ) {
        end += 1;
      }

      const groupKey = `${rankedEntries[start].rank}-${rankedEntries[end].rank}`;
      if (seenGroups.has(groupKey)) {
        continue;
      }
      seenGroups.add(groupKey);

      const groupEntries = rankedEntries.slice(start, end + 1);
      warnings.push({
        fromRank: rankedEntries[start].rank,
        toRank: rankedEntries[end].rank,
        playerIds: groupEntries.map((entry) => entry.playerId),
        reason: `Tie metrics cross routing boundary near ranks ${current.rank}-${next.rank}`,
      });
    }

    return warnings;
  }

  private sameQualifierMetrics(
    a: QualifierRankingEntry,
    b: QualifierRankingEntry,
  ): boolean {
    return (
      a.averagePercentage === b.averagePercentage &&
      a.submittedCount === b.submittedCount
    );
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
