export interface RawScore {
  score: Score;
}

export interface Score {
  actualDancePoints: number;
  currentPossibleDancePoints: number;
  formattedScore: string;
  holdNote: HoldNote;
  id: string;
  isFailed: boolean;
  life: number;
  playerName: string;
  playerNumber: number;
  possibleDancePoints: number;
  song: string;
  tapNote: TapNote;
  totalHoldsCount: number;
}

export interface HoldNote {
  held: number;
  letGo: number;
  missed: number;
  none: number;
}

export interface TapNote {
  W0: number;
  W1: number;
  W2: number;
  W3: number;
  W4: number;
  W5: number;
  avoidMine: number;
  checkpointHit: number;
  checkpointMiss: number;
  hitMine: number;
  miss: number;
  none: number;
}
