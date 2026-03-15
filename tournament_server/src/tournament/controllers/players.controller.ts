import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { PlayerService } from '../services';
import { CreatePlayerDto, UpdatePlayerDto } from '../dtos';
import { Player } from '@persistence/entities'
import { JwtAuthGuard } from '@auth/guards';
import { Public } from '@auth/public.decorator';

@Controller('players')
export class PlayersController {
    constructor(private readonly service: PlayerService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreatePlayerDto): Promise<Player> {
        return await this.service.create(dto);
    }

    @Public()
    @Get()
    async findAll(): Promise<Player[]> {
        return await this.service.findAll();
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: number): Promise<Player | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdatePlayerDto): Promise<Player> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}