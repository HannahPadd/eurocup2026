import { useEffect, useMemo, useState } from "react";
import { Phase } from "../../../models/Phase";
import { Division } from "../../../models/Division";
import { Match } from "../../../models/Match";
import Select from "react-select";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTag,
  faTrash,
  faMusic,
} from "@fortawesome/free-solid-svg-icons";
import OkModal from "../../layout/OkModal";
import AddEditSongToMatchModal from "./modals/AddEditSongToMatchModal";

type PhaseListProps = {
  divisionId: number;
  controls?: boolean;
  onPhaseSelect: (phase: Phase | null) => void;
};

export default function PhaseList({
  divisionId,
  controls = false,
  onPhaseSelect,
}: PhaseListProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number>(-1);
  const [qualifierMatches, setQualifierMatches] = useState<Match[]>([]);
  const [qualifierMatchId, setQualifierMatchId] = useState<number | null>(null);
  const [qualifierMatchModalOpen, setQualifierMatchModalOpen] = useState(false);
  const [qualifierSongModalOpen, setQualifierSongModalOpen] = useState(false);
  const [qualifierError, setQualifierError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<Division>(`divisions/${divisionId}`).then((response) => {
      const phases = response.data.phases;
      setPhases(phases);
      if (phases.length > 0) {
        setSelectedPhaseId(phases[0].id);
        onPhaseSelect(phases[0]);
      }
    });
    setQualifierMatches([]);
    setQualifierMatchId(null);
    setQualifierMatchModalOpen(false);
    setQualifierSongModalOpen(false);
    setQualifierError(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  const selectedPhase = useMemo(
    () => phases.find((phase) => phase.id === selectedPhaseId) ?? null,
    [phases, selectedPhaseId],
  );

  const createPhase = () => {
    const name = prompt("Enter phase name");

    if (name) {
      axios.post<Phase>(`phases`, { divisionId, name }).then((response) => {
        setPhases([...phases, response.data]);
        setSelectedPhaseId(response.data.id);
      });
    }
  };

  const markAsSeeding = () => {
    if (!selectedPhase) {
      return;
    }
    const name = selectedPhase.name ?? "";
    if (name.toLowerCase().includes("seeding")) {
      setQualifierError("Phase already marked as seeding.");
      return;
    }
    const updatedName = `Seeding - ${name}`.trim();
    axios
      .patch<Phase>(`phases/${selectedPhase.id}`, { name: updatedName })
      .then((response) => {
        setPhases(
          phases.map((phase) =>
            phase.id === response.data.id ? response.data : phase,
          ),
        );
        setQualifierError(null);
      })
      .catch((error) => {
        console.error("Error updating phase:", error);
        setQualifierError("Unable to mark phase as seeding.");
      });
  };

  const openQualifierMatchModal = async () => {
    if (!selectedPhase) {
      return;
    }
    setQualifierError(null);
    try {
      const response = await axios.get<Match[]>(
        `tournament/expandphase/${selectedPhase.id}`,
      );
      setQualifierMatches(response.data);
      if (response.data.length > 0) {
        setQualifierMatchId(response.data[0].id);
      } else {
        setQualifierMatchId(null);
      }
      setQualifierMatchModalOpen(true);
    } catch (error) {
      console.error("Error loading matches:", error);
      setQualifierError("Unable to load matches for this phase.");
    }
  };

  const openQualifierSongModal = () => {
    if (!qualifierMatchId || !selectedPhase) {
      setQualifierError("Select a match to manage qualifier songs.");
      return;
    }
    setQualifierMatchModalOpen(false);
    setQualifierSongModalOpen(true);
  };

  const createQualifierMatch = async () => {
    if (!selectedPhase) {
      return;
    }
    setQualifierError(null);
    try {
      const response = await axios.post<Match>(`tournament/addMatch`, {
        divisionId,
        phaseId: selectedPhase.id,
        matchName: "Qualifier",
        subtitle: "Seeding",
        multiplier: 1,
        group: "",
        scoringSystem: "EurocupScoreCalculator",
        isManualMatch: true,
        levels: "",
        songIds: [],
        playerIds: [],
      });
      const createdMatch = response.data;
      setQualifierMatches([createdMatch]);
      setQualifierMatchId(createdMatch.id);
      setQualifierMatchModalOpen(false);
      setQualifierSongModalOpen(true);
    } catch (error) {
      console.error("Error creating qualifier match:", error);
      setQualifierError("Unable to create qualifier match.");
    }
  };

  const addSongToMatchByRoll = async (
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
  ) => {
    await axios.post(`tournament/addSongToMatch`, {
      divisionId,
      phaseId,
      matchId,
      group,
      level,
    });
  };

  const addSongToMatchBySongId = async (
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
  ) => {
    await axios.post(`tournament/addSongToMatch`, {
      divisionId,
      phaseId,
      matchId,
      songId,
    });
  };

  const deletePhase = () => {
    if (window.confirm("Are you sure you want to delete this phase?")) {
      axios.delete(`phases/${selectedPhaseId}`).then(() => {
        setPhases(phases.filter((d) => d.id !== selectedPhaseId));
        setSelectedPhaseId(-1);
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        className="min-w-[300px]"
        placeholder="Select phase"
        options={phases.map((p) => ({ value: p.id, label: p.name }))}
        onChange={(e) => {
          onPhaseSelect(phases.find((p) => p.id === e?.value) ?? null);
          setSelectedPhaseId(e?.value ?? -1);
        }}
        value={
          selectedPhaseId >= 0
            ? {
                value: phases.find((d) => d.id === selectedPhaseId)?.id,
                label: phases.find((d) => d.id === selectedPhaseId)?.name,
              }
            : null
        }
      />
      {controls && (
        <>
          <button
            onClick={createPhase}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
            title="Create new division"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add phase
          </button>
          <button
            onClick={markAsSeeding}
            className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedPhase}
            title={
              selectedPhase
                ? "Mark phase as seeding"
                : "Select phase to mark seeding"
            }
          >
            <FontAwesomeIcon icon={faTag} />
            Mark seeding
          </button>
          <button
            onClick={openQualifierMatchModal}
            className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedPhase}
            title={
              selectedPhase
                ? "Manage qualifier songs"
                : "Select phase to manage qualifiers"
            }
          >
            <FontAwesomeIcon icon={faMusic} />
            Qualifier songs
          </button>
          <button
            onClick={deletePhase}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectedPhaseId === -1}
            title={
              selectedPhaseId === -1
                ? "plz select phase to delete"
                : "Delete phase"
            }
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        </>
      )}
      <OkModal
        title="Qualifier songs"
        okText={qualifierMatches.length > 0 ? "Select match" : "Close"}
        open={qualifierMatchModalOpen}
        onClose={() => setQualifierMatchModalOpen(false)}
        onOk={() => {
          if (qualifierMatches.length === 0) {
            setQualifierMatchModalOpen(false);
            return;
          }
          openQualifierSongModal();
        }}
      >
        {qualifierMatches.length === 0 ? (
          <p className="text-sm text-gray-600">
            No matches exist in this phase. Create a match in the Matches view,
            then return here to add qualifier songs.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Select the match that should hold qualifier songs for this phase.
            </p>
            <Select
              options={qualifierMatches.map((match) => ({
                value: match.id,
                label: match.name,
              }))}
              value={
                qualifierMatchId
                  ? {
                      value: qualifierMatchId,
                      label:
                        qualifierMatches.find((match) => match.id === qualifierMatchId)
                          ?.name ?? "Select match",
                    }
                  : null
              }
              onChange={(selected) =>
                setQualifierMatchId(selected ? selected.value : null)
              }
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        )}
        {qualifierMatches.length === 0 && (
          <button
            type="button"
            className="mt-4 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
            onClick={createQualifierMatch}
          >
            Create qualifier match
          </button>
        )}
      </OkModal>
      <AddEditSongToMatchModal
        divisionId={divisionId}
        phaseId={selectedPhase?.id ?? -1}
        matchId={qualifierMatchId ?? -1}
        open={qualifierSongModalOpen}
        onClose={() => setQualifierSongModalOpen(false)}
        onAddSongToMatchByRoll={addSongToMatchByRoll}
        onAddSongToMatchBySongId={addSongToMatchBySongId}
        onEditSongToMatchByRoll={addSongToMatchByRoll}
        onEditSongToMatchBySongId={addSongToMatchBySongId}
      />
      {qualifierError && (
        <span className="text-xs text-red-600 ml-2">{qualifierError}</span>
      )}
    </div>
  );
}
