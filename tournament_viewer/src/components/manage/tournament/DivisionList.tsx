import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Division } from "../../../models/Division";
import { faPlus, faTrash, faUsers } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import { useEffect, useState } from "react";
import axios from "axios";

type DivisionListProps = {
  onDivisionSelect: (division: Division |null) => void;
  controls?: boolean;
  onManageDivisionMembers?: () => void;
};

export default function DivisionList({
  onDivisionSelect,
  controls = false,
  onManageDivisionMembers,
}: DivisionListProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number>(-1);

  useEffect(() => {
    axios.get<Division[]>("divisions").then((response) => {
      setDivisions(response.data);
    });
  }, []);

  // Division functions
  const createDivision = () => {
    const name = prompt("Enter division name");

    if (name) {
      axios.post<Division>("divisions", { tournamentId: 1 , name: name }).then((response) => {
        setDivisions([...divisions, response.data]);
        setSelectedDivisionId(response.data.id);
      });
    }
  };

  const deleteDivision = () => {
    // ask the user double confirmation because it's a dangerous action
    if (
      window.confirm("WARNING!! Are you sure you want to delete this division?")
    ) {
      if (
        window.confirm(
          "WARNING!! This action is irreversible. Are you really sure?",
        )
      ) {
        axios.delete(`divisions/${selectedDivisionId}`).then(() => {
          setDivisions(divisions.filter((d) => d.id !== selectedDivisionId));
          setSelectedDivisionId(-1);
        });
      }
    }
  };
  return (
    <div className="flex flex-col gap-2 text-black">
      <Select
        className="min-w-[300px]"
        placeholder="Select division"
        options={divisions.map((d) => ({ value: d.id, label: d.name }))}
        onChange={(e) => {
          onDivisionSelect(divisions.find((d) => d.id === e?.value) ?? null);
          setSelectedDivisionId(e?.value ?? -1);
        }}
        value={
          selectedDivisionId >= 0
            ? {
                value: divisions.find((d) => d.id === selectedDivisionId)?.id,
                label: divisions.find((d) => d.id === selectedDivisionId)?.name,
              }
            : null
        }
      />
      {controls && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={createDivision}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
            title="Create new division"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add division
          </button>
          <button
            onClick={onManageDivisionMembers}
            className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectedDivisionId === -1 || !onManageDivisionMembers}
            title={
              selectedDivisionId === -1
                ? "Select division to manage players"
                : "Manage division players"
            }
          >
            <FontAwesomeIcon icon={faUsers} />
            Players
          </button>
          <button
            onClick={deleteDivision}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectedDivisionId === -1}
            title={
              selectedDivisionId === -1
                ? "plz select division to delete"
                : "Delete division"
            }
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
