import OkModal from "../../layout/OkModal";
import { Division } from "../../../models/Division";

type PlayerDivisionsModalProps = {
  open: boolean;
  onClose: () => void;
  playerName: string;
  divisions: Division[];
  selectedDivisionIds: number[];
  onToggleDivision: (divisionId: number) => void;
};

export default function PlayerDivisionsModal({
  open,
  onClose,
  playerName,
  divisions,
  selectedDivisionIds,
  onToggleDivision,
}: PlayerDivisionsModalProps) {
  return (
    <OkModal
      title={`Division Registration - ${playerName}`}
      open={open}
      onClose={onClose}
      onOk={onClose}
      okText="Close"
    >
      <div className="flex flex-wrap gap-2">
        {divisions.map((division) => {
          const selected = selectedDivisionIds.includes(division.id);
          return (
            <button
              key={division.id}
              type="button"
              onClick={() => onToggleDivision(division.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                selected
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : "border-gray-300 bg-gray-100 text-gray-800"
              }`}
            >
              {selected ? "Remove " : "Add "}
              {division.name}
            </button>
          );
        })}
        {divisions.length === 0 && (
          <span className="text-xs text-gray-500">No divisions available.</span>
        )}
      </div>
    </OkModal>
  );
}
