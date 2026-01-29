import { Standing } from "./Standing";
import { Song } from "./Song";

export interface Round {
  id: number;
  standings: Standing[];
  song: Song;
}
