import { useState } from "react";
import { Division } from "../../../models/Division";
import DivisionList from "./DivisionList";
import { Phase } from "../../../models/Phase";
import PhaseList from "./PhaseList";
import MatchesView from "./MatchesView";

type TournamentSettingsProps = {
  controls: boolean;
};

export default function TournamentSettings({
  controls,
}: TournamentSettingsProps) {
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null,
  );
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  return (
    <div>
      <div className="flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-3 ">
          <h2 className="theme-text">
            {controls
              ? "Configure your tournament"
              : "History of TagTeamTournament 2024"}
            !
          </h2>
        </div>
        <div className="flex flex-row justify-between gap-3">
          <div>
            <DivisionList
              controls={controls}
              onDivisionSelect={(division) => setSelectedDivision(division)}
            />
            {selectedDivision && (
              <PhaseList
                controls={controls}
                onPhaseSelect={setSelectedPhase}
                divisionId={selectedDivision.id}
              />
            )}
          </div>
        </div>
        {selectedPhase && selectedDivision && (
          <MatchesView
            showPastMatches={true}
            controls={controls}
            division={selectedDivision}
            phaseId={selectedPhase.id}
          />
        )}
      </div>
    </div>
  );
}
