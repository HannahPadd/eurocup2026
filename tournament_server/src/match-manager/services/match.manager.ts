import { Injectable, Inject } from '@nestjs/common';
import { MatchesService, RoundsService } from '../../tournament/services';
import { CreateRoundDto } from '../../tournament/dtos';
import { Match } from '@persistence/entities';
import { SongRoller } from './song.roller';
import { MatchGateway } from '../gateways/match.gateway';

@Injectable()
export class MatchManager {
    activeMatchId: number;
    activeMatch: Match;

    constructor(
        @Inject()
        private readonly matchService: MatchesService,
        @Inject()
        private readonly roundService: RoundsService,
        @Inject()
        private readonly songExtractor: SongRoller,
        @Inject()
        private readonly matchHub: MatchGateway
    ) { 
    }
    
    public async AddSongsToMatchById(matchId: number, songIds: number[]): Promise<void> {
        const match = await this.matchService.findOne(matchId);

        if (!match) {
            return;
        }

        await this.AddSongsToMatch(match, songIds);
    }

    public async AddRandomSongsToMatchById(matchId: number, divisionId: number, group: string, levels: string): Promise<void> {
        const match = await this.matchService.findOne(matchId);

        if (!match) {
            return;
        }

        await this.AddRandomSongsToMatch(match, divisionId, group, levels);
    }

    public async RemoveSongFromMatchById(matchId: number, songId: number): Promise<void> {
        const match = await this.matchService.findOne(matchId);

        if (!match) {
            return;
        }

        await this.RemoveSongFromMatch(match, songId);
    }

    private async RemoveSongFromMatch(match: Match, songId: number): Promise<void> {
        const round = match.rounds.find(round => round.song.id == songId);

        if (!round) {
            return;
        }

        //TODO: how to request "are you sure???" when standings are filled
        if(round.standings.length > 0){
            return;
        }

        await this.roundService.remove(round.id);
        match.rounds = match.rounds.filter(r => r.id !== round.id);
        await this.matchHub.OnMatchUpdate(match);
    }

    public async AddRandomSongsToMatch(match: Match, divisionId: number, group: string, levels: string): Promise<void> {
        const songIds = await this.songExtractor.RollSongs(divisionId, group, levels);

        await this.AddSongsToMatch(match, songIds);
    }

    public async AddSongsToMatch(match: Match, songIds: number[]): Promise<void> {
        if(!match.rounds){
            match.rounds = [];
        }
        for (const songId of songIds) {
            await this.AddSongToMatch(match, songId);
        }
        
        await this.matchHub.OnMatchUpdate(match);
    }

    private async AddSongToMatch(match: Match, songId: number): Promise<void> {
        const round = await this.roundService.create(this.GetRoundDto(match, songId));
        
        delete round.match;

        match.rounds.push(round);
    }

    private GetRoundDto(match: Match, songId: number): CreateRoundDto {
        const dto =  new CreateRoundDto();
        dto.matchId = match.id;
        dto.songId = songId;
        return dto;
    }
}
