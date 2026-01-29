import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { MatchAssignmentService } from '../services';
import { CreateMatchAssignmentDto, UpdateMatchAssignmentDto } from '../dtos';
import { MatchAssignment } from '@persistence/entities';

@Controller('matches')
export class MatchAssignmentController {
    constructor(private readonly service: MatchAssignmentService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateMatchAssignmentDto): Promise<MatchAssignment> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<MatchAssignment[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<MatchAssignment | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateMatchAssignmentDto): Promise<MatchAssignment> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}
