import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
    Division,
    Match,
    Phase,
    PhaseProgressionAction,
    PhaseProgressionResult,
    Player,
    Standing,
    Tournament,
} from '@persistence/entities';
import { CreateDivisionDto, UpdateDivisionDto } from '../dtos';

type DivisionRankingStatus = 'PLACED' | 'QUALIFIED' | 'ELIMINATED' | 'ACTIVE';

type DivisionRankingRow = {
    placement: number | null;
    liveRank?: number;
    playerId: number;
    playerName: string;
    country?: string;
    status: DivisionRankingStatus;
    phaseName?: string;
    matchName?: string;
    basis: string;
    source: 'FINAL_MATCH' | 'MATCH_RESULT' | 'PROGRESSION' | 'REGISTRATION';
    points?: number;
    averagePercentage?: number;
};

type RankingEntry = {
    player: Player;
    totalPoints: number;
    averagePercentage: number;
    failCount: number;
    scoreCount: number;
    rank: number;
};

type LatestMatchResult = {
    match: Match;
    phase: Phase;
    entry: RankingEntry;
    sourceOrder: number;
};

@Injectable()
export class DivisionsService {
    constructor(
        @InjectRepository(Division)
        private divisionRepository: Repository<Division>,
        @InjectRepository(Tournament)
        private tournamentRepository: Repository<Tournament>,
        @InjectRepository(Player)
        private playerRepository: Repository<Player>,
        @InjectRepository(PhaseProgressionResult)
        private progressionRepository: Repository<PhaseProgressionResult>,
    ) { }

    async create(dto: CreateDivisionDto) {
        let tournament = await this.tournamentRepository.findOneBy({ id: dto.tournamentId });

        if (!tournament) {
            const fallbackTournament = new Tournament();
            fallbackTournament.name = 'Default Tournament';
            tournament = await this.tournamentRepository.save(fallbackTournament);
        }

        const division = new Division();

        division.name = dto.name;
        division.tournament = tournament;

        await this.divisionRepository.save(division);

        return division;
    }

    async findAll() {
        return await this.divisionRepository.find();
    }

    async findOne(id: number) {
        return await this.divisionRepository.findOneBy({ id });
    }

