import { Division } from "./Division";

export interface Player {
  id: number;
  name?: string;
  playerName?: string;
  playerPictureUrl?: string;
  playedFor?: string;
  country?: string;
  highestStaminaPass?: number;
  statminaLevel?: number;
  footSpeedLevel?: number;
  crossOverTechLevel?: number;
  footSwitchTechLevel?: number;
  sideSwitchTechLevel?: number;
  bracketTechLevel?: number;
  doubleStepTechLevel?: number;
  jackTechLevel?: number;
  xmodTechLevel?: number;
  burstTechLevel?: number;
  rhythmsTechLevel?: number;
  groovestatsApi?: string;
  password?: string;
  tournaments?: string;
  score?: number;
  teamId?: number;
  divisions?: Division[];
}
