import { Injectable, Inject } from "@nestjs/common";
import { PlayerService, SongService, StandingsService, ScoresService } from '../../tournament/services';
import { LiveScore } from "../gateways/live.score.gateway"
import { CreateScoreDto, CreateStandingDto, UpdateStandingDto } from '../../tournament/dtos';
import { TournamentCache } from "./tournament.cache";
import { Standing, Player, Round, Match } from '@persistence/entities';
import { MatchGateway } from '../gateways/match.gateway';
import { ScoringSystemProvider } from './IScoringSystem'
import * as path from 'path';

@Injectable()
export class StandingManager {
    constructor(
        @Inject()
        private readonly standingService: StandingsService,
        @Inject()
        private readonly scoresService: ScoresService,
        @Inject()
        private readonly songService: SongService,
        @Inject()
        private readonly playerService: PlayerService,
        @Inject()
        private readonly tournamentCache: TournamentCache,
        @Inject()
        private readonly matchHub: MatchGateway,
        @Inject()
        private readonly scoringSystemProvider: ScoringSystemProvider
    ) { }

    async AddScore(score: CreateScoreDto) : Promise<Match> {

        const actualScoreEntity = await this.scoresService.create(score)

        const activeMatch = await this.tournamentCache.GetActiveMatch();
        
        if(!activeMatch) {
            //TODO: Log score added but no active match found
            return;
        }

        const round = activeMatch.rounds.find(round=> round.song.id == score.songId);

        if(!round) {
            //TODO: Log socre added but no round found in active match
            return;
        }
        
        const newStanding = new CreateStandingDto();
        
        newStanding.roundId = round.id;
        newStanding.scoreId = actualScoreEntity.id;
        newStanding.points = 0;
        
        const standing = await this.standingService.create(newStanding);

        round.standings.push(standing);

        const activePlayers = this.GetActivePlayers(activeMatch.players, round);
        const standings = this.GetStandingsOfActivePlayers(activePlayers, round);

        if(standings.length >= activePlayers.length) {
            const scoreSystem = this.scoringSystemProvider.getScoringSystem(activeMatch.scoringSystem);
            scoreSystem.recalc(standings);
            await this.recalc(standings);
        }

        await this.matchHub.OnMatchUpdate(activeMatch);

        return activeMatch;
    }

    async AddLiveScore(score: LiveScore) {      
        const song = await this.songService.findByName(path.basename(score.song));

        if (!song) {
            throw new Error(`Song with title ${score.song} not found`);
        }

        const player = await this.playerService.findByName(score.playerName);

        if (!player) {
            throw new Error(`Player with name ${score.playerName} not found`)
        }
        
        const newScore = new CreateScoreDto();

        newScore.playerId = player.id;
        newScore.songId = song.id;
        newScore.percentage = parseFloat(score.formattedScore);
        newScore.isFailed = score.isFailed;
        
        return await this.AddScore(newScore);
    }
    
    async recalc(standings: Standing[]) {
        standings.forEach(async standing => {
            const dto = new UpdateStandingDto();
            dto.points = standing.points;
            await this.standingService.update(standing.id, dto);   
        });
    }

    async RemoveStanding(playerId: number, songId: number) : Promise<Match> {
        const activeMatch = await this.tournamentCache.GetActiveMatch();
        
        if(!activeMatch) {
            //TODO: Log score added but no active match found
            return;
        }

        const round = activeMatch.rounds.find(round=> round.song.id == songId);

        if(!round) {
            //TODO: Log socre added but no round found in active match
            return;
        }
        try {

            let index = -1;

            for (let i = 0; i < round.standings.length; i++) {
                let standing = round.standings[i];

                if (standing.score.player.id == playerId && standing.score.song.id == songId) {
                    await this.standingService.remove(standing.id);
                    index = i;
                }
            }

            if(index != -1) {
                for (let i = 0; i < round.standings.length; i++) {
                    const standing = round.standings[i];
    
                    if (index == i) {
                        round.standings.splice(index, 1);
                    } else {
                        const dto = new UpdateStandingDto();
                        dto.points = 0;
                        await this.standingService.update(standing.id, dto)
                        standing.points = 0;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }

        this.matchHub.OnMatchUpdate(activeMatch);

        return activeMatch;
    }

    GetActivePlayers(players: Player[], round: Round) {
        const disabledPlayers = round.disabledPlayerIds ? round.disabledPlayerIds : [];

        return players.filter((value) => !disabledPlayers.some(disabledplayer => disabledplayer == value.id));
    }

    GetStandingsOfActivePlayers(players: Player[], round: Round) {
        return round.standings.filter(standing => players.some(player => standing.score.player.id == player.id));
    }
}