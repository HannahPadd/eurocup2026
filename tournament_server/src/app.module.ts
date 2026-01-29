import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from '@auth/auth.module';
import { BackwardsCompatModule } from '@backwards-compat/backwards-compat.module';
import { MatchManagerModule } from '@match-manager/match-manager.module';
import { PersistenceModule } from '@persistence/persistence.module';
import { TournamentModule } from '@tournament/tournament.module';
import { AccountModule } from '@user/user.module';

import { Entities } from '@persistence/entities';

import { AuthService } from '@auth/services';
import { AuthController } from '@auth/controllers';


@Module({
  imports: [
  ConfigModule.forRoot({
  isGlobal: true,
    }),
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      type: 'mariadb',
      host: config.getOrThrow('DATABASE_HOST'),
      port: 3306,
      username: config.getOrThrow('DATABASE_USER'),
      password: config.getOrThrow('DATABASE_PASSWORD'),
      database: config.getOrThrow('DATABASE_NAME'),
      entities: Entities,
      synchronize: true,
      })
    }),
    PersistenceModule,
    AuthModule,
    AccountModule,
    TournamentModule,
    MatchManagerModule,
    BackwardsCompatModule,
   ],
  controllers:[
    AuthController
  ],
  providers: [
    AuthService
  ],
})
export class AppModule { }
