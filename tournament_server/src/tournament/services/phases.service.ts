import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, Division, Ruleset } from '@persistence/entities';
import { CreatePhaseDto, UpdatePhaseDto } from '../dtos';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private phasesRepository: Repository<Phase>,
    @InjectRepository(Division)
    private divisionRepo: Repository<Division>,
    @InjectRepository(Ruleset)
    private rulesetRepo: Repository<Ruleset>,
  ) { }

  async create(phaseDto: CreatePhaseDto) {
    const phase = new Phase();
    phase.name = phaseDto.name;

    const division = await this.divisionRepo.findOneBy({ id: phaseDto.divisionId });

    if (!division) {
      throw new NotFoundException(`division with ID ${phaseDto.divisionId} not found`);
    }

    phase.division = Promise.resolve(division);

    if (phaseDto.rulesetId) {
      const ruleset = await this.rulesetRepo.findOneBy({ id: phaseDto.rulesetId });
      if (!ruleset) {
        throw new NotFoundException(`Ruleset with id ${phaseDto.rulesetId} not found`);
      }
      phase.ruleset = ruleset;
    }

    await this.phasesRepository.save(phase)

    return phase;
  }

  async findAll() {
    return this.phasesRepository.find();
  }

  async findOne(id: number) {
    return this.phasesRepository.findOneBy({ id });
  }

  async update(id: number, dto: UpdatePhaseDto) {
    const phase = await this.phasesRepository.findOneBy({ id });

    if (!phase) {
      throw new NotFoundException(`Phase with id ${id} not found. Update phase failed`);
    }

    if (dto.divisionId) {
      const division = await this.divisionRepo.findOneBy({ id: dto.divisionId });
      if (!division) {
        throw new NotFoundException(`Division with id ${dto.divisionId} not found. Update phase failed.`);
      }
      dto.division = Promise.resolve(division);
      delete dto.divisionId;
    }

    if ('rulesetId' in dto) {
      if (dto.rulesetId == null) {
        phase.ruleset = null;
        delete dto.rulesetId;
      } else {
        const ruleset = await this.rulesetRepo.findOneBy({ id: dto.rulesetId });
        if (!ruleset) {
          throw new NotFoundException(`Ruleset with id ${dto.rulesetId} not found`);
        }
        phase.ruleset = ruleset;
        delete dto.rulesetId;
      }
    }

    this.phasesRepository.merge(phase, dto);

    return await this.phasesRepository.save(phase);
  }

  async remove(id: number): Promise<void> {
    await this.phasesRepository.delete(id);
  }
}
