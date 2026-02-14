import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, ValidationPipe } from '@nestjs/common';
import { QualifiersService } from '../services/qualifiers.service';
import { CreateQualifierSubmissionDto } from '../dtos';

@Controller()
export class QualifiersController {
  constructor(private readonly service: QualifiersService) {}

  @Get('qualifiers')
  async list(@Query('playerId') playerId?: string) {
    const parsedPlayerId = playerId ? Number(playerId) : undefined;
    if (playerId && Number.isNaN(parsedPlayerId)) {
      throw new BadRequestException('playerId must be a number');
    }
    return await this.service.list(parsedPlayerId);
  }

  @Get('qualifiers/rankings')
  async rankings() {
    return await this.service.rankings();
  }

  @Post('qualifier/:playerId/:songId')
  async upsert(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body(new ValidationPipe()) dto: CreateQualifierSubmissionDto
  ) {
    return await this.service.upsert(playerId, songId, dto);
  }
}
