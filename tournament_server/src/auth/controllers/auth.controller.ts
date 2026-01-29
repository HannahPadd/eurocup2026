import { 
    Body,
    Controller,
    ValidationPipe, 
    Post, 
    Get, 
    Request, 
    UseGuards } from '@nestjs/common';

import { AuthService } from '../services';
import { AuthRefreshTokenDto } from '../dtos';
import { Roles } from '../decorators';

import { UserService } from '@user/services';
import { CreateUserPlayerDto } from '@user/dtos';
import { LocalAuthGuard, RolesGuard, JwtAuthGuard } from '@auth/guards';


@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @UseGuards(LocalAuthGuard)
    @Post('logout')
    async logout(@Request() req) {
        return req.logout();
    }

    @UseGuards(LocalAuthGuard, RolesGuard)
    @Post()
    @Roles(['admin'])
    async create(@Body() createUserPlayerDto: CreateUserPlayerDto) {
        this.userService.create(createUserPlayerDto);
    }

    //@UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        console.log("getProfile")
        return req.user;
    }

    @Get('refresh')
    async getRefreshToken(@Body(new ValidationPipe()) refreshToken: AuthRefreshTokenDto) {
        return await this.authService.getRefreshToken(refreshToken);
    }
}