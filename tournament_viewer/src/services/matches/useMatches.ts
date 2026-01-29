import { useReducer } from "react";
import { initialState, matchesReducer } from "./matches.reducer";
import * as MatchesApi from "./matches.api";
import { CreateMatchRequest } from "../../models/requests/match-requests";
import { toast } from "react-toastify";

export function useMatches(phaseId: number) {
  const [state, dispatch] = useReducer(matchesReducer, initialState);

  async function list() {
    try {
      const items = await MatchesApi.listByPhase(phaseId);
      dispatch({ type: "onListMatches", payload: items });
    } catch (error) {
      console.error("Error listing matches by phase:", error);
      toast.error("Error listing matches by phase.");
      throw new Error("Unable to list matches by phase.");
    }
  }
  async function getActiveMatch() {
    try {
      const item = await MatchesApi.getActiveMatch();
      dispatch({ type: "onSetActiveMatch", payload: item });
    } catch (error) {
      console.error("Error getting active match:", error);
      throw new Error("Unable to get active match.");
    }
  }

  async function create(request: CreateMatchRequest) {
    try {
      const item = await MatchesApi.create(request);
      dispatch({ type: "onCreateMatch", payload: item });
      toast.success("Match created successfully.");
    } catch (error) {
      toast.error("Error creating match.");
      console.error("Error creating match:", error);
      throw new Error("Unable to create match.");
    }
  }

  async function editMatchNotes(matchId: number, notes: string) {
    try {
      await MatchesApi.editMatchNotes(matchId, notes);
      dispatch({ type: "onEditMatchNotes", payload: [matchId, notes] });
    } catch (error) {
      toast.error("Error editing match notes.");
      console.error("Error editing match notes:", error);
      throw new Error("Unable to edit match notes.");
    }
  }

  async function setActiveMatch(
    divisionId: number,
    phaseId: number,
    matchId: number,
  ) {
    try {
      await MatchesApi.setActiveMatch({ divisionId, phaseId, matchId });
      dispatch({
        type: "onSetActiveMatch",
        payload: state.matches.find((m) => m.id === matchId)!,
      });
    } catch (error) {
      toast.error("Error setting active match.");
      console.error("Error setting active match:", error);
      throw new Error("Unable to set active match.");
    }
  }

  async function deleteMatch(matchId: number) {
    try {
      await MatchesApi.deleteMatch(matchId);
      dispatch({
        type: "onDeleteMatch",
        payload: state.matches.find((m) => m.id === matchId)!,
      });
    } catch (error) {
      toast.error("Error deleting match.");
      console.error("Error deleting match:", error);
      throw new Error("Unable to delete match.");
    }
  }

  async function addSongToMatchByRoll(
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
  ) {
    try {
      const item = await MatchesApi.addSongToActiveMatch({
        divisionId,
        phaseId,
        matchId,
        group,
        level,
      });
      dispatch({ type: "onAddSongToMatch", payload: item });
    } catch (error) {
      toast.error("Error adding song to match.");
      console.error("Error adding song to match:", error);
      throw new Error("Unable to add song to match.");
    }
  }

  async function editSongToMatchByRoll(
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
    editSongId: number,
  ) {
    try {
      const item = await MatchesApi.editSongToActiveMatch({
        divisionId,
        phaseId,
        matchId,
        group,
        level,
        editSongId,
      });
      dispatch({ type: "onAddSongToMatch", payload: item });
    } catch (error) {
      toast.error("Error adding song to match.");
      console.error("Error adding song to match:", error);
      throw new Error("Unable to add song to match.");
    }
  }

  async function addSongToMatchBySongId(
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
  ) {
    try {
      const item = await MatchesApi.addSongToActiveMatch({
        divisionId,
        phaseId,
        matchId,
        songId,
      });
      dispatch({ type: "onAddSongToMatch", payload: item });
    } catch (error) {
      toast.error("Error adding song to match.");
      console.error("Error adding song to match:", error);
      throw new Error("Unable to add song to match.");
    }
  }

  async function editSongToMatchBySongId(
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
    editSongId: number,
  ) {
    try {
      const item = await MatchesApi.editSongToActiveMatch({
        divisionId,
        phaseId,
        matchId,
        songId,
        editSongId,
      });
      dispatch({ type: "onAddSongToMatch", payload: item });
    } catch (error) {
      toast.error("Error adding song to match.");
      console.error("Error adding song to match:", error);
      throw new Error("Unable to add song to match.");
    }
  }

  async function addStandingToMatch(
    playerId: number,
    songId: number,
    percentage: number,
    score: number,
    isFailed: boolean,
  ) {
    try {
      const item = await MatchesApi.addStandingToActiveMatch({
        playerId,
        songId,
        percentage,
        score,
        isFailed,
      });
      dispatch({ type: "onAddStandingToMatch", payload: item });
    } catch (error) {
      toast.error("Error adding standing to match.");
      console.error("Error adding standing to match:", error);
      throw new Error("Unable to add standing to match.");
    }
  }

  async function deleteStandingsForPlayerFromMatch(
    playerId: number,
    songId: number,
  ) {
    try {
      const item = await MatchesApi.deleteStandingsForPlayerFromActiveMatch(
        playerId,
        songId,
      );
      dispatch({ type: "onDeleteStandingFromMatch", payload: item });
    } catch (error) {
      toast.error("Error deleting standings for player from match.");
      console.error("Error deleting standings for player from match:", error);
      throw new Error("Unable to delete standings for player from match.");
    }
  }

  async function editStandingFromMatch(
    songId: number,
    playerId: number,
    percentage: number,
    score: number,
    isFailed: boolean,
  ) {
    try {
      const item = await MatchesApi.editStandingForPlayerFromActiveMatch(
        songId,
        playerId,
        percentage,
        score,
        isFailed,
      );
      dispatch({ type: "onEditStandingFromMatch", payload: item });
    } catch (error) {
      toast.error("Error editing standings for player from match.");
      console.error("Error editing standings for player from match:", error);
      throw new Error("Unable to edit standings for player from match.");
    }
  }

  return {
    state,
    actions: {
      list,
      getActiveMatch,
      create,
      editMatchNotes,
      setActiveMatch,
      deleteMatch,
      addSongToMatchByRoll,
      addSongToMatchBySongId,
      editSongToMatchByRoll,
      editSongToMatchBySongId,
      addStandingToMatch,
      editStandingFromMatch,
      deleteStandingsForPlayerFromMatch,
    },
  };
}
