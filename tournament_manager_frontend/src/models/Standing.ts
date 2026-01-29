import { Player } from './Player'
import { Song } from './Song'

export interface Score {
  id: number;
  percentage: number;
  isFailed: boolean;
  player: Player;
  song: Song;
}

export interface Standing {
  id: number;
  score: Score;
  points: number;
}
