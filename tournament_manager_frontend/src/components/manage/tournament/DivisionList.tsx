import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Division } from "../../../models/Division";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import { useEffect, useState } from "react";
import axios from "axios";

type DivisionListProps = {
  onDivisionSelect: (division: Division | null) => void;
  controls?: boolean;
};

export default function DivisionList({
  onDivisionSelect,
  controls = false,
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
    <div className="flex flex-row gap-3 text-black">
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
        <>
          <button
            onClick={createDivision}
            className="text-green-700"
            title="Create new division"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            onClick={deleteDivision}
            className="text-red-700 disabled:text-red-200"
            disabled={selectedDivisionId === -1}
            title={
              selectedDivisionId === -1
                ? "plz select division to delete"
                : "Delete division"
            }
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </>
      )}
    </div>
  );
}
