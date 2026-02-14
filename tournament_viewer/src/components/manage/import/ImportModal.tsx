import { useMemo, useState } from "react";
import OkModal from "../../layout/OkModal";
import axios from "axios";

const examples = {
  songs: `[
  { "title": "Song A", "difficulty": 10, "group": "Qualifiers" },
  { "title": "Song B", "difficulty": 12, "group": "Qualifiers" }
]`,
  players: `[
  { "name": "Alice", "playerName": "Alice", "country": "US" },
  { "name": "Bob", "playerName": "Bob", "country": "IT" }
]`,
};

type ImportMode = "songs" | "players";

type ImportModalProps = {
  mode: ImportMode | null;
  open: boolean;
  onClose: () => void;
};

type ImportPayload = Record<string, string | number | boolean | null | undefined>;

const parseCsv = (raw: string): ImportPayload[] => {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const entry: ImportPayload = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (value === undefined) {
        return;
      }
      const numberValue = Number(value);
      if (!Number.isNaN(numberValue) && value !== "") {
        entry[header] = numberValue;
      } else if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
        entry[header] = value.toLowerCase() === "true";
      } else {
        entry[header] = value;
      }
    });
    return entry;
  });
};

const parseInput = (raw: string): ImportPayload[] => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as ImportPayload[];
    return Array.isArray(parsed) ? parsed : [];
  }
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as ImportPayload;
    return parsed ? [parsed] : [];
  }
  return parseCsv(trimmed);
};

export default function ImportModal({ mode, open, onClose }: ImportModalProps) {
  const [rawInput, setRawInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    if (mode === "songs") return "tournament/AddBatchSongs";
    if (mode === "players") return "tournament/AddBatchPlayers";
    return "";
  }, [mode]);

  const title = mode === "songs" ? "Import songs" : "Import players";

  const handleSubmit = async () => {
    if (!mode) {
      return;
    }
    setError(null);
    setSuccess(null);
    let items: ImportPayload[] = [];
    try {
      items = parseInput(rawInput);
    } catch (e) {
      setError("Invalid JSON or CSV format.");
      return;
    }

    if (items.length === 0) {
      setError("Provide at least one item to import.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "songs") {
        await axios.post(endpoint, { songs: items });
      } else {
        await axios.post(endpoint, { players: items });
      }
      setSuccess(`Imported ${items.length} ${mode}.`);
      setRawInput("");
    } catch (e) {
      setError("Import failed. Check the payload and API key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OkModal
      open={open}
      onClose={onClose}
      onOk={handleSubmit}
      okText={isSubmitting ? "Importing..." : "Import"}
      title={title}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          Paste JSON array or simple CSV (headers in first row). Fields map
          directly to the backend DTOs.
        </p>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          rows={8}
          placeholder={mode ? examples[mode] : ""}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}
        <div className="text-xs text-gray-500">
          CSV example: title,difficulty,group
        </div>
      </div>
    </OkModal>
  );
}
