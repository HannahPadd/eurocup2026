import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMatchDto, UpdateMatchDto } from '../dtos';
import { Phase, Player, Match } from '@persistence/entities';

export type MatchCompletionMissingRound = {
    roundId: number;
    songId: number;
    songTitle: string;
    requiredPlayers: number;
    submittedPlayers: number;
    missingPlayers: {
        id: number;
        playerName: string;
    }[];
};

export type MatchCompletionStatus = {
    matchId: number;
    matchName: string;
    ready: boolean;
    totalRounds: number;
    completedRounds: number;
    missingRounds: MatchCompletionMissingRound[];
};

@Injectable()
export class MatchesService{
    constructor(
        @InjectRepository(Match)
        private matchRepository: Repository<Match>,
        @InjectRepository(Phase)
        private phaseRepository: Repository<Phase>,
        @InjectRepository(Player)
        private playerRepository: Repository<Player>,
    ) { }

    async create(dto: CreateMatchDto) {
        const match = new Match();

        const phase = await this.phaseRepository.findOneBy({ id: dto.phaseId });

        if (!phase) {
            throw new NotFoundException(`Phase with ID ${dto.phaseId} not found`);
        }
        match.phase = Promise.resolve(phase);

        match.players = [];

        if (dto.playerIds && dto.playerIds.length > 0) {
            for (const playerId of dto.playerIds) {
                const player = await this.playerRepository.findOneBy({ id: playerId });

                if (!player) {
                    throw new NotFoundException(`Player with ID ${playerId} not found`);
                }
                match.players.push(player);
            }
        }

        match.multiplier = 1;
        match.scoringSystem = dto.scoringSystem;
        match.isManualMatch = false;
        match.name = dto.name;
        if(dto.notes){
            match.notes = dto.notes;
        }
        match.subtitle = dto.subtitle;

        await this.matchRepository.save(match);

        return match;
    }

    async findAll() {
        return await this.matchRepository.find();
    }

    async findOne(id: number) {
        return await this.matchRepository.findOneBy({ id });
    }

    async getCompletionStatus(id: number): Promise<MatchCompletionStatus> {
        const match = await this.findOne(id);

        if (!match) {
            throw new NotFoundException(`Match with ID ${id} not found`);
        }

        const missingRounds: MatchCompletionMissingRound[] = [];

        for (const round of match.rounds ?? []) {
            const disabledPlayerIds = new Set(round.disabledPlayerIds ?? []);
            const requiredPlayers = (match.players ?? []).filter(
                (player) => !disabledPlayerIds.has(player.id),
            );

            const latestStandingByPlayerId = new Map<number, number>();
            for (const standing of round.standings ?? []) {
                const playerId = standing.score?.player?.id;
                if (!playerId || disabledPlayerIds.has(playerId)) {
                    continue;
                }
                const previousStandingId = latestStandingByPlayerId.get(playerId) ?? 0;
                if (standing.id > previousStandingId) {
                    latestStandingByPlayerId.set(playerId, standing.id);
                }
            }

            const missingPlayers = requiredPlayers
                .filter((player) => !latestStandingByPlayerId.has(player.id))
                .map((player) => ({
                    id: player.id,
                    playerName: player.playerName ?? '',
                }));

            if (missingPlayers.length > 0) {
                missingRounds.push({
                    roundId: round.id,
                    songId: round.song?.id ?? 0,
                    songTitle: round.song?.title ?? '',
                    requiredPlayers: requiredPlayers.length,
                    submittedPlayers: requiredPlayers.length - missingPlayers.length,
                    missingPlayers,
                });
            }
        }

        return {
            matchId: match.id,
            matchName: match.name,
            ready: missingRounds.length === 0,
            totalRounds: match.rounds?.length ?? 0,
            completedRounds: (match.rounds?.length ?? 0) - missingRounds.length,
            missingRounds,
        };
    }

    async update(id: number, dto: UpdateMatchDto) {
        const match = await this.matchRepository.findOneBy({ id });

        if (!match) {
            throw new Error(`Match with ID ${id} not found`);
        }

        if (dto.phaseId) {
            const phase = await this.phaseRepository.findOneBy({ id: dto.phaseId });
            if (!phase) {
                throw new NotFoundException(`Phase with ID ${dto.phaseId} not found`);
            }
            match.phase = Promise.resolve(phase);
            delete dto.phaseId
        }

        if (dto.playerIds) {
            const players = [];
            for (const playerId of dto.playerIds) {
                const player = await this.playerRepository.findOneBy({ id: playerId });

                if (!player) {
                    throw new NotFoundException(`Player with ID ${playerId} not found`);
                }
                players.push(player);
            }

            dto.players = players
            delete dto.playerIds
        }

        this.matchRepository.merge(match, dto);
        
        return await this.matchRepository.save(match);
    }

    async remove(id: number) {
        const match = await this.findOne(id);
        
        if(!match) {
            return;
        }

        await this.matchRepository.remove(match);
    }
}
