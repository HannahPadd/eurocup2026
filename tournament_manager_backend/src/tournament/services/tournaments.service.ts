import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '@persistence/entities';
import { CreateTournamentDto, UpdateTournamentDto } from '../dtos';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>
  ) { }

  async create(dto: CreateTournamentDto) {
    const newTournament = new Tournament();

    newTournament.name = dto.name;

    await this.tournamentsRepository.save(newTournament);

    return newTournament;
  }

  async findAll(): Promise<Tournament[]> {
    return this.tournamentsRepository.find();
  }

  async findOne(id: number): Promise<Tournament> {
    return this.tournamentsRepository.findOneBy({ id });
  }

  async update(id: number, dto: UpdateTournamentDto) {
    const existingTournament = await this.findOne(id);

    if (!existingTournament) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }

    this.tournamentsRepository.merge(existingTournament, dto);

    return await this.tournamentsRepository.save(existingTournament);
  }

  async remove(id: number) {
    await this.tournamentsRepository.delete(id);
  }
}
