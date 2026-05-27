import { Module } from '@nestjs/common';
import { BackwardCompatibilityController } from './backwardcompatibility.controller';
import { TournamentModule } from 'src/tournament/tournament.module';
import { PersistenceModule } from '@persistence/persistence.module';
import { MatchManagerModule } from 'src/match-manager/match-manager.module';

@Module({
    imports: [
        PersistenceModule,
        TournamentModule,
        MatchManagerModule
    ],
    controllers: [BackwardCompatibilityController],
    providers: [],
})
export class BackwardsCompatModule {}
