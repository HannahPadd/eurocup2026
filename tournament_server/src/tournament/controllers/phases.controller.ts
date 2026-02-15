import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe } from '@nestjs/common';
import { PhasesService } from '../services';
import { Phase } from '@persistence/entities';
import { CommitPhaseProgressionDto, CreatePhaseDto, UpdatePhaseDto } from '../dtos';
import { PhaseProgressionService } from '../services/phase_progression.service';

@Controller('phases')
export class PhasesController {
    constructor(
        private readonly service: PhasesService,
        private readonly progressionService: PhaseProgressionService,
    ) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreatePhaseDto): Promise<Phase> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Phase[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Phase | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdatePhaseDto): Promise<Phase> {
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
        return await this.progressionService.preview(id, dto.stepIndex);
    }

    @Post(':id/progression/commit')
    async commitProgression(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: CommitPhaseProgressionDto,
    ) {
        return await this.progressionService.commit(
            id,
            dto.autoAssignPlayersToTargetMatches ?? true,
            dto.stepIndex,
        );
    }
}
