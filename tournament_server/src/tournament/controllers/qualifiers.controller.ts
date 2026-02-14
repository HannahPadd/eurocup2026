import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { QualifiersService } from '../services/qualifiers.service';
import { CreateQualifierSubmissionDto, UpdateQualifierSubmissionStatusDto } from '../dtos';

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

  @Get('qualifiers/admin/submissions')
  async adminSubmissions() {
    return await this.service.listAdminSubmissions();
  }

  @Patch('qualifiers/admin/submissions/:id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdateQualifierSubmissionStatusDto
  ) {
    return await this.service.updateSubmissionStatus(id, dto);
  }

  @Delete('qualifiers/admin/submissions/:id')
  async deleteSubmission(@Param('id', ParseIntPipe) id: number) {
    return await this.service.deleteSubmission(id);
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
