import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { TeamsService } from '../services';
import { CreateTeamDto, UpdateTeamDto } from '../dtos';
import { Team } from '@persistence/entities'
import { Public } from '@auth/public.decorator';

@Controller('teams')
export class TeamsController {
    constructor(private readonly service: TeamsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateTeamDto): Promise<Team> {
        return await this.service.create(dto);
    }

    @Public()
    @Get()
    async findAll(): Promise<Team[]> {
        return await this.service.findAll();
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: number): Promise<Team | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateTeamDto): Promise<Team> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}