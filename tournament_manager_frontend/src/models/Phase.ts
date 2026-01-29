import { Match } from './Match'

export interface Phase {
  id: number;
  name: string;
  matches: Match[];
}
