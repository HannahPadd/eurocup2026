import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMatchAssignmentDto, UpdateMatchAssignmentDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round, MatchAssignment, Player, Setup } from '@persistence/entities'

@Injectable()
export class MatchAssignmentService {
    constructor(
        @InjectRepository(Setup)
        private setupRepository: Repository<Setup>,
        @InjectRepository(MatchAssignment)
        private matchAssignmentRepository: Repository<MatchAssignment>,
        @InjectRepository(Player)
        private playerRepository: Repository<Player>,
        @InjectRepository(Round)
        private roundRepository: Repository<Round>,
    ) { }

    async create(dto: CreateMatchAssignmentDto) : Promise<MatchAssignment> {
        const matchAssignment = new MatchAssignment();

        const round = await this.roundRepository.findOneBy({ id: dto.roundId });

        if (!round) {
            throw Error(`Round with id ${dto.roundId} not found. Insert matchAssignment failed`)
        }

        const setup = await this.setupRepository.findOneBy({ id: dto.setupId });

        if (!setup) {
            throw Error(`Setup with id ${dto.setupId} not found. Insert matchAssignment failed`)
        }

        const player = await this.playerRepository.findOneBy({ id: dto.playerId });

        if (!player) {
            throw Error(`Player with id ${dto.playerId} not found. Insert matchAssignment failed`)
        }

        matchAssignment.round = round;
        matchAssignment.setup = setup;
        matchAssignment.player = player;

        await this.matchAssignmentRepository.save(matchAssignment);

        return matchAssignment;
    }

    async findAll() {
        return await this.matchAssignmentRepository.find();
    }

    async findOne(id: number) {
        return await this.matchAssignmentRepository.findOneBy({ id });
    }

    async update(id: number, dto: UpdateMatchAssignmentDto) {
        const matchAssignment = await this.matchAssignmentRepository.findOneBy({ id });

        if (!matchAssignment) {
            throw new NotFoundException(`MatchAssignment with id ${id} not found. Update MatchAssignment failed`);
        }

        if (dto.roundId) {
            const round = await this.roundRepository.findOneBy({ id: dto.roundId });
            if (!round) {
                throw new NotFoundException(`Round with id ${dto.round} not found. Update MatchAssignment failed`);
            }
            dto.round = round;
            delete dto.roundId;
        }

        if (dto.setupId) {
            const setup = await this.setupRepository.findOneBy({ id: dto.setupId });
            if (!setup) {
                throw new NotFoundException(`Setup with id ${dto.setupId} not found. Update MatchAssignment failed`);
            }
            dto.setup = setup;
            delete dto.setupId;
        }

        if (dto.playerId) {
            const player = await this.playerRepository.findOneBy({ id: dto.playerId });
            if (!player) {
                throw new NotFoundException(`Player with id ${dto.playerId} not found. Update MatchAssignment failed`);
            }
            dto.player = player;
            delete dto.playerId;
        }

        this.matchAssignmentRepository.merge(matchAssignment, dto);
        
        return await this.matchAssignmentRepository.save(matchAssignment);
    }

    async remove(id: number) {
        await this.matchAssignmentRepository.delete(id);
    }
}
