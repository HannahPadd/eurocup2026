import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto, UpdateTeamDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '@persistence/entities'

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private repo: Repository<Team>,
  ) { }

  async create(dto: CreateTeamDto) {
    const team = new Team();

    team.name = dto.name;

    await this.repo.save(team);

    return team;
  }

  async findAll() {
    return await this.repo.find();
  }

  async findOne(id: number) {
    return await this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateTeamDto) {
    const team = await this.repo.findOneBy({ id });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    this.repo.merge(team, dto);
    return await this.repo.save(team);
  }

  async remove(id: number) {
    await this.repo.delete(id);
  }
}
