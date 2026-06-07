import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe } from '@nestjs/common';
import { DivisionsService } from '../services';
import { Division } from '@persistence/entities';
import { CreateDivisionDto, UpdateDivisionDto } from '../dtos';
import { Public } from '@auth/public.decorator';

@Controller('divisions')
export class DivisionsController {
    constructor(private readonly service: DivisionsService) { }

    @Public()
    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateDivisionDto): Promise<Division> {
        return await this.service.create(dto);
    }

    @Public()
    @Get()
    async findAll(): Promise<Division[]> {
        const divisions = await this.service.findAll();
        return divisions;
    }

    @Public()
    @Get(':id/ranking')
    ranking(@Param('id', ParseIntPipe) id: number) {
        return this.service.ranking(id);
    }

    @Public()
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
