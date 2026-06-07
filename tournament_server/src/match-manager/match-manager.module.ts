import { Module } from '@nestjs/common';
import { PersistenceModule } from '@persistence/persistence.module';
import { MatchesService, SongService } from '../tournament/services';
import { RoundsService } from '../tournament/services';
import { TournamentModule } from 'src/tournament/tournament.module';
import { Services } from './services';
import { Gateways } from './gateways';
import { Services as TournamentModuleServices, ScoreListenerService } from '../tournament/services';
import { MatchAssignmentService } from '../tournament/services';
import { DivisionsService } from '../tournament/services';

@Module({
    imports: [
        PersistenceModule,
        TournamentModule
    ],
    providers: [
        ...TournamentModuleServices,
        ...Gateways,
        ...Services,
        ScoreListenerService,
    ],
    exports: [
        ...Services,
        ...Gateways,
    ],
    controllers: [

    ]
})
export class MatchManagerModule {}
