import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Division, Player, QualifierSubmission, Song } from '@persistence/entities';
import { CreateQualifierSubmissionDto } from '../dtos';

type QualifierSong = {
  song: Song;
  submission?: QualifierSubmission;
};

type QualifierPhase = {
  phaseId: number;
  phaseName: string;
  songs: QualifierSong[];
};

type QualifierDivision = {
  divisionId: number;
  divisionName: string;
  phases: QualifierPhase[];
};

type QualifierRankingEntry = {
  playerId: number;
  playerName: string;
  playerCountry?: string;
  averagePercentage: number;
  submittedCount: number;
};

type QualifierDivisionRanking = {
  divisionId: number;
  divisionName: string;
  totalSongs: number;
  rankings: QualifierRankingEntry[];
};

@Injectable()
export class QualifiersService {
  constructor(
    @InjectRepository(Division)
    private divisionRepo: Repository<Division>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    @InjectRepository(Song)
    private songRepo: Repository<Song>,
    @InjectRepository(QualifierSubmission)
    private qualifierRepo: Repository<QualifierSubmission>
  ) {}

  async list(playerId?: number): Promise<QualifierDivision[]> {
    const divisions = await this.divisionRepo.find();
    const seedingPhases = divisions.map((division) => {
      const phases = (division.phases || []).filter((phase) =>
        phase.name?.toLowerCase().includes('seeding')
      );
      return { division, phases };
    });

    const submissions = playerId
      ? await this.qualifierRepo.find({ where: { player: { id: playerId } } })
      : [];

    return seedingPhases.map(({ division, phases }) => ({
      divisionId: division.id,
      divisionName: division.name,
      phases: phases.map((phase) => ({
        phaseId: phase.id,
        phaseName: phase.name,
        songs: this.extractQualifierSongs(phase, submissions),
      })),
    }));
  }

  async rankings(): Promise<QualifierDivisionRanking[]> {
    const divisions = await this.divisionRepo.find();
    const divisionSongIds = new Map<number, Set<number>>();
    const songToDivisionIds = new Map<number, number[]>();

    for (const division of divisions) {
      const phases = (division.phases || []).filter((phase) =>
        phase.name?.toLowerCase().includes('seeding')
      );
      const songIds = new Set<number>();

      for (const phase of phases) {
        for (const match of phase.matches || []) {
          for (const round of match.rounds || []) {
            const songId = round.song?.id;
            if (!songId) {
              continue;
            }
            songIds.add(songId);
            const existing = songToDivisionIds.get(songId) ?? [];
            if (!existing.includes(division.id)) {
              existing.push(division.id);
              songToDivisionIds.set(songId, existing);
            }
          }
        }
      }

      divisionSongIds.set(division.id, songIds);
    }

    const allSongIds = Array.from(songToDivisionIds.keys());
    if (allSongIds.length === 0) {
      return divisions.map((division) => ({
        divisionId: division.id,
        divisionName: division.name,
        totalSongs: 0,
        rankings: [],
      }));
    }

    const submissions = await this.qualifierRepo.find({
      where: { song: { id: In(allSongIds) } },
    });

    const rankingsByDivision = new Map<
      number,
      Map<
        number,
        {
          playerId: number;
          playerName: string;
          playerCountry?: string;
          totalPercentage: number;
          submittedCount: number;
        }
      >
    >();

    for (const submission of submissions) {
      const divisionIds = songToDivisionIds.get(submission.song.id) ?? [];
      const playerId = submission.player?.id;
      if (!playerId) {
        continue;
      }
      const percentage = Number(submission.percentage ?? 0);

      for (const divisionId of divisionIds) {
        const divisionMap =
          rankingsByDivision.get(divisionId) ?? new Map();
        const entry = divisionMap.get(playerId) ?? {
          playerId,
          playerName: submission.player.playerName ?? "Unnamed player",
          playerCountry: submission.player.country ?? undefined,
          totalPercentage: 0,
          submittedCount: 0,
        };
        entry.totalPercentage += Number.isNaN(percentage) ? 0 : percentage;
        entry.submittedCount += 1;
        divisionMap.set(playerId, entry);
        rankingsByDivision.set(divisionId, divisionMap);
      }
    }

    return divisions.map((division) => {
      const totalSongs = divisionSongIds.get(division.id)?.size ?? 0;
      const entries = Array.from(
        rankingsByDivision.get(division.id)?.values() ?? []
      )
        .map((entry) => ({
          playerId: entry.playerId,
          playerName: entry.playerName,
          playerCountry: entry.playerCountry,
          averagePercentage: entry.submittedCount
            ? Number(
                (entry.totalPercentage / entry.submittedCount).toFixed(2)
              )
            : 0,
          submittedCount: entry.submittedCount,
        }))
        .sort((a, b) => {
          if (b.averagePercentage !== a.averagePercentage) {
            return b.averagePercentage - a.averagePercentage;
          }
          if (b.submittedCount !== a.submittedCount) {
            return b.submittedCount - a.submittedCount;
          }
          return a.playerName.localeCompare(b.playerName);
        });

      return {
        divisionId: division.id,
        divisionName: division.name,
        totalSongs,
        rankings: entries,
      };
    });
  }

  async upsert(playerId: number, songId: number, dto: CreateQualifierSubmissionDto) {
    const qualifierSongIds = await this.getQualifierSongIds();
    if (!qualifierSongIds.has(songId)) {
      throw new BadRequestException(`Song ${songId} is not a qualifier song`);
    }

    const player = await this.playerRepo.findOneBy({ id: playerId });
    if (!player) {
      throw new NotFoundException(`Player with id ${playerId} not found`);
    }

    const song = await this.songRepo.findOneBy({ id: songId });
    if (!song) {
      throw new NotFoundException(`Song with id ${songId} not found`);
    }

    let submission = await this.qualifierRepo.findOne({
      where: { player: { id: playerId }, song: { id: songId } },
    });

    if (!submission) {
      submission = new QualifierSubmission();
      submission.player = player;
      submission.song = song;
    }

    submission.percentage = dto.percentage;
    submission.screenshotUrl = dto.screenshotUrl;

    return await this.qualifierRepo.save(submission);
  }

  private extractQualifierSongs(phase, submissions: QualifierSubmission[]): QualifierSong[] {
    const songs: Song[] = [];
    const seen = new Set<number>();

    for (const match of phase.matches || []) {
      for (const round of match.rounds || []) {
        const song = round.song;
        if (song && !seen.has(song.id)) {
          seen.add(song.id);
          songs.push(song);
        }
      }
    }

    return songs.map((song) => ({
      song,
      submission: submissions.find((s) => s.song.id === song.id),
    }));
  }

  private async getQualifierSongIds(): Promise<Set<number>> {
    const divisions = await this.divisionRepo.find();
    const songIds = new Set<number>();

    for (const division of divisions) {
      const phases = (division.phases || []).filter((phase) =>
        phase.name?.toLowerCase().includes('seeding')
      );
      for (const phase of phases) {
        for (const match of phase.matches || []) {
          for (const round of match.rounds || []) {
            if (round.song?.id) {
              songIds.add(round.song.id);
            }
          }
        }
      }
    }

    return songIds;
  }
}
