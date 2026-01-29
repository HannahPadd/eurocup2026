import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { MatchesService } from '../services';
import { CreateMatchDto, UpdateMatchDto } from '../dtos';
import { Match } from '@persistence/entities';

@Controller('matches')
export class MatchesController {
    constructor(private readonly service: MatchesService) { }

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
}
