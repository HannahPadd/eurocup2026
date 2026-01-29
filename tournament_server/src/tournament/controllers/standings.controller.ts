import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { StandingsService } from '../services';
import { CreateStandingDto, UpdateStandingDto } from '../dtos';
import { Standing } from '@persistence/entities'

@Controller('standings')
export class StandingsController {
    constructor(private readonly service: StandingsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateStandingDto): Promise<Standing> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Standing[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Standing | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateStandingDto): Promise<Standing> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}
