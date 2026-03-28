import { ConflictException, HttpException, Inject, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Bracket, Player, Match, Round, Account, Score, Team, Division } from '@persistence/entities';
import { CreateUserPlayerDto, UpdateUserPlayerDto } from '../dtos';


export type account = Account;
type RegistrationRecord = Record<string, unknown>;
type RegistrationPrefillResponse = {
    ticketCode: string | null;
    gamerTag: string | null;
    country: string | null;
    attendingAs: string | null;
    registrationDate: string | null;
    preferredDivisions: string[];
};

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

    private readonly registrationSourceUrl = 'https://rhythmtechnologies.nl/wp-content/uploads/eurocup-registrations.json';

    private normalizeKey(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private normalizeValue(value: string): string {
        return value.trim().toLowerCase();
    }

    private normalizeTag(value: string): string {
        return this.normalizeValue(value).replace(/[^a-z0-9]/g, '');
    }

    private getStringValue(record: RegistrationRecord, normalizedKey: string): string | null {
        for (const [key, value] of Object.entries(record)) {
            if (this.normalizeKey(key) !== normalizedKey) {
                continue;
            }
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }
        return null;
    }

    private getBooleanYesValue(record: RegistrationRecord, normalizedKey: string): boolean {
        const value = this.getStringValue(record, normalizedKey);
        return value ? this.normalizeValue(value) === 'yes' : false;
    }

    async checkForDuplicate(gamerTag: string): Promise<boolean> {
        const exists = await this.accountRepo.findOneBy({username: gamerTag})
        if (!exists) return false;
        return true;
    }

    async getRegistrationPrefillByGamerTag(gamerTag: string): Promise<RegistrationPrefillResponse> {
        const response = await fetch(this.registrationSourceUrl);
        if (!response.ok) {
            throw new HttpException('Unable to load preregistration data', 502);
        }
        const payload = await response.json();
        if (!Array.isArray(payload)) {
            throw new HttpException('Unexpected preregistration data format', 502);
        }

        const normalizedTargetGamerTag = this.normalizeTag(gamerTag);
        const matchingRecord = payload.find((item: unknown) => {
            if (!item || typeof item !== 'object') {
                return false;
            }
            const record = item as RegistrationRecord;
            const recordGamerTag = this.getStringValue(record, 'gamertag');
            return typeof recordGamerTag === 'string'
                ? this.normalizeTag(recordGamerTag) === normalizedTargetGamerTag
                : false;
        }) as RegistrationRecord | undefined;

        if (!matchingRecord) {
            throw new NotFoundException('No preregistration found for this gamer tag');
        }

        const preferredDivisions: string[] = [];
        if (this.getBooleanYesValue(matchingRecord, 'itgprecision')) preferredDivisions.push('ITG Precision');
        if (this.getBooleanYesValue(matchingRecord, 'itgstamina')) preferredDivisions.push('ITG Stamina');
        if (this.getBooleanYesValue(matchingRecord, 'itgvarietyfun')) preferredDivisions.push('ITG Variety-Fun');
        if (this.getBooleanYesValue(matchingRecord, 'itgdoubles')) preferredDivisions.push('ITG Doubles');
        if (this.getBooleanYesValue(matchingRecord, 'pumpitup')) preferredDivisions.push('Pump It Up');
        if (this.getBooleanYesValue(matchingRecord, 'stepmaniax')) preferredDivisions.push('StepManiaX');

        return {
            ticketCode: this.getStringValue(matchingRecord, 'ticketcode'),
            gamerTag: this.getStringValue(matchingRecord, 'gamertag'),
            country: this.getStringValue(matchingRecord, 'country'),
            attendingAs: this.getStringValue(matchingRecord, 'attendingas'),
            registrationDate: this.getStringValue(matchingRecord, 'registartiondate') ?? this.getStringValue(matchingRecord, 'registrationdate'),
            preferredDivisions,
        };
    }

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
