import { Injectable, Inject } from '@nestjs/common';
import { MatchesService } from '../../tournament/services';
import { Match } from '@persistence/entities';
import { MatchGateway } from '../gateways/match.gateway';
@Injectable()
export class TournamentCache {
    activeMatchId: number;
    activeMatch: Match;
    constructor(
        @Inject()
        private readonly matchService: MatchesService,
        @Inject()
        private readonly matchHub: MatchGateway
    ) {
        this.activeMatchId = 0;
        this.activeMatch = null;
    }

    public async SetActiveMatch(matchId: number) {
        if (matchId != this.activeMatchId) {
            this.activeMatchId = matchId;
            
            await this.matchHub.OnMatchUpdate(await this.GetActiveMatch());
        }
    }

    public async GetActiveMatch() : Promise<Match | null> {
        if(this.activeMatchId == 0)
            return null;

        return await this.matchService.findOne(this.activeMatchId);
    }
}
