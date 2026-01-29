
import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { SongService } from '../services';
import { Song } from '@persistence/entities';
import { CreateSongDto, UpdateSongDto } from '../dtos';

@Controller('songs')
export class SongsController {
    constructor(private readonly service: SongService) { }

    @Post()
    async create(@Body(new ValidationPipe()) dto: CreateSongDto): Promise<Song> {
        return await this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<Song[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Song | null> {
        return this.service.findOne(id); 
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body(new ValidationPipe()) dto: UpdateSongDto): Promise<Song> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}