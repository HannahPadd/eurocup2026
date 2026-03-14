import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { AuthService } from '../services';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
    constructor(private authService: AuthService) {
        super(
            { header: 'x-api-key', prefix: '' },
            false
        );
    }
    
    async validate(apiKey: string, done: (err: Error | null, user?: any) => void) {
        console.log("valiating api key")
        const user = await this.authService.validateApiKey(apiKey);
        
        if (!user) {
            return done(new UnauthorizedException('Invalid API Key'), null);
        }
        
        return done(null, user);
    }
}