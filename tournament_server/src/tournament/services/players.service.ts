import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlayerDto, UpdatePlayerDto } from '../dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Division, Player, Team } from '@persistence/entities'

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private playersRepo: Repository<Player>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(Division)
    private divisionRepo: Repository<Division>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>
  ) { }
  /*TODO
  Avoid double registrations */
  async create(dto: CreatePlayerDto) {
    const player = new Player();
    player.playerName = dto.playerName;

    if (dto.teamId) {
      const team = await this.teamsRepo.findOneBy({ id: dto.teamId });

      if (!team) {
        throw new NotFoundException(`Team with id ${dto.teamId} not found`);
      }

      player.team = team;
    }

    await this.playersRepo.save(player);

    return player;
  }

  async findAll() {
    const { entities, raw } = await this.playersRepo
      .createQueryBuilder("player")
      .distinct(true)
      .leftJoinAndSelect("player.divisions", "division")
      .leftJoin("account", "account", "account.playerId = player.id")
      .addSelect("account.isAdmin", "account_isAdmin")
      .getRawAndEntities();

    return entities.map((player, index) => {
      (player as Player & { isAdmin?: boolean }).isAdmin =
        raw[index]?.account_isAdmin ?? false;
      return player;
    });
  }

  async findOne(id: number) {
    const { entities, raw } = await this.playersRepo
      .createQueryBuilder("player")
      .distinct(true)
      .leftJoinAndSelect("player.divisions", "division")
      .leftJoin("account", "account", "account.playerId = player.id")
      .addSelect("account.isAdmin", "account_isAdmin")
      .where("player.id = :id", { id })
      .getRawAndEntities();

    const player = entities[0] ?? null;
    if (player) {
      (player as Player & { isAdmin?: boolean }).isAdmin =
        raw[0]?.account_isAdmin ?? false;
    }
    return player;
  }

  async findByName(playerName: string) {
    const { entities, raw } = await this.playersRepo
      .createQueryBuilder("player")
      .distinct(true)
      .leftJoinAndSelect("player.divisions", "division")
      .leftJoin("account", "account", "account.playerId = player.id")
      .addSelect("account.isAdmin", "account_isAdmin")
      .where("player.playerName = :playerName", { playerName })
      .getRawAndEntities();

    const player = entities[0] ?? null;
    if (player) {
      (player as Player & { isAdmin?: boolean }).isAdmin =
        raw[0]?.account_isAdmin ?? false;
    }
    return player;
  }

  async update(id: number, dto: UpdatePlayerDto) {
    const player = await this.playersRepo.findOneBy({ id });

    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }

    if (dto.teamId) {
      const team = await this.teamsRepo.findOneBy({ id: dto.teamId });
      if (!team) {
        throw new NotFoundException(`Team with id ${dto.teamId} not found`);
      }
      dto.team = team;
      delete dto.teamId;
    }

    if (dto.divisionId) {
      const divisionArr = await Promise.all(
        dto.divisionId.map(async (divisionId) => {
          const division = await this.divisionRepo.findOneBy({id: divisionId })
          if (!division) {
            throw new NotFoundException(`Division with id ${divisionId} not found`);
          }
          return division
        })
      )
      player.divisions = divisionArr
      player.hasRegistered = divisionArr.length > 0;
    }

    if (dto.hasRegistered !== undefined) {
      player.hasRegistered = dto.hasRegistered;
    }

    if (dto.isAdmin !== undefined) {
      const account = await this.accountRepo.findOne({
        where: { player: { id } },
      });
      if (account) {
        account.isAdmin = dto.isAdmin;
        await this.accountRepo.save(account);
      }
    }

    this.playersRepo.merge(player, dto);
    await this.playersRepo.save(player);
    return await this.findOne(id);
  }

  async remove(id: number) {
    await this.playersRepo.delete(id);
  }
}
