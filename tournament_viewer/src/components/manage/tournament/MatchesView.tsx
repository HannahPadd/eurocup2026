import { useEffect, useState } from "react";
import axios from "axios";
import { Phase } from "../../../models/Phase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandFist } from "@fortawesome/free-solid-svg-icons";
import CreateMatchModal from "./modals/CreateMatchModal";
import { Division } from "../../../models/Division";
import MatchTable from "./MatchTable";
import { useMatches } from "../../../services/matches/useMatches";
import { Match } from "../../../models/Match";

type MatchesViewProps = {
  phaseId: number;
  controls?: boolean;
  showPastMatches?: boolean;
  division: Division;
  showCreateButton?: boolean;
  openCreateMatchModalSignal?: number;
  refreshSignal?: number;
  onMatchesSnapshot?: (matches: Match[], activeMatch: Match | null) => void;
};

export default function MatchesView({
  phaseId,
  division,
  showPastMatches = false,
  controls = false,
  showCreateButton = true,
  openCreateMatchModalSignal = 0,
  refreshSignal = 0,
  onMatchesSnapshot,
}: MatchesViewProps) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const { state, actions } = useMatches(phaseId);

  const [createMatchModalOpened, setCreateMatchModalOpened] = useState(false);

  useEffect(() => {
    axios.get<Phase>(`/phases/${phaseId}`).then((response) => {
      setPhase(response.data);
      actions.list();
      actions.getActiveMatch();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseId]);

  useEffect(() => {
    if (controls && openCreateMatchModalSignal > 0) {
      setCreateMatchModalOpened(true);
    }
  }, [controls, openCreateMatchModalSignal]);

  useEffect(() => {
    if (!phase) {
      return;
    }
    actions.list();
    actions.getActiveMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  useEffect(() => {
    onMatchesSnapshot?.(state.matches, state.activeMatch);
  }, [state.matches, state.activeMatch, onMatchesSnapshot]);

  return (
    <div className="mt-3">
      {phase && controls && (
        <CreateMatchModal
          phase={phase}
          division={division}
          open={createMatchModalOpened}
          onClose={() => setCreateMatchModalOpened(false)}
          onCreate={actions.create}
        />
      )}
      {controls && showCreateButton && (
        <div className="mt-2 inline-flex w-fit self-start bg-gray-200 p-2 px-4 rounded-lg">
          <button
            onClick={() => setCreateMatchModalOpened(true)}
            className="text-green-800 font-bold inline-flex w-fit flex-row gap-2 items-center"
          >
            <FontAwesomeIcon icon={faHandFist} />
            <span>New match</span>
          </button>
        </div>
      )}
      <div className="w-full mt-7">
        {state.matches.length === 0 && (
          <p className="text-left theme-text font-bold">No matches found.</p>
        )}
        {phase && state.matches.length > 0 && (
          <div>
            {state.activeMatch && (
              <div className="pb-4">
                <MatchTable
                  controls={controls}
                  division={division}
                  phase={phase}
                  isActive={true}
                  onDeleteStanding={actions.deleteStandingsForPlayerFromMatch}
                  onGetActiveMatch={actions.getActiveMatch}
                  onAddSongToMatchByRoll={actions.addSongToMatchByRoll}
                  onAddSongToMatchBySongId={actions.addSongToMatchBySongId}
                  onEditSongToMatchByRoll={actions.editSongToMatchByRoll}
                  onEditSongToMatchBySongId={actions.editSongToMatchBySongId}
                  onAddStandingToMatch={actions.addStandingToMatch}
                  onEditStanding={actions.editStandingFromMatch}
                  onRemoveSongFromMatch={actions.removeSongFromMatch}
                  match={state.activeMatch}
                />
              </div>
            )}
            {showPastMatches &&
              state.matches
                .filter((m) => m.id !== state.activeMatch?.id)
                .map((match) => {
                  const activeIndex = state.matches.findIndex(
                    (item) => item.id === state.activeMatch?.id,
                  );
                  const index = state.matches.findIndex(
                    (item) => item.id === match.id,
                  );
                  const isPast = activeIndex >= 0 && index < activeIndex;
                  const roundsUntil =
                    activeIndex >= 0 && index > activeIndex
                      ? index - activeIndex
                      : 0;
                  const statusLabel = isPast
                    ? "Past"
                    : roundsUntil > 0
                      ? `In ${roundsUntil} ${roundsUntil === 1 ? "round" : "rounds"}`
                      : "";
                  return (
                    <MatchTable
                      controls={controls}
                      division={division}
                      phase={phase}
                      onDeleteStanding={actions.deleteStandingsForPlayerFromMatch}
                      onGetActiveMatch={actions.getActiveMatch}
                      isActive={false}
                      statusLabel={statusLabel}
                      onAddSongToMatchByRoll={actions.addSongToMatchByRoll}
                      onAddSongToMatchBySongId={actions.addSongToMatchBySongId}
                      onEditSongToMatchByRoll={actions.editSongToMatchByRoll}
                    onEditSongToMatchBySongId={actions.editSongToMatchBySongId}
                    onAddStandingToMatch={actions.addStandingToMatch}
                    onEditStanding={actions.editStandingFromMatch}
                      onRemoveSongFromMatch={actions.removeSongFromMatch}
                      key={match.id}
                      match={match}
                    />
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
