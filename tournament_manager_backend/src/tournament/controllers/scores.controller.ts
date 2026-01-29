import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { ScoresService } from '../services';
import { CreateScoreDto, UpdateScoreDto } from '../dtos';
import { Score } from '@persistence/entities'

@Controller('scores')
export class ScoresController {
    constructor(private readonly service: ScoresService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateScoreDto): Promise<Score> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Score[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Score | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateScoreDto): Promise<Score> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}
