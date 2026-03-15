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
import { CreateUserPlayerDto, UpdateUserPlayerDto } from '@user/dtos';
import { LocalAuthGuard, RolesGuard, JwtAuthGuard } from '@auth/guards';
import { UpdateAccountPlayerDto, UpdateAcountDto } from '@tournament/dtos';
import { Public } from '@auth/public.decorator';


@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService
    ) { }

    @Public()
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

    @Post()
    async create(@Body() createUserPlayerDto: CreateUserPlayerDto) {
        this.userService.create(createUserPlayerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        console.log("getProfile")
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Post('genapi')
    async generateApiKey(@Request() req) {
        console.log("Generating API key for user:", req.user.username);
        return await this.authService.generateApiKey(req.user.username);
    }

    @UseGuards(JwtAuthGuard)
    @Get('refresh')
    async getRefreshToken(@Body(new ValidationPipe()) refreshToken: AuthRefreshTokenDto) {
        return await this.authService.getRefreshToken(refreshToken);
    }
}