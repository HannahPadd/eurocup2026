import { Player } from "./Player";
import { Round } from "./Round";

export interface Match {
  id: number;
  name: string;
  subtitle: string;
  notes: string;
  isManualMatch: boolean;
  scoringSystem: string;
  multiplier: number;
  players: Player[];
  rounds: Round[];
  phaseId: number;
}
