import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { AuthRefreshTokenDto } from '../dtos';

import { Account } from '@persistence/entities';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        private jwtService: JwtService
    ) { }

    
    async validateUser(username: string, password: string) {
        const user = await this.accountRepo.findOneBy({ username });
        const isMatch = await bcrypt.compare(password, user?.password);
        if (!isMatch) {
            throw new UnauthorizedException();
        }
        return user;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            username: user.username,
            //TODO: add roles
            roles: [],
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async getRefreshToken(authRefreshTokenDto: AuthRefreshTokenDto) : Promise<{ access_token: string}> {
        console.log(authRefreshTokenDto.accessToken);
        const refreshToken = authRefreshTokenDto.accessToken;
        const user = await this.accountRepo.findOneBy({ refreshToken });
        const isMatch = (refreshToken === user.refreshToken);
        if (!isMatch) {
            throw new UnauthorizedException();
        }
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}

