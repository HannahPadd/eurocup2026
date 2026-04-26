import { Module } from '@nestjs/common';
import { PersistenceModule } from '@persistence/persistence.module';
import { Services, ScoreListenerService } from './services';
import { Controllers } from './controllers';

@Module({
    imports: [
        PersistenceModule
    ],
    providers: [...Services, ScoreListenerService],
    controllers: [...Controllers],
	exports: [ScoreListenerService]
})
export class TournamentModule {}
