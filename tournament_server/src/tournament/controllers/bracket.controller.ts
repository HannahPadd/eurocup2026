import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { DivisionsService } from '../services';
import { Division } from '@persistence/entities';
import { CreateDivisionDto, UpdateDivisionDto } from '../dtos';
import { Public } from '@auth/public.decorator';

@Controller('bracket')
export class BracketController {
    constructor(private readonly service: DivisionsService) { }

    @Public()
    @Get()
    async findAll(): Promise<Division[]> {
        const divisions = await this.service.findAll();
        return divisions;
    }
    
    @Public()
    @Get(':id')
    findOne(@Param('id') id: number): Promise<Division | null> {
        return this.service.findOne(id); 
    }
}
