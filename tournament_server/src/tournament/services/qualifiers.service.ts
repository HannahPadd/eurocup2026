import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
