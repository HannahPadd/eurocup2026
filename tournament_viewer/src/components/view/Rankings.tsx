import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { faMedal, faSpoon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Division } from "../../models/Division";
import { connectJsonWebSocket } from "../../services/websocket/jsonWebSocket";

type DivisionRankingStatus = "PLACED" | "QUALIFIED" | "ELIMINATED" | "ACTIVE";

type DivisionRankingRow = {
  placement: number | null;
  liveRank?: number;
  playerId: number;
  playerName: string;
  country?: string;
  status: DivisionRankingStatus;
  phaseName?: string;
  matchName?: string;
  basis: string;
  source: "FINAL_MATCH" | "MATCH_RESULT" | "PROGRESSION" | "REGISTRATION";
  points?: number;
  averagePercentage?: number;
};

type DivisionRankingResponse = {
  divisionId: number;
  divisionName: string;
  rows: DivisionRankingRow[];
};

export default function Rankings() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | "">("");
  const [ranking, setRanking] = useState<DivisionRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDivision = useMemo(
    () =>
      selectedDivisionId === ""
        ? null
        : divisions.find((division) => division.id === selectedDivisionId) ?? null,
    [divisions, selectedDivisionId],
  );

  useEffect(() => {
    const loadDivisions = async () => {
      setError(null);
      try {
        const response = await axios.get<Division[]>("divisions");
        const nextDivisions = response.data ?? [];
        setDivisions(nextDivisions);
        setSelectedDivisionId((current) => current || nextDivisions[0]?.id || "");
      } catch {
        setError("Unable to load divisions.");
      }
    };

    void loadDivisions();
  }, []);

  useEffect(() => {
    if (selectedDivisionId === "") {
      setRanking(null);
      setLoading(false);
      return;
    }

    const loadRanking = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<DivisionRankingResponse>(
          `divisions/${selectedDivisionId}/ranking`,
        );
        setRanking(response.data);
      } catch {
        setError("Unable to load division ranking.");
      } finally {
        setLoading(false);
      }
    };

    void loadRanking();
  }, [selectedDivisionId]);

  useEffect(() => {
    const conn = connectJsonWebSocket(
      "/matchupdatehub",
      {
        OnMatchUpdate: () => {
          if (selectedDivisionId !== "") {
            axios
              .get<DivisionRankingResponse>(
                `divisions/${selectedDivisionId}/ranking`,
              )
              .then((response) => setRanking(response.data))
              .catch(() => setError("Unable to refresh division ranking."));
          }
        },
      },
      { target: "api" },
    );

    return () => {
      conn?.close();
    };
  }, [selectedDivisionId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="rankings-title text-2xl">Division rankings</h2>
          {selectedDivision ? (
            <div className="text-sm text-gray-400">{selectedDivision.name}</div>
          ) : null}
        </div>
        <select
          value={selectedDivisionId}
          onChange={(event) =>
            setSelectedDivisionId(
              event.target.value ? Number(event.target.value) : "",
            )
          }
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white sm:w-72"
        >
          <option value="">Select division</option>
          {divisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-6 text-center text-sm text-gray-300">
          Loading rankings...
        </div>
      ) : ranking && ranking.rows.length > 0 ? (
        <DivisionRankingTable rows={ranking.rows} />
      ) : (
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-6 text-center text-sm text-gray-300">
          No ranking rows yet.
        </div>
      )}
    </div>
  );
}

function DivisionRankingTable({ rows }: { rows: DivisionRankingRow[] }) {
  const medalIcons = [faMedal, faMedal, faMedal, faSpoon];
  const medalColors = ["#dcb700", "#C0C0C0", "#CD7F32", "#da8446"];

  return (
    <div className="overflow-x-auto rounded-md border border-white/10">
      <table className="min-w-full text-left text-sm text-gray-200">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-3 py-2">Rank</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2">Based on</th>
            <th className="px-3 py-2 text-right">Points</th>
            <th className="px-3 py-2 text-right">Avg %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const placementIndex =
              row.placement && row.placement >= 1 && row.placement <= 4
                ? row.placement - 1
                : undefined;
            return (
              <tr
                key={`${row.playerId}-${row.status}-${index}`}
                className="border-t border-white/10"
              >
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-2">
                    {placementIndex !== undefined ? (
                      <FontAwesomeIcon
                        icon={medalIcons[placementIndex]}
                        style={{ color: medalColors[placementIndex] }}
                      />
                    ) : null}
                    <span className="font-semibold">
                      {getRankLabel(row)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-semibold text-gray-100">
                    {row.playerName || `Player #${row.playerId}`}
                  </div>
                  {row.country ? (
                    <div className="text-xs text-gray-400">{row.country}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-gray-300">
                  <div>{row.basis}</div>
                  {row.phaseName && row.phaseName !== row.basis ? (
                    <div className="text-xs text-gray-500">{row.phaseName}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  {row.points !== undefined ? row.points : "-"}
                </td>
                <td className="px-3 py-2 text-right">
                  {row.averagePercentage !== undefined
                    ? row.averagePercentage.toFixed(2)
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getRankLabel(row: DivisionRankingRow) {
  if (row.placement) {
    return `#${row.placement}`;
  }
  if (row.status === "QUALIFIED") {
    return "Qualified";
  }
  if (row.status === "ELIMINATED") {
    return "Out";
  }
  if (row.liveRank) {
    return `Live #${row.liveRank}`;
  }
  return "-";
}
