import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './controllers';
import { LocalAuthGuard, RolesGuard } from './guards';
import { AuthService } from './services';
import { LocalStrategy } from './strategies';

import { AccountModule } from '@user/user.module';
import { PersistenceModule } from '@persistence/persistence.module';

import { JwtStrategy } from './strategies/jwt.strategy';


@Module({
    imports: [
        PersistenceModule,
        AccountModule,
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            global: true,
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '60s'},
            }),
        }),
    ],
    providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy
    ],
    controllers: [AuthController],
    exports: [AuthService]
})
export class AuthModule {}