    async ranking(id: number): Promise<{
        divisionId: number;
        divisionName: string;
        rows: DivisionRankingRow[];
    }> {
        const division = await this.divisionRepository.findOneBy({ id });
        if (!division) {
            throw new NotFoundException(`Division with ID ${id} not found`);
        }

        const phases = division.phases ?? [];
        const allMatches = phases.flatMap((phase) => phase.matches ?? []);
        const matchById = new Map(allMatches.map((match) => [match.id, match]));
        const matchOrder = new Map(
            [...allMatches]
                .sort((a, b) => a.id - b.id)
                .map((match, index) => [match.id, index]),
        );
        const phaseByMatchId = new Map<number, Phase>();
        for (const phase of phases) {
            for (const match of phase.matches ?? []) {
                phaseByMatchId.set(match.id, phase);
            }
        }

        const finalPhases = phases.filter((phase) => this.isFinalsPhase(phase));
        const finalPhaseIds = new Set(finalPhases.map((phase) => phase.id));
        const rows: DivisionRankingRow[] = [];
        const handledPlayerIds = new Set<number>();
        const latestMatchResults = this.getLatestMatchResults(phases, matchOrder);

        const finalMatches = finalPhases.flatMap((phase) => phase.matches ?? []);
        const finalsHaveScores = finalMatches.some((match) =>
            (match.rounds ?? []).some((round) => (round.standings ?? []).length > 0),
        );

        if (finalsHaveScores) {
            const finalRanking = this.buildRanking(finalMatches);
            for (const entry of finalRanking) {
                rows.push({
                    placement: entry.rank,
                    liveRank: entry.rank,
                    playerId: entry.player.id,
                    playerName: entry.player.playerName,
                    country: entry.player.country,
                    status: 'PLACED',
                    phaseName: finalPhases.map((phase) => phase.name).join(', '),
                    basis: 'Finals result',
                    source: 'FINAL_MATCH',
                    points: entry.totalPoints,
                    averagePercentage: entry.averagePercentage,
                });
                handledPlayerIds.add(entry.player.id);
            }
        } else {
            const qualifiedPlayers = this.collectUniquePlayers(finalMatches);
            for (const player of qualifiedPlayers) {
                const latest = latestMatchResults.get(player.id);
                rows.push({
                    placement: null,
                    liveRank: latest?.entry.rank,
                    playerId: player.id,
                    playerName: player.playerName,
                    country: player.country,
                    status: 'QUALIFIED',
                    phaseName: finalPhases.map((phase) => phase.name).join(', '),
                    matchName: latest?.match.name,
                    basis: 'Qualified for finals',
                    source: 'FINAL_MATCH',
                    points: latest?.entry.totalPoints,
                    averagePercentage: latest?.entry.averagePercentage,
                });
                handledPlayerIds.add(player.id);
            }
        }

        const phaseIds = phases.map((phase) => phase.id);
        const progressionRecords = phaseIds.length
            ? await this.progressionRepository.find({
                where: { phase: { id: In(phaseIds) } },
            })
            : [];
        const latestProgressionByPlayer = new Map<number, PhaseProgressionResult>();
        for (const record of progressionRecords) {
            const existing = latestProgressionByPlayer.get(record.player.id);
            if (!existing || record.id > existing.id) {
                latestProgressionByPlayer.set(record.player.id, record);
            }
        }

        if (!finalsHaveScores) {
            for (const record of progressionRecords) {
                const latestProgression = latestProgressionByPlayer.get(record.player.id);
                if (
                    latestProgression?.id === record.id &&
                    record.targetPhaseId &&
                    finalPhaseIds.has(record.targetPhaseId) &&
                    !handledPlayerIds.has(record.player.id)
                ) {
                    const latest = latestMatchResults.get(record.player.id);
                    rows.push({
                        placement: null,
                        liveRank: latest?.entry.rank,
                        playerId: record.player.id,
                        playerName: record.player.playerName,
                        country: record.player.country,
                        status: 'QUALIFIED',
                        phaseName: finalPhases.map((phase) => phase.name).join(', '),
                        matchName: latest?.match.name,
                        basis: 'Qualified for finals',
                        source: 'PROGRESSION',
                        points: latest?.entry.totalPoints,
                        averagePercentage: latest?.entry.averagePercentage,
                    });
                    handledPlayerIds.add(record.player.id);
                }
            }
        }

        const eliminated = Array.from(latestProgressionByPlayer.values()).filter(
            (record) =>
                record.action === PhaseProgressionAction.ELIMINATE &&
                !handledPlayerIds.has(record.player.id),
        ).sort((a, b) => {
            const aOrder = this.getProgressionSourceOrder(a, matchOrder);
            const bOrder = this.getProgressionSourceOrder(b, matchOrder);
            if (aOrder !== bOrder) {
                return bOrder - aOrder;
            }
            if (a.rankingPosition !== b.rankingPosition) {
                return a.rankingPosition - b.rankingPosition;
            }
            return a.player.playerName.localeCompare(b.player.playerName);
        });

        for (const [playerId, latest] of latestMatchResults) {
            const latestProgression = latestProgressionByPlayer.get(playerId);
            if (
                handledPlayerIds.has(playerId) ||
                latestProgression?.action === PhaseProgressionAction.ELIMINATE
            ) {
                continue;
            }

            rows.push({
                placement: null,
                liveRank: latest.entry.rank,
                playerId: latest.entry.player.id,
                playerName: latest.entry.player.playerName,
                country: latest.entry.player.country,
                status: 'ACTIVE',
                phaseName: latest.phase.name,
                matchName: latest.match.name,
                basis: latest.match.name,
                source: 'MATCH_RESULT',
                points: latest.entry.totalPoints,
                averagePercentage: latest.entry.averagePercentage,
            });
            handledPlayerIds.add(playerId);
        }

        const placementOffset = rows.filter(
            (row) => row.status === 'PLACED' || row.status === 'QUALIFIED',
        ).length;
        let previousEliminationKey = '';
        let currentPlacement = placementOffset;
        eliminated.forEach((record, index) => {
            const sourceMatchId = this.getProgressionSourceMatchId(record);
            const sourceMatch = sourceMatchId ? matchById.get(sourceMatchId) : undefined;
            const sourcePhase = sourceMatchId ? phaseByMatchId.get(sourceMatchId) : undefined;
            const latest = sourceMatchId
                ? this.buildRanking(sourceMatch ? [sourceMatch] : []).find(
                    (entry) => entry.player.id === record.player.id,
                )
                : latestMatchResults.get(record.player.id)?.entry;
            const eliminationKey = `${this.getProgressionSourceOrder(record, matchOrder)}-${record.rankingPosition}`;
            if (index === 0 || eliminationKey !== previousEliminationKey) {
                currentPlacement = placementOffset + index + 1;
            }
            previousEliminationKey = eliminationKey;

            rows.push({
                placement: placementOffset > 0 ? currentPlacement : null,
                liveRank: record.rankingPosition,
                playerId: record.player.id,
                playerName: record.player.playerName,
                country: record.player.country,
                status: 'ELIMINATED',
                phaseName: sourcePhase?.name ?? record.phase?.name,
                matchName: sourceMatch?.name,
                basis: sourceMatch ? `Eliminated in ${sourceMatch.name}` : 'Eliminated',
                source: 'PROGRESSION',
                points: latest?.totalPoints,
                averagePercentage: latest?.averagePercentage,
            });
            handledPlayerIds.add(record.player.id);
        });

        const registeredPlayers = await this.playerRepository
            .createQueryBuilder('player')
            .leftJoin('player.divisions', 'division')
            .where('division.id = :id', { id })
            .getMany();
        for (const player of registeredPlayers) {
            if (handledPlayerIds.has(player.id)) {
                continue;
            }
            rows.push({
                placement: null,
                playerId: player.id,
                playerName: player.playerName,
                country: player.country,
                status: 'ACTIVE',
                basis: 'Registered',
                source: 'REGISTRATION',
            });
        }

        return {
            divisionId: division.id,
            divisionName: division.name,
            rows: this.sortRankingRows(rows),
        };
    }

