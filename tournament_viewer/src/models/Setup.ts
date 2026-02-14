export type MatchAssignmentRef = {
  id: number;
};

export type Setup = {
  id: number;
  name: string;
  cabinetName: string;
  position: number;
  matchAssignments?: MatchAssignmentRef[];
};
