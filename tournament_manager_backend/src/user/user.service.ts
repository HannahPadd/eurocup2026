import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { compare, genSalt, hash } from 'bcrypt';
import { Repository } from "typeorm";

import { CreateUserPlayerDto } from './dtos';

import { Account, Player } from "@persistence/entities";


export type account = Account;

@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        @InjectRepository(Player)
        private playerRepo: Repository<Player>,
        private jwtService: JwtService
    ) { }

    //TODO: Add missing tables to player info
    //TODO: Add user roles and authentication
    async create(dto: CreateUserPlayerDto) {
        const player = new Player();
        const account = new Account();
        //let score: Score[] = [];
        //const team = new Team();
        //const bracket = new Bracket();

        player.playerPictureUrl = dto.playerPictureUrl;
        player.playerName = dto.username;
        player.playedFor = dto.playedFor;
        player.country = dto.country;
        player.highestStaminaPass = dto.highestStaminaPass;
        player.statminaLevel = dto.staminaLevel;
        player.footSpeedLevel = dto.footSpeedLevel;
        player.crossOverTechLevel = dto.crossOverTechLevel;
        player.sideSwitchTechLevel = dto.sideSwitchTechLevel;
        player.bracketTechLevel = dto.bracketTechLevel;
        player.doubleStepTechLevel = dto.doubleStepTechLevel;
        player.jackTechLevel = dto.jackTechLevel;
        player.xmodTechLevel = dto.xmodTechLevel;
        player.burstTechLevel = dto.burstTechLevel;
        player.rhythmsTechLevel = dto.rhythmsTechLevel;
        //player.scores = score;
        //player.team = team;
        //player.bracket = bracket;

        await this.playerRepo.save(player);

        const salt = await genSalt(10);
        const hashedPassword = await hash(dto.password, salt);

        account.username = dto.username;
        account.email = dto.email;
        account.password = hashedPassword;
        account.player = player;


        await this.accountRepo.save(account);

        return account;
    }

}