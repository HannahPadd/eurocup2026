import { useMemo, useState } from "react";
import { Division } from "../../../models/Division";
import DivisionList from "./DivisionList";
import { Phase } from "../../../models/Phase";
import PhaseList from "./PhaseList";
import MatchesView from "./MatchesView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faLayerGroup,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

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
  const statusLine = useMemo(() => {
    if (!selectedDivision) {
      return "Select a division to begin setup.";
    }
    if (!selectedPhase) {
      return `Division "${selectedDivision.name}" selected. Pick a phase.`;
    }
    return `Editing "${selectedDivision.name}" • "${selectedPhase.name}"`;
  }, [selectedDivision, selectedPhase]);

  return (
    <div>
      <div className="flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-3">
          <h2 className="theme-text">
            {controls ? "Configure your tournament" : "History of Tournaments"}!
          </h2>
        </div>
        {controls && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Setup status:</span>
              <span>{statusLine}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                <FontAwesomeIcon icon={faLayerGroup} />
                Pick division
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="opacity-60" />
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                <FontAwesomeIcon icon={faListCheck} />
                Pick phase
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="opacity-60" />
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                Manage matches
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-row justify-between gap-3">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Division
            </div>
            <DivisionList
              controls={controls}
              onDivisionSelect={(division) => setSelectedDivision(division)}
            />
            {selectedDivision && (
              <>
                <div className="text-xs uppercase tracking-wide text-gray-400">
                  Phase
                </div>
                <PhaseList
                  controls={controls}
                  onPhaseSelect={setSelectedPhase}
                  divisionId={selectedDivision.id}
                />
              </>
            )}
            {!selectedDivision && (
              <p className="text-xs text-gray-400">
                Create or select a division to unlock phase setup.
              </p>
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
