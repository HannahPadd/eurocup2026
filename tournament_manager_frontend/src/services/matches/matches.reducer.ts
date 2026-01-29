import { Match } from "../../models/Match";
import { MatchesActions } from "./matches.actions";

export type MatchesState = {
  matches: Match[];
  activeMatch: Match | null;
};

export const initialState: MatchesState = {
  matches: [],
  activeMatch: null,
};

export function matchesReducer(state: MatchesState, action: MatchesActions) {
  const { type, payload } = action;

  switch (type) {
    case "onListMatches":
      return {
        ...state,
        matches: payload,
      };
    case "onCreateMatch":
      return {
        ...state,
        matches: [...state.matches, payload],
      };
    case "onEditMatchNotes":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === payload[0] ? { ...match, notes: payload[1] } : match,
        ),
        activeMatch:
          state.activeMatch?.id === payload[0]
            ? { ...state.activeMatch, notes: payload[1] }
            : state.activeMatch,
      };
    case "onSetActiveMatch":
      return {
        ...state,
        activeMatch: payload,
      };
    case "onDeleteMatch":
      return {
        ...state,
        matches: state.matches.filter((match) => match.id !== payload.id),
        activeMatch:
          state.activeMatch?.id === payload.id ? null : state.activeMatch,
      };
    case "onAddSongToMatch":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === payload.id ? payload : match,
        ),
        activeMatch: payload,
      };
    case "onAddStandingToMatch":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === payload.id ? payload : match,
        ),
        activeMatch: payload,
      };
    case "onDeleteStandingFromMatch":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === payload.id ? payload : match,
        ),
        activeMatch: payload,
      };
    case "onEditStandingFromMatch":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === payload.id ? payload : match,
        ),
        activeMatch: payload,
      };
    default:
      return state;
  }
}
