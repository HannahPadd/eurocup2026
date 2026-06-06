import { Phase } from "./Phase";

export interface Division {
  id: number;
  name: string;
  scoreLead?: "FA" | "FA_PLUS";
  phases: Phase[];
}
