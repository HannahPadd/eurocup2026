import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { DivisionsService } from '../services';
import { Division } from '@persistence/entities';
import { CreateDivisionDto, UpdateDivisionDto } from '../dtos';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Controller('divisions')
export class DivisionsController {
    constructor(private readonly service: DivisionsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateDivisionDto): Promise<Division> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Division[]> {
        const divisions = await this.service.findAll();
        return divisions;
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Division | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateDivisionDto): Promise<Division> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}
