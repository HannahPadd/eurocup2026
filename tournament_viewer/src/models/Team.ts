import { Color } from "./Color.ts";

export const TEAM_COLORS: Color[] = [
  { name: "Rosso", color: "#CE2B37" },
  { name: "Giallo", color: "#E1C70A" },
  { name: "Blu", color: "#00A4C6" },
  { name: "Viola", color: "#C21FAF" },
];

export interface Team {
  id: number;
  name: string;
  score: number;
}