    async update(id: number, dto: UpdateDivisionDto) {
        const division = await this.divisionRepository.findOneBy({ id });

        if (!division) {
            throw new NotFoundException(`Division with ID ${id} not found`);
        }

        // Check and update tournament if provided
        if (dto.tournamentId) {
            const tournament = await this.tournamentRepository.findOneBy({ id: dto.tournamentId });
            if (!tournament) {
                throw new NotFoundException(`Tournament with ID ${dto.tournamentId} not found`);
            }
            division.tournament = tournament;
            delete dto.tournamentId;
        }

        this.divisionRepository.merge(division, dto);

        return await this.divisionRepository.save(division);
    }

    async remove(id: number) {
        await this.divisionRepository.delete(id);
    }

    private isFinalsPhase(phase: Phase): boolean {
        const phaseName = (phase.name ?? '').toLowerCase();
        const rulesetName = (phase.ruleset?.name ?? '').toLowerCase();
        return phaseName.includes('final') || rulesetName.includes('final');
    }

    private collectUniquePlayers(matches: Match[]): Player[] {
        const byId = new Map<number, Player>();
        for (const match of matches) {
            for (const player of match.players ?? []) {
                byId.set(player.id, player);
            }
        }
        return Array.from(byId.values()).sort((a, b) =>
            (a.playerName ?? '').localeCompare(b.playerName ?? ''),
        );
    }

    private buildRanking(matches: Match[]): RankingEntry[] {
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

        for (const match of matches) {
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

        const ranking = Array.from(byPlayer.values())
            .map((entry) => ({
                player: entry.player,
                totalPoints: entry.points,
                averagePercentage: entry.percentageCount
                    ? Number((entry.percentageTotal / entry.percentageCount).toFixed(4))
                    : 0,
                failCount: entry.failCount,
                scoreCount: entry.percentageCount,
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
                return (a.player.playerName ?? '').localeCompare(b.player.playerName ?? '');
            });

        for (let index = 0; index < ranking.length; index++) {
            if (index === 0) {
                ranking[index].rank = 1;
                continue;
            }
            const previous = ranking[index - 1];
            const current = ranking[index];
            ranking[index].rank =
                previous.totalPoints === current.totalPoints &&
                    previous.averagePercentage === current.averagePercentage &&
                    previous.failCount === current.failCount
                    ? previous.rank
                    : index + 1;
        }

        return ranking;
    }

    private getLatestMatchResults(
        phases: Phase[],
        matchOrder: Map<number, number>,
    ): Map<number, LatestMatchResult> {
        const latestByPlayer = new Map<number, LatestMatchResult>();

        for (const phase of phases) {
            for (const match of phase.matches ?? []) {
                const sourceOrder = matchOrder.get(match.id) ?? match.id;
                const ranking = this.buildRanking([match]).filter((entry) => entry.scoreCount > 0);
                for (const entry of ranking) {
                    const existing = latestByPlayer.get(entry.player.id);
                    if (!existing || sourceOrder > existing.sourceOrder) {
                        latestByPlayer.set(entry.player.id, {
                            match,
                            phase,
                            entry,
                            sourceOrder,
                        });
                    }
                }
            }
        }

        return latestByPlayer;
    }

    private sortRankingRows(rows: DivisionRankingRow[]): DivisionRankingRow[] {
        const statusOrder: Record<DivisionRankingStatus, number> = {
            PLACED: 0,
            QUALIFIED: 1,
            ACTIVE: 2,
            ELIMINATED: 3,
        };

        return [...rows].sort((a, b) => {
            if (a.placement && b.placement && a.placement !== b.placement) {
                return a.placement - b.placement;
            }
            if (a.placement && !b.placement) {
                return -1;
            }
            if (!a.placement && b.placement) {
                return 1;
            }
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            if ((a.liveRank ?? Number.MAX_SAFE_INTEGER) !== (b.liveRank ?? Number.MAX_SAFE_INTEGER)) {
                return (a.liveRank ?? Number.MAX_SAFE_INTEGER) - (b.liveRank ?? Number.MAX_SAFE_INTEGER);
            }
            if ((b.points ?? -1) !== (a.points ?? -1)) {
                return (b.points ?? -1) - (a.points ?? -1);
            }
            return a.playerName.localeCompare(b.playerName);
        });
    }

    private getProgressionSourceMatchId(record: PhaseProgressionResult): number | undefined {
        if (record.sourceMatchId) {
            return record.sourceMatchId;
        }
        const match = /^match-(\d+)-/.exec(record.runId ?? '');
        return match ? Number(match[1]) : undefined;
    }

    private getProgressionSourceOrder(
        record: PhaseProgressionResult,
        matchOrder: Map<number, number>,
    ): number {
        const sourceMatchId = this.getProgressionSourceMatchId(record);
        return sourceMatchId ? matchOrder.get(sourceMatchId) ?? -1 : -1;
    }
}
