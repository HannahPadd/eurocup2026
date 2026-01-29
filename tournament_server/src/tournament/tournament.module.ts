import { Module } from '@nestjs/common';
import { PersistenceModule } from '@persistence/persistence.module';
import { Services } from './services';
import { Controllers } from './controllers';

@Module({
    imports: [
        PersistenceModule
    ],
    providers: [...Services],
    controllers: [...Controllers]
})
export class TournamentModule {}
