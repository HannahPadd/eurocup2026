import { useMemo, useState } from "react";
import OkModal from "../../layout/OkModal";
import { Division } from "../../../models/Division";
import { Player } from "../../../models/Player";
import { isPlayerInDivision } from "../../../utils/playerDivisions";

type DivisionMembersModalProps = {
  open: boolean;
  onClose: () => void;
  division: Division | null;
  players: Player[];
  savingPlayerId: number | null;
  onTogglePlayerDivision: (player: Player, division: Division) => void;
};

export default function DivisionMembersModal({
  open,
  onClose,
  division,
  players,
  savingPlayerId,
  onTogglePlayerDivision,
}: DivisionMembersModalProps) {
  const [search, setSearch] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) {
      return players;
    }
    const query = search.trim().toLowerCase();
    return players.filter((player) =>
      (player.playerName ?? player.name ?? "").toLowerCase().includes(query),
    );
  }, [players, search]);

  return (
    <OkModal
      title={`Division Members${division ? ` - ${division.name}` : ""}`}
      open={open}
      onClose={onClose}
      onOk={onClose}
      okText="Close"
    >
      {!division ? (
        <p className="text-sm text-gray-700">Select a division first.</p>
      ) : (
        <div className="space-y-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players..."
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {filteredPlayers.map((player) => {
              const inDivision = isPlayerInDivision(player, division.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm"
                >
                  <span>{player.playerName ?? player.name ?? "Unnamed player"}</span>
                  <button
                    type="button"
                    disabled={savingPlayerId === player.id}
                    onClick={() => onTogglePlayerDivision(player, division)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      inDivision
                        ? "border border-red-300 text-red-700"
                        : "border border-emerald-300 text-emerald-700"
                    } disabled:opacity-60`}
                  >
                    {inDivision ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <p className="text-xs text-gray-500">No matching players.</p>
            )}
          </div>
        </div>
      )}
    </OkModal>
  );
}
