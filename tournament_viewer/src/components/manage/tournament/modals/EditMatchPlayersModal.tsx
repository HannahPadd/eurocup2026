import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import OkModal from "../../../layout/OkModal";
import { Match } from "../../../../models/Match";
import { Player } from "../../../../models/Player";

type Option = {
  value: number;
  label: string;
};

type EditMatchPlayersModalProps = {
  open: boolean;
  match: Match;
  onClose: () => void;
  onSave: (matchId: number, playerIds: number[]) => Promise<void> | void;
};

const getPlayerLabel = (player: Player) =>
  (player.playerName ?? player.name ?? "").trim() || "Unnamed player";

export default function EditMatchPlayersModal({
  open,
  match,
  onClose,
  onSave,
}: EditMatchPlayersModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSaving(false);
    setSelectedPlayerIds((match.players ?? []).map((player) => player.id));
    axios
      .get<Player[]>("players")
      .then((response) => setPlayers(response.data ?? []));
  }, [open, match.players]);

  const options = useMemo<Option[]>(
    () =>
      players.map((player) => ({
        value: player.id,
        label: getPlayerLabel(player),
      })),
    [players],
  );

  const selectedOptions = options.filter((option) =>
    selectedPlayerIds.includes(option.value),
  );

  return (
    <OkModal
      title={`Edit Players - ${match.name}`}
      open={open}
      onClose={onClose}
      onOk={async () => {
        setSaving(true);
        try {
          await onSave(match.id, selectedPlayerIds);
          onClose();
        } finally {
          setSaving(false);
        }
      }}
      okText={saving ? "Saving..." : "Save players"}
    >
      <div className="space-y-2">
        <p className="text-xs text-gray-600">
          Add or remove players assigned to this match.
        </p>
        <Select
          isMulti
          isDisabled={saving}
          options={options}
          value={selectedOptions}
          onChange={(next) =>
            setSelectedPlayerIds((next ?? []).map((item) => item.value))
          }
        />
      </div>
    </OkModal>
  );
}
