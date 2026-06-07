import OkModal from "../../layout/OkModal";
import { Division } from "../../../models/Division";

type PlayerDivisionsModalProps = {
  open: boolean;
  onClose: () => void;
  playerName: string;
  divisions: Division[];
  selectedDivisionIds: number[];
  forcedDivisionIds: number[];
  onToggleDivision: (divisionId: number) => void;
  onToggleForcedDivision: (divisionId: number) => void;
};

export default function PlayerDivisionsModal({
  open,
  onClose,
  playerName,
  divisions,
  selectedDivisionIds,
  forcedDivisionIds,
  onToggleDivision,
  onToggleForcedDivision,
}: PlayerDivisionsModalProps) {
  return (
    <OkModal
      title={`Division Registration - ${playerName}`}
      open={open}
      onClose={onClose}
      onOk={onClose}
      okText="Close"
    >
      <div className="space-y-2">
        {divisions.map((division) => {
          const selected = selectedDivisionIds.includes(division.id);
          const forced = forcedDivisionIds.includes(division.id);
          return (
            <div
              key={division.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2 py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                {division.name}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onToggleDivision(division.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    selected
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                      : "border-gray-300 bg-gray-100 text-gray-800"
                  }`}
                >
                  {selected ? "Registered" : "Register"}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleForcedDivision(division.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    forced
                      ? "border-sky-300 bg-sky-100 text-sky-800"
                      : "border-gray-300 bg-gray-100 text-gray-800"
                  }`}
                >
                  {forced ? "Forced" : "Force"}
                </button>
              </div>
            </div>
          );
        })}
        {divisions.length === 0 && (
          <span className="text-xs text-gray-500">No divisions available.</span>
        )}
      </div>
    </OkModal>
  );
}
