import { Match } from './Match'

export interface RulesetRef {
  id: number;
  name: string;
  config?: Record<string, unknown>;
}

export interface Phase {
  id: number;
  name: string;
  matches: Match[];
  ruleset?: RulesetRef | null;
}
