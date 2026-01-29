import { useEffect, useState } from "react";
import { Phase } from "../../../models/Phase";
import { Division } from "../../../models/Division";
import Select from "react-select";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

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

  useEffect(() => {
    axios.get<Division>(`divisions/${divisionId}`).then((response) => {
      const phases = response.data.phases;
      setPhases(phases);
      if (phases.length > 0) {
        setSelectedPhaseId(phases[0].id);
        onPhaseSelect(phases[0]);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  const createPhase = () => {
    const name = prompt("Enter phase name");

    if (name) {
      axios.post<Phase>(`phases`, { divisionId, name }).then((response) => {
        setPhases([...phases, response.data]);
        setSelectedPhaseId(response.data.id);
      });
    }
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
    <div className="flex flex-row gap-3">
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
            className="text-green-700"
            title="Create new division"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            onClick={deletePhase}
            className="text-red-700 disabled:text-red-200"
            disabled={selectedPhaseId === -1}
            title={
              selectedPhaseId === -1
                ? "plz select phase to delete"
                : "Delete phase"
            }
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </>
      )}
    </div>
  );
}
