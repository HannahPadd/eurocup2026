import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStandingDto, UpdateStandingDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Standing, Round, Score } from '@persistence/entities'

@Injectable()
export class StandingsService {
    constructor(
        @InjectRepository(Standing)
        private standingRepo: Repository<Standing>,
        @InjectRepository(Score)
        private scoreRepo: Repository<Score>,
        @InjectRepository(Round)
        private roundRepo: Repository<Round>
    ) { }

    async create(dto: CreateStandingDto) {
        const score = await this.scoreRepo.findOneBy({ id: dto.scoreId });

        if (!score) {
            throw new NotFoundException(`Score with id ${dto.scoreId} not found. Insert standing failed`)
        }

        const round = await this.roundRepo.findOneBy({ id: dto.roundId });

        if (!round) {
            throw new NotFoundException(`Round with id ${dto.roundId} not found. Insert standing failed`)
        }

        const newStanding = new Standing();

        newStanding.score = score;
        newStanding.round = round;
        newStanding.points = dto.points;

        await this.standingRepo.save(newStanding);

        return newStanding;
    }

    async findAll() {
        return await this.standingRepo.find();
    }

    async findOne(id: number) {
        return await this.standingRepo.findOneBy({ id });
    }

    async update(id: number, dto: UpdateStandingDto) {
        const standing = await this.standingRepo.findOneBy({ id });

        if (!standing) {
            throw new NotFoundException(`Standing with id ${id} not found. Update standing failed`);
        }

        if (dto.scoreId) {
            const updatedScore = await this.scoreRepo.findOneBy({ id: dto.scoreId });

            if (!updatedScore) {
                throw new NotFoundException(`Score with id ${dto.scoreId} not found. Update standing failed`)
            }

            dto.score = updatedScore;
            delete dto.scoreId;
        }

        if (dto.roundId) {
            const updatedRound = await this.roundRepo.findOneBy({ id: dto.roundId });

            if (!updatedRound) {
                throw new NotFoundException(`Round with id ${dto.roundId} not found. Update standing failed`)
            }

            dto.round = updatedRound;
            delete dto.roundId;
        }

        this.standingRepo.merge(standing, dto);
        
        return await this.standingRepo.save(standing);
    }

    async remove(id: number) {
        await this.standingRepo.delete(id);
    }
}
