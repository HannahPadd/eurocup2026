import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song } from '@persistence/entities';
import { CreateSongDto, UpdateSongDto } from '../dtos';

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
  ) { }

  async create(dto: CreateSongDto): Promise<Song> {
    const song = this.songRepository.create(dto);
    song.title = dto.title;
    song.group = dto.group;
    song.difficulty = dto.difficulty;
    await this.songRepository.save(song);
    return song;
  }

  async findAll(): Promise<Song[]> {
    return this.songRepository.find();
  }

  async findOne(id: number): Promise<Song> {
    return await this.songRepository.findOneBy({ id });
  }

  async findByName(title: string): Promise<Song> {
    return await this.songRepository.findOneBy({ title });
  }

  async update(id: number, updateSongDto: UpdateSongDto): Promise<Song> {
    const song = await this.songRepository.findOneBy({ id });

    if (!song) {
      throw new NotFoundException(`Song with ID ${id} not found`);
    }
    
    this.songRepository.merge(song, updateSongDto);
    
    return await this.songRepository.save(song);
  }

  async remove(id: number): Promise<void> {
    await this.songRepository.delete(id);
  }
}
