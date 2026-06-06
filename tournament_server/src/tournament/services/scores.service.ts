import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateScoreDto, UpdateScoreDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score, Song, Player } from '@persistence/entities'

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) { }

  private normalizePercentage(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async create(dto: CreateScoreDto) {
    const song = await this.songRepository.findOneBy({ id: dto.songId });

    if (!song) {
      throw new NotFoundException(`Song with ID ${dto.songId} not found`);
    }

    const player = await this.playerRepository.findOneBy({ id: dto.playerId });

    if (!player) {
      throw new NotFoundException(`Player with ID ${dto.playerId} not found`);
    }

    const newScore = new Score();

    newScore.percentage = this.normalizePercentage(dto.percentage);
    newScore.faPercentage =
      dto.faPercentage !== undefined
        ? this.normalizePercentage(dto.faPercentage)
        : undefined;
    newScore.faPlusPercentage =
      dto.faPlusPercentage !== undefined
        ? this.normalizePercentage(dto.faPlusPercentage)
        : undefined;
    newScore.isFailed = dto.isFailed;
    newScore.song = song;
    newScore.player = player;

    await this.scoreRepository.save(newScore);

    return newScore;
  }

  async findAll() {
    return await this.scoreRepository.find();
  }

  async findOne(id: number) {
    return await this.scoreRepository.findOneBy({ id });
  }

  async update(id: number, dto: UpdateScoreDto) {
    const existingScore = await this.scoreRepository.findOneBy({ id });

    if (!existingScore) {
      throw new Error(`Score with ID ${id} not found`);
    }

    // Check if the song or the player needs to be updated
    if (dto.songId) {
      const song = await this.songRepository.findOneBy({ id: dto.songId });
      if (!song) {
        throw new NotFoundException(`Song with ID ${dto.songId} not found`);
      }
      dto.song = song
      delete dto.songId;
    }

    if (dto.playerId) {
      const player = await this.playerRepository.findOneBy({ id: dto.playerId });
      if (!player) {
        throw new NotFoundException(`Player with ID ${dto.playerId} not found`);
      }
      dto.player = player;
      delete dto.playerId;
    }

    if (dto.percentage !== undefined) {
      dto.percentage = this.normalizePercentage(dto.percentage);
    }
    if (dto.faPercentage !== undefined) {
      dto.faPercentage = this.normalizePercentage(dto.faPercentage);
    }
    if (dto.faPlusPercentage !== undefined) {
      dto.faPlusPercentage = this.normalizePercentage(dto.faPlusPercentage);
    }

    this.scoreRepository.merge(existingScore, dto);
    return await this.scoreRepository.save(existingScore);
  }

  async remove(id: number) {
    await this.scoreRepository.delete(id);
  }
}
