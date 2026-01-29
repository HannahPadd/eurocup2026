import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoundDto, UpdateRoundDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round, Match, Song } from '@persistence/entities'

@Injectable()
export class RoundsService {
    constructor(
        @InjectRepository(Round)
        private roundsRepo: Repository<Round>,
        @InjectRepository(Match)
        private matchRepo: Repository<Match>,
        @InjectRepository(Song)
        private songRepo: Repository<Song>,
    ) { }

    async create(dto: CreateRoundDto) {
        const newRound = new Round();

        const match = await this.matchRepo.findOneBy({ id: dto.matchId });

        if (!match) {
            throw Error(`Match with id ${dto.matchId} not found. Insert round failed`)
        }

        const song = await this.songRepo.findOneBy({ id: dto.songId });

        if (!song) {
            throw new NotFoundException(`Song with id ${dto.songId} not found. Insert round failed`)
        }

        newRound.match = match;
        newRound.song = song;

        await this.roundsRepo.save(newRound);

        return newRound;
    }

    async findAll() {
        return await this.roundsRepo.find();
    }

    async findOne(id: number) {
        return await this.roundsRepo.findOneBy({ id });
    }

    async update(id: number, dto: UpdateRoundDto) {
        const round = await this.roundsRepo.findOneBy({ id });

        if (!round) {
            throw new NotFoundException(`Round with id ${id} not found. Update round failed`);
        }

        if (dto.matchId) {
            const match = await this.matchRepo.findOneBy({ id: dto.matchId });
            if (!match) {
                throw new NotFoundException(`Match with id ${dto.matchId} not found. Update round failed`);
            }
            dto.match = match;
            delete dto.matchId;
        }

        if (dto.songId) {
            const song = await this.songRepo.findOneBy({ id: dto.songId });
            if (!song) {
                throw new NotFoundException(`Song with id ${dto.songId} not found. Update round failed`);
            }
            dto.song = song;
            delete dto.songId;
        }

        this.roundsRepo.merge(round, dto);
        
        return await this.roundsRepo.save(round);
    }

    async remove(id: number) {
        await this.roundsRepo.delete(id);
    }
}
