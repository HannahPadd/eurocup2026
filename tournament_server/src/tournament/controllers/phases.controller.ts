import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { PhasesService } from '../services';
import { Phase } from '@persistence/entities';
import { CreatePhaseDto, UpdatePhaseDto } from '../dtos';

@Controller('phases')
export class PhasesController {
    constructor(private readonly service: PhasesService) { }

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
    
}