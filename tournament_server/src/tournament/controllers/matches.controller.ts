import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe } from '@nestjs/common';
import { MatchesService } from '../services';
import { CommitPhaseProgressionDto, CreateMatchDto, UpdateMatchDto } from '../dtos';
import { Match } from '@persistence/entities';
import { PhaseProgressionService } from '../services/phase_progression.service';

@Controller('matches')
export class MatchesController {
    constructor(
        private readonly service: MatchesService,
        private readonly progressionService: PhaseProgressionService,
    ) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateMatchDto): Promise<Match> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Match[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Match | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateMatchDto): Promise<Match> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }

    @Post(':id/progression/preview')
    async previewProgression(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: CommitPhaseProgressionDto,
    ) {
        return await this.progressionService.previewMatch(id, dto.stepIndex);
    }

    @Post(':id/progression/commit')
    async commitProgression(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: CommitPhaseProgressionDto,
    ) {
        return await this.progressionService.commitMatch(
            id,
            dto.autoAssignPlayersToTargetMatches ?? true,
            dto.stepIndex,
        );
    }
}
