import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { TournamentsService } from '../services';
import { Tournament } from '@persistence/entities';
import { CreateTournamentDto, UpdateTournamentDto } from '../dtos';

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly service: TournamentsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateTournamentDto): Promise<Tournament> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Tournament[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Tournament | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateTournamentDto): Promise<Tournament> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}