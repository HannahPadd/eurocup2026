import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Division } from "../../../models/Division";
import { Phase } from "../../../models/Phase";
import { Player } from "../../../models/Player";

const isSeedingPhase = (phase?: Phase) =>
  (phase?.ruleset?.name ?? "").trim().toLowerCase() === "seeding" ||
  (phase?.name ?? "").toLowerCase().includes("seeding");

type AdminSubmission = {
  id: number;
  percentage: number;
  screenshotUrl: string;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string;
  updatedAt: string;
  player: {
    id: number;
    playerName: string;
    country?: string;
  };
  song: {
    id: number;
    title: string;
    group: string;
    difficulty: number;
  };
  divisionIds: number[];
};

const downloadCsv = (
  filename: string,
  rows: Array<Array<string | number>>,
) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) =>
          `"${String(cell ?? "").replace(/\"/g, '""')}"`,
        )
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getPlayerDisplayName = (player?: Player) =>
  (player?.playerName ?? player?.name ?? "").trim() || "Unnamed player";

const getQualifierSongsForDivision = (division: Division) => {
  const songs: { id: number; title: string }[] = [];
  const seen = new Set<number>();
  const phases = (division.phases || []).filter((phase) =>
    isSeedingPhase(phase),
  );

  for (const phase of phases) {
    for (const match of phase.matches || []) {
      for (const round of match.rounds || []) {
        const song = round.song;
        if (!song || seen.has(song.id)) {
          continue;
        }
        seen.add(song.id);
        songs.push({ id: song.id, title: song.title });
      }
    }
  }
  return songs;
};

