import { Match } from './Match'

export interface RulesetRef {
  id: number;
  name: string;
}

export interface Phase {
  id: number;
  name: string;
  matches: Match[];
  ruleset?: RulesetRef | null;
}
