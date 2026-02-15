import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, Ruleset } from '@persistence/entities';
import { CreateRulesetDto, UpdateRulesetDto } from '../dtos';

@Injectable()
export class RulesetsService {
  constructor(
    @InjectRepository(Ruleset)
    private rulesetRepo: Repository<Ruleset>,
    @InjectRepository(Phase)
    private phaseRepo: Repository<Phase>,
  ) {}

  async create(dto: CreateRulesetDto): Promise<Ruleset> {
    const ruleset = this.rulesetRepo.create({
      name: dto.name,
      description: dto.description,
      config: dto.config,
      isActive: dto.isActive ?? true,
    });

    return await this.rulesetRepo.save(ruleset);
  }

  async findAll(): Promise<Ruleset[]> {
    return await this.rulesetRepo.find();
  }

  async findOne(id: number): Promise<Ruleset> {
    const ruleset = await this.rulesetRepo.findOneBy({ id });
    if (!ruleset) {
      throw new NotFoundException(`Ruleset with id ${id} not found`);
    }
    return ruleset;
  }

  async update(id: number, dto: UpdateRulesetDto): Promise<Ruleset> {
    const ruleset = await this.findOne(id);
    this.rulesetRepo.merge(ruleset, dto);
    return await this.rulesetRepo.save(ruleset);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const linkedPhases = await this.phaseRepo.find({
      where: { ruleset: { id } },
    });

    if (linkedPhases.length > 0) {
      for (const phase of linkedPhases) {
        phase.ruleset = null;
      }
      await this.phaseRepo.save(linkedPhases);
    }

    await this.rulesetRepo.delete(id);
  }
}
