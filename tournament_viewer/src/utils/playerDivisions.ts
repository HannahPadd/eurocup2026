import { Division } from "../models/Division";
import { Player } from "../models/Player";

export const getPlayerDivisionIds = (player: Player): number[] =>
  (player.divisions ?? []).map((division) => division.id);

export const isPlayerInDivision = (player: Player, divisionId: number) =>
  getPlayerDivisionIds(player).includes(divisionId);

export const togglePlayerDivisionIds = (
  player: Player,
  division: Division,
): number[] => {
  const currentIds = getPlayerDivisionIds(player);
  if (currentIds.includes(division.id)) {
    return currentIds.filter((id) => id !== division.id);
  }
  return [...currentIds, division.id];
};
