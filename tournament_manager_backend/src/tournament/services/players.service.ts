import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlayerDto, UpdatePlayerDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, Team } from '@persistence/entities'

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private playersRepo: Repository<Player>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>
  ) { }
  /*TODO
  Avoid double registrations */
  async create(dto: CreatePlayerDto) {
    const player = new Player();
    player.playerName = dto.playerName;

    if (dto.teamId) {
      const team = await this.teamsRepo.findOneBy({ id: dto.teamId });

      if (!team) {
        throw new NotFoundException(`Team with id ${dto.teamId} not found`);
      }

      player.team = team;
    }

    await this.playersRepo.save(player);

    return player;
  }

  async findAll() {
    return await this.playersRepo.find();
  }

  async findOne(id: number) {
    return await this.playersRepo.findOneBy({ id });
  }

  async findByName(playerName: string) {
    return await this.playersRepo.findOneBy({ playerName });
  }

  async update(id: number, dto: UpdatePlayerDto) {
    const player = await this.playersRepo.findOneBy({ id });

    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }

    if (dto.teamId) {
      const team = await this.teamsRepo.findOneBy({ id: dto.teamId });
      if (!team) {
        throw new NotFoundException(`Team with id ${dto.teamId} not found`);
      }
      dto.team = team;
      delete dto.teamId;
    }

    this.playersRepo.merge(player, dto);
    
    return await this.playersRepo.save(player);
  }

  async remove(id: number) {
    await this.playersRepo.delete(id);
  }
}
