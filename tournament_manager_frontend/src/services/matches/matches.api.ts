import axios from "axios";
import { Match } from "../../models/Match";
import {
  AddSongToMatchRequest,
  AddStandingToMatchRequest,
  CreateMatchRequest,
  EditSongToMatchRequest,
  SetActiveMatchRequest,
} from "../../models/requests/match-requests";

export async function listByPhase(phaseId: number): Promise<Match[]> {
  try {
    const response = await axios.get<Match[]>(
      "tournament/expandphase/" + phaseId,
    );

    return response.data;
  } catch (error) {
    console.error("Error listing matches by phase:", error);
    throw new Error("Unable to list matches by phase.");
  }
}

export async function getActiveMatch(): Promise<Match> {
  try {
    const response = await axios.get<Match>("tournament/activeMatch");

    return response.data;
  } catch (error) {
    console.error("Error getting active match:", error);
    throw new Error("Unable to get active match.");
  }
}

export async function create(request: CreateMatchRequest): Promise<Match> {
  try {
    const response = await axios.post<Match>("tournament/addMatch", request);
    return response.data;
  } catch (error) {
    console.error("Error creating match:", error);
    throw new Error("Unable to create match.");
  }
}

export async function editMatchNotes(
  matchId: number,
  notes: string,
): Promise<string> {
  try {
    const response = await axios.put<Match>("matches", {
      matchId,
      notes,
    });

    return response.data.notes;
  } catch (error) {
    console.error("Error editing match notes:", error);
    throw new Error("Unable to edit match notes.");
  }
}

export async function setActiveMatch(
  request: SetActiveMatchRequest,
): Promise<void> {
  try {
    const response = await axios.post("tournament/setactivematch", request);
    return response.data;
  } catch (error) {
    console.error("Error setting active match:", error);
    throw new Error("Unable to set active match.");
  }
}

export async function deleteMatch(matchId: number): Promise<void> {
  try {
    await axios.delete("matches/" + matchId);
  } catch (error) {
    console.error("Error deleting match:", error);
    throw new Error("Unable to delete match.");
  }
}

export async function addSongToActiveMatch(
  request: AddSongToMatchRequest,
): Promise<Match> {
  try {
    const response = await axios.post("tournament/addsongtomatch", request);
    return response.data;
  } catch (error) {
    console.error("Error adding song to active match:", error);
    throw new Error("Unable to add song to active match.");
  }
}

export async function editSongToActiveMatch(request: EditSongToMatchRequest) {
  try {
    const response = await axios.post("tournament/editmatchsong", request);
    return response.data;
  } catch (error) {
    console.error("Error editing song to active match:", error);
    throw new Error("Unable to edit song to active match.");
  }
}

export async function addStandingToActiveMatch(
  request: AddStandingToMatchRequest,
): Promise<Match> {
  try {
    const response = await axios.post("tournament/addstanding", request);
    return response.data;
  } catch (error) {
    console.error("Error adding standing to active match:", error);
    throw new Error("Unable to add standing to active match.");
  }
}

export async function editStandingForPlayerFromActiveMatch(
  songId: number,
  playerId: number,
  percentage: number,
  score: number,
  isFailed: boolean,
): Promise<Match> {
  try {
    const response = await axios.put(`tournament/editstanding`, {
      songId,
      playerId,
      percentage,
      score,
      isFailed,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error editing standings for player from active match:",
      error,
    );
    throw new Error("Unable to edit standings for player from active match.");
  }
}

export async function deleteStandingsForPlayerFromActiveMatch(
  playerId: number,
  songId: number,
): Promise<Match> {
  try {
    const response = await axios.delete(
      `tournament/deletestanding/${playerId}/${songId}`,
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting standings for player from active match:",
      error,
    );
    throw new Error("Unable to delete standings for player from active match.");
  }
}
