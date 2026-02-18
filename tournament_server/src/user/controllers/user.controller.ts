import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request, ValidationPipe, ConflictException, HttpException, UnprocessableEntityException } from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

import { UserService } from '../services';
import { CreateUserPlayerDto, UpdateUserPlayerDto } from '../dtos';

import { Account } from '@persistence/entities';

@Controller('user')
export class UserController {
    constructor(private readonly service: UserService) { }

    //TODO: avoid duplicate registrations
    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateUserPlayerDto) {
        return await this.service.create(dto);
    }

    @Get('registration-prefill')
    async getRegistrationPrefill(@Query('gamerTag') gamerTag: string) {
        if (!gamerTag || !gamerTag.trim()) {
            throw new UnprocessableEntityException('Gamer tag is required');
        }
        return await this.service.getRegistrationPrefillByGamerTag(gamerTag);
    }

    //@UseGuards(AuthGuard)
    //@Get('profile')
    //async getProfile(@Request() req) {
    //    return req.user;
    //}
}
