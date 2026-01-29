import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Player, Bracket } from '@persistence/entities';

@Injectable()
export class StreamViewService {
    constructor(
        @InjectRepository(Player)
        private playerRepo: Repository<Player>,
        @InjectRepository(Bracket)
        private bracketRepo: Repository<Bracket>
    ) { }


    async findAll() {

    }

    async findOne() {

    }

    async findAllPlayers() {
        return await this.playerRepo.find();
    }

    async findOnePlayer(id: number) {
        return await this.playerRepo.findOneBy({ id });
    }

    async findOneBracket() {

    }

    async findAllBrackets() {
        return await this.bracketRepo.find();
    }
}