import { useEffect, useState } from "react";
import axios from "axios";
import { Phase } from "../../../models/Phase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandFist } from "@fortawesome/free-solid-svg-icons";
import CreateMatchModal from "./modals/CreateMatchModal";
import { Division } from "../../../models/Division";
import MatchTable from "./MatchTable";
import { useMatches } from "../../../services/matches/useMatches";

type MatchesViewProps = {
  phaseId: number;
  controls?: boolean;
  showPastMatches?: boolean;
  division: Division;
};

export default function MatchesView({
  phaseId,
  division,
  showPastMatches = false,
  controls = false,
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

  return (
    <div className="mt-10">
      {phase && controls && (
        <CreateMatchModal
          phase={phase}
          division={division}
          open={createMatchModalOpened}
          onClose={() => setCreateMatchModalOpened(false)}
          onCreate={actions.create}
        />
      )}
      <h1 className="text-center text-3xl theme-text">{phase?.name}</h1>
      {controls && (
        <div className="mt-2 w-full bg-gray-200 p-2 rounded-lg">
          <button
            onClick={() => setCreateMatchModalOpened(true)}
            className="text-green-800 font-bold flex flex-row gap-2 items-center"
          >
            <FontAwesomeIcon icon={faHandFist} />
            <span>New match</span>
          </button>
        </div>
      )}
      <div className="w-full mt-10">
        {state.activeMatch &&
          phase && (
            <div className="pb-20">
              <div>
                <h3 className="text-3xl theme-text text-center">Active match:</h3>
                <MatchTable
                  controls={controls}
                  division={division}
                  phase={phase}
                  isActive={true}
                  onDeleteStanding={actions.deleteStandingsForPlayerFromMatch}
                  onGetActiveMatch={actions.getActiveMatch}
                  onSetActiveMatch={actions.setActiveMatch}
                  onEditMatchNotes={actions.editMatchNotes}
                  onDeleteMatch={actions.deleteMatch}
                  onAddSongToMatchByRoll={actions.addSongToMatchByRoll}
                  onAddSongToMatchBySongId={actions.addSongToMatchBySongId}
                  onEditSongToMatchByRoll={actions.editSongToMatchByRoll}
                  onEditSongToMatchBySongId={actions.editSongToMatchBySongId}
                  onAddStandingToMatch={actions.addStandingToMatch}
                  onEditStanding={actions.editStandingFromMatch}
                  match={state.activeMatch}
                />
              </div>
            </div>
          )}

        {state.matches.length === 0 && (
          <p className="text-center theme-text font-bold">
            No matches found.
          </p>
        )}
        {showPastMatches && (
          <h3 className="text-3xl theme-text  text-center">
            Past matches:
          </h3>
        )}
        {phase &&
          showPastMatches &&
          state.matches
            .filter((m) => m.id !== state.activeMatch?.id)
            .map((match) => (
              <MatchTable
                controls={controls}
                division={division}
                phase={phase}
                onDeleteStanding={actions.deleteStandingsForPlayerFromMatch}
                onGetActiveMatch={actions.getActiveMatch}
                isActive={state.activeMatch?.id === match.id}
                onSetActiveMatch={actions.setActiveMatch}
                onDeleteMatch={actions.deleteMatch}
                onAddSongToMatchByRoll={actions.addSongToMatchByRoll}
                onAddSongToMatchBySongId={actions.addSongToMatchBySongId}
                onEditSongToMatchByRoll={actions.editSongToMatchByRoll}
                onEditSongToMatchBySongId={actions.editSongToMatchBySongId}
                onAddStandingToMatch={actions.addStandingToMatch}
                onEditMatchNotes={actions.editMatchNotes}
                onEditStanding={actions.editStandingFromMatch}
                key={match.id}
                match={match}
              />
            ))}
      </div>
    </div>
  );
}
