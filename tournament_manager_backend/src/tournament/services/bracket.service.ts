import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBracketDto, UpdateBracketDto } from '../dtos/bracket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Bracket, Player, Match, Round} from '@persistence/entities';

@Injectable()
export class BracketService {
    constructor(
        @InjectRepository(Bracket)
        private bracketRepo: Repository<Bracket>,
        @InjectRepository(Player)
        private playerRepo: Repository<Player>,
        @InjectRepository(Match)
        private matchRepo: Repository<Match>,
        @InjectRepository(Round)
        private roundRepo: Repository<Round>
    ) { }

    async create(dto: CreateBracketDto) {
        const bracket = new Bracket();

        bracket.name = dto.name;
        bracket.match = dto.match;
        bracket.player = dto.player;
        bracket.round = dto.round;

        await this.bracketRepo.save(bracket)

        return bracket;
    }


    async findAll() {
        return await this.bracketRepo.find();
    }
}