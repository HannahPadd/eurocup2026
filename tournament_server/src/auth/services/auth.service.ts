import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { AuthRefreshTokenDto } from '../dtos';

import { Account } from '@persistence/entities';
import { createHash, randomBytes } from 'crypto';
import { UpdateUserPlayerDto } from '@user/dtos';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        private jwtService: JwtService
    ) { }

    
    async validateUser(username: string, password: string) {
        const user = await this.accountRepo.findOneBy({ username });
        if (!user || !user.password) {
            throw new UnauthorizedException();
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException();
        }
        return user;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            username: user.username,     
            isAdmin: user.isAdmin,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            isAdmin: user.isAdmin
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

    async validateApiKey(apiKey: string) {
        const isValid = true;
        if (isValid) {
            return { id: 'api-client', role: 'user'};
        }
        return null;
    }

    async generateApiKey(req: any) {
        const buffer = randomBytes(32);
        const rawKey = `api_${buffer.toString('base64url')}`;
        const hashedKey = createHash('sha256').update(rawKey).digest('hex');

        const username = req;

        const user = await this.accountRepo.findOneBy({ username })
        
        if (!user) {
            console.log("user not found")
            return
        }
        
        console.log(user)
        user.tournamentManagerApi = hashedKey;
        await this.accountRepo.save(user);
        console.log(rawKey)
        return { rawKey };
    }
}
