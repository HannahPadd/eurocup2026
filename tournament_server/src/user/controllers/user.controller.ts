import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Request, ValidationPipe, ConflictException, HttpException, UnprocessableEntityException } from '@nestjs/common';
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

    //@UseGuards(AuthGuard)
    //@Get('profile')
    //async getProfile(@Request() req) {
    //    return req.user;
    //}
}