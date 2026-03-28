import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  ConflictException,
  HttpException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

import { UserService } from '../services';
import { CreateUserPlayerDto, UpdateUserPlayerDto } from '../dtos';

import { Account } from '@persistence/entities';
import { Public } from '@auth/public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  //TODO: avoid duplicate registrations
  @Public()
  @Post()
  async create(@Body(new ValidationPipe()) dto: CreateUserPlayerDto) {
    return await this.service.create(dto);
  }

  @Public()
  @Get('registration-prefill')
  async getRegistrationPrefill(@Query('gamerTag') gamerTag: string) {
    if (!gamerTag || !gamerTag.trim()) {
      throw new UnprocessableEntityException('Gamer tag is required');
    }
    const exists = this.service.checkForDuplicate(gamerTag);
    console.log(`exists ${exists}`)
    if (!exists) {
      throw new UnprocessableEntityException('Username already exists');
    }
    return await this.service.getRegistrationPrefillByGamerTag(gamerTag);
  }

  //@UseGuards(AuthGuard)
  //@Get('profile')
  //async getProfile(@Request() req) {
  //    return req.user;
  //}
}
