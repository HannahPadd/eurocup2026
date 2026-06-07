import { Match } from './Match'

export interface RulesetRef {
  id: number;
  name: string;
  scope?: "PHASE" | "QUALIFIER";
  config?: Record<string, unknown>;
}

export interface Phase {
  id: number;
  name: string;
  matches: Match[];
  ruleset?: RulesetRef | null;
}
