import { ConflictException, HttpException, Inject, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Bracket, Player, Match, Round, Account, Score, Team, Division } from '@persistence/entities';
import { CreateUserPlayerDto, UpdateUserPlayerDto } from '../dtos';


export type account = Account;

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        @InjectRepository(Player)
        private playerRepo: Repository<Player>,
        @InjectRepository(Division)
        private divisionRepo: Repository<Division>,
        private jwtService: JwtService
    ) { }

    //TODO: Add user roles and authentication
    async create(dto: CreateUserPlayerDto) {
        
        const user = await this.accountRepo.findOneBy({username: dto.username})
        if (user) {
            throw new UnprocessableEntityException('Username already exists');
        }

        else {
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

            if (dto.divisionId && dto.divisionId.length > 0) {
                const divisions = await Promise.all(
                    dto.divisionId.map(async (divisionId) => {
                        const division = await this.divisionRepo.findOneBy({ id: divisionId });
                        if (!division) {
                            throw new NotFoundException(`Division with id ${divisionId} not found`);
                        }
                        return division;
                    })
                );
                player.divisions = divisions;
                player.hasRegistered = true;
            }

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

}
