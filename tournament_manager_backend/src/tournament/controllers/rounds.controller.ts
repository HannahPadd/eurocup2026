import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { RoundsService } from '../services';
import { CreateRoundDto, UpdateRoundDto } from '../dtos';
import { Round } from '@persistence/entities'

@Controller('rounds')
export class RoundsController {
    constructor(private readonly service: RoundsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateRoundDto): Promise<Round> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Round[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Round | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateRoundDto): Promise<Round> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}