export default function QualifiersAdmin() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const divisionNameById = useMemo(() => {
    const map = new Map<number, string>();
    divisions.forEach((division) => map.set(division.id, division.name));
    return map;
  }, [divisions]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [divisionsResponse, playersResponse, submissionsResponse] =
        await Promise.all([
          axios.get<Division[]>("divisions"),
          axios.get<Player[]>("players"),
          axios.get<AdminSubmission[]>("qualifiers/admin/submissions"),
        ]);
      setDivisions(divisionsResponse.data);
      setPlayers(playersResponse.data);
      setSubmissions(submissionsResponse.data);
    } catch (e) {
      setError("Unable to load qualifier admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSubmissions = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      if (statusFilter !== "all" && submission.status !== statusFilter) {
        return false;
      }
      if (!lowered) {
        return true;
      }
      const haystack = [
        submission.player?.playerName,
        submission.song?.title,
        submission.song?.group,
        submission.song?.difficulty,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowered);
    });
  }, [query, statusFilter, submissions]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateStatus = async (
    ids: number[],
    status: "approved" | "rejected" | "pending",
  ) => {
    try {
      await Promise.all(
        ids.map((id) =>
          axios.patch(`qualifiers/admin/submissions/${id}`, { status }),
        ),
      );
      setSubmissions((prev) =>
        prev.map((submission) =>
          ids.includes(submission.id)
            ? { ...submission, status }
            : submission,
        ),
      );
      setSelectedIds(new Set());
    } catch (e) {
      setError("Unable to update submission status.");
    }
  };

  const deleteSubmissions = async (ids: number[]) => {
    if (ids.length === 0) return;
    if (!window.confirm("Delete selected submissions?")) {
      return;
    }
    try {
      await Promise.all(
        ids.map((id) => axios.delete(`qualifiers/admin/submissions/${id}`)),
      );
      setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)));
      setSelectedIds(new Set());
    } catch (e) {
      setError("Unable to delete submissions.");
    }
  };

  const exportSubmissions = () => {
    const rows: Array<Array<string | number>> = [
      [
        "Submission ID",
        "Player",
        "Song",
        "Group",
        "Difficulty",
        "Percentage",
        "Status",
        "Divisions",
        "Screenshot",
        "Updated",
      ],
      ...filteredSubmissions.map(
        (submission): Array<string | number> => [
        submission.id,
        submission.player?.playerName ?? "",
        submission.song?.title ?? "",
        submission.song?.group ?? "",
        submission.song?.difficulty ?? "",
        submission.percentage ?? "",
        submission.status ?? "",
        submission.divisionIds
          .map((id) => divisionNameById.get(id) ?? id)
          .join("; "),
        submission.screenshotUrl ?? "",
        submission.updatedAt ?? "",
      ]),
    ];
    downloadCsv("qualifier-submissions.csv", rows);
  };

  const exportTopN = async () => {
    const input = prompt("Top N per division", "10");
    const count = Number(input ?? "10");
    if (!count || Number.isNaN(count)) {
      return;
    }
    try {
      const response = await axios.get("qualifiers/rankings");
      const rows: string[][] = [
        [
          "Division",
          "Rank",
          "Player",
          "Country",
          "Average %",
          "Submitted",
        ],
      ];
      response.data.forEach((division: any) => {
        const top = (division.rankings || []).slice(0, count);
        top.forEach((entry: any, index: number) => {
          rows.push([
            division.divisionName,
            String(index + 1),
            entry.playerName,
            entry.playerCountry ?? "",
            String(entry.averagePercentage),
            String(entry.submittedCount),
          ]);
        });
      });
      downloadCsv("qualifier-top-n.csv", rows);
    } catch (e) {
      setError("Unable to export top rankings.");
    }
  };

  const exportMissing = () => {
    const rows: string[][] = [
      ["Division", "Player", "Missing count", "Missing songs"],
    ];
    divisions.forEach((division) => {
      const qualifierSongs = getQualifierSongsForDivision(division);
      if (qualifierSongs.length === 0) {
        return;
      }
      const divisionPlayers = players.filter((player) =>
        (player.divisions || []).some((d) => d.id === division.id),
      );
      const submissionsByPlayer = new Map<number, Set<number>>();
      submissions.forEach((submission) => {
        if (!submission.divisionIds.includes(division.id)) {
          return;
        }
        const set = submissionsByPlayer.get(submission.player.id) ?? new Set();
        set.add(submission.song.id);
        submissionsByPlayer.set(submission.player.id, set);
      });

      divisionPlayers.forEach((player) => {
        const submittedSongIds =
          submissionsByPlayer.get(player.id) ?? new Set<number>();
        const missingSongs = qualifierSongs.filter(
          (song) => !submittedSongIds.has(song.id),
        );
        if (missingSongs.length === 0) {
          return;
        }
        rows.push([
          division.name,
          getPlayerDisplayName(player),
          String(missingSongs.length),
          missingSongs.map((song) => song.title).join("; "),
        ]);
      });
    });

    downloadCsv("qualifier-missing-submissions.csv", rows);
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col gap-6">
      {loading && <div className="text-sm text-gray-400">Loading...</div>}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold theme-text">Submissions</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportSubmissions}
              className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold text-slate-100"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportTopN}
              className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold text-slate-100"
            >
              Export top N
            </button>
            <button
              type="button"
              onClick={exportMissing}
              className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold text-slate-100"
            >
              Export missing
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="w-full md:w-64 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
            type="search"
            placeholder="Search player or song"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => updateStatus(Array.from(selectedIds), "approved")}
            disabled={selectedCount === 0}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            Approve selected
          </button>
          <button
            type="button"
            onClick={() => updateStatus(Array.from(selectedIds), "rejected")}
            disabled={selectedCount === 0}
            className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            Reject selected
          </button>
          <button
            type="button"
            onClick={() => deleteSubmissions(Array.from(selectedIds))}
            disabled={selectedCount === 0}
            className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            Delete selected
          </button>
          <span className="text-xs text-gray-300">
            {selectedCount} selected
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-gray-200">
            <thead className="text-gray-300">
              <tr>
                <th className="py-2 pr-2">
                  <input
                    type="checkbox"
                    checked={
                      filteredSubmissions.length > 0 &&
                      filteredSubmissions.every((s) =>
                        selectedIds.has(s.id),
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(
                          new Set(filteredSubmissions.map((s) => s.id)),
                        );
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className="py-2 pr-2">Player</th>
                <th className="py-2 pr-2">Song</th>
                <th className="py-2 pr-2">%</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Divisions</th>
                <th className="py-2 pr-2">Updated</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-t border-white/5">
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(submission.id)}
                      onChange={() => toggleSelection(submission.id)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    {submission.player?.playerName}
                  </td>
                  <td className="py-2 pr-2">
                    {submission.song?.title}
                    <div className="text-[10px] text-gray-400">
                      {submission.song?.group} · {submission.song?.difficulty}
                    </div>
                  </td>
                  <td className="py-2 pr-2">{submission.percentage}</td>
                  <td className="py-2 pr-2 capitalize">{submission.status}</td>
                  <td className="py-2 pr-2">
                    {submission.divisionIds
                      .map((id) => divisionNameById.get(id) ?? id)
                      .join(", ")}
                  </td>
                  <td className="py-2 pr-2">
                    {new Date(submission.updatedAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus([submission.id], "approved")}
                        className="rounded-md border border-emerald-500 px-2 py-1 text-[10px] font-semibold text-emerald-200"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus([submission.id], "rejected")}
                        className="rounded-md border border-amber-500 px-2 py-1 text-[10px] font-semibold text-amber-200"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSubmissions([submission.id])}
                        className="rounded-md border border-red-500 px-2 py-1 text-[10px] font-semibold text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSubmissions.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">
              No submissions found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
