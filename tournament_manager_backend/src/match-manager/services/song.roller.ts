import { Injectable, Inject } from '@nestjs/common';
import { DivisionsService, SongService } from '../../tournament/services';
import { Division, Song } from '@persistence/entities';

@Injectable()
export class SongRoller {
    constructor(
        @Inject()
        private readonly divisionService: DivisionsService,
        @Inject()
        private readonly songService: SongService) { }

    async RollSongs(divisionId: number, group: string, levels: string): Promise<number[]> {
        const songs: number[] = [];
        const intLevels = levels.split(",").map(s => parseInt(s, 10));

        for (const level of intLevels) {
            const songId = await this.RollASong(divisionId, group, level);

            if (songId != 0) {
                songs.push(songId);
            }
        }

        return songs;
    }

    async RollASong(divisionId: number, group: string, level: number): Promise<number> {
        const division = await this.divisionService.findOne(divisionId);

        if (!division) {
            return 0;
        }

        const songs = await this.songService.findAll();

        if (!songs) {
            return 0;
        }

        return this.RollSong(songs, division, group, level);
    }

    private RollSong(songs: Song[], division: Division, group: string | null, level: number): number {
        const availableSongs = this.GetAvailableSong(songs, division, level, group);
        
        if(availableSongs.length == 0)
            return 0;

        return this.GetRandomElement(availableSongs);
    }

    private GetAvailableSong(songs: Song[], division: Division, level: number, group: string | null): number[] {
        const allSongs: number[] = songs.filter(s => (group === null || (group !== null && s.group === group)) && s.difficulty === level).map(s => s.id);
        const bannedSongs: number[] = this.GetBannedSongs(division);

        return allSongs.filter(songId => !bannedSongs.includes(songId));
    }

    private GetBannedSongs(division: Division): number[] {
        return division.phases.flatMap(
            phase => phase.matches.flatMap(match => match.rounds.flatMap(round => round.song.id || [])));
    }

    private GetRandomElement<T>(array: T[]): T {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }
}
