import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { SetupService } from '../services';
import {  Setup } from '@persistence/entities';
import { CreateSetupDto, UpdateSetupDto } from '../dtos';

@Controller('setups')
export class SetupController {
    constructor(private readonly service: SetupService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateSetupDto): Promise<Setup> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Setup[]> {
        const divisions = await this.service.findAll();
        return divisions;
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Setup | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateSetupDto): Promise<Setup> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}
