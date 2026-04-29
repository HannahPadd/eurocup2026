import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Division } from "../../../models/Division";
import { Player } from "../../../models/Player";
import OkModal from "../../layout/OkModal";
import { isQualifierPhase } from "../../../utils/qualifierPhase";

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

type DivisionRankingExportRow = {
  playerName: string;
  playerCountry?: string;
  averagePercentage: number;
  submittedCount: number;
};

type DivisionRankingExport = {
  divisionName: string;
  rankings?: DivisionRankingExportRow[];
};

type QualifierProgressionPlacementInput = {
  id: number;
  fromRank: string;
  toRank: string;
  targetMatchId: number | "";
};

type QualifierProgressionPreview = {
  divisionId: number;
  divisionName: string;
  source: "RANKINGS" | "RECOMMENDED_ADVANCES";
  totalRankedPlayers: number;
  assignments: Array<{
    playerId: number;
    playerName: string;
    playerCountry?: string;
    averagePercentage: number;
    submittedCount: number;
    rank: number;
    targetMatchId: number;
    targetMatchName: string;
    status: "ASSIGN" | "ALREADY_IN_TARGET" | "SKIPPED_CAPACITY";
  }>;
  unassignedPlayers: Array<{
    playerId: number;
    playerName: string;
    playerCountry?: string;
    averagePercentage: number;
    submittedCount: number;
    rank: number;
  }>;
  boundaryTies: Array<{
    fromRank: number;
    toRank: number;
    playerIds: number[];
    reason: string;
  }>;
  summary: {
    assigned: number;
    alreadyInTarget: number;
    skippedByCapacity: number;
    unassigned: number;
  };
};

type QualifierProgressionCommitResult = {
  runId: string;
  assignedPlayers: number;
  alreadyInTarget: number;
  skippedByCapacity: number;
  clearedMatches: number;
  preview: QualifierProgressionPreview;
};

const normalizeStatus = (status?: string) =>
  (status ?? "").trim().toLowerCase();

const getStatusBadgeClass = (status?: string) => {
  const normalized = normalizeStatus(status);
  if (normalized === "approved") {
    return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  }
  if (normalized === "rejected") {
    return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  }
  return "border-slate-400/40 bg-slate-500/15 text-slate-100";
};

const formatStatusLabel = (status?: string) => {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return "Pending";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const readApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

const downloadCsv = (
  filename: string,
  rows: Array<Array<string | number>>,
) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) =>
          `"${String(cell ?? "").replace(/"/g, '""')}"`,
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
    isQualifierPhase(phase),
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
  const [activeScreenshot, setActiveScreenshot] = useState<{
    url: string;
    playerName: string;
  } | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | "">("");
  const [useRecommendedAdvances, setUseRecommendedAdvances] = useState(false);
  const [clearTargetMatches, setClearTargetMatches] = useState(false);
  const [placements, setPlacements] = useState<QualifierProgressionPlacementInput[]>([
    { id: 1, fromRank: "1", toRank: "10", targetMatchId: "" },
  ]);
  const [nextPlacementId, setNextPlacementId] = useState(2);
  const [progressionPreview, setProgressionPreview] =
    useState<QualifierProgressionPreview | null>(null);
  const [progressionLoading, setProgressionLoading] = useState(false);
  const [progressionError, setProgressionError] = useState<string | null>(null);
  const [progressionMessage, setProgressionMessage] = useState<string | null>(
    null,
  );

  const divisionNameById = useMemo(() => {
    const map = new Map<number, string>();
    divisions.forEach((division) => map.set(division.id, division.name));
    return map;
  }, [divisions]);

  const selectedDivision = useMemo(
    () =>
      selectedDivisionId === ""
        ? null
        : divisions.find((division) => division.id === selectedDivisionId) ??
          null,
    [divisions, selectedDivisionId],
  );

  const selectedDivisionMatches = useMemo(() => {
    if (!selectedDivision) {
      return [];
    }
    return (selectedDivision.phases || []).flatMap((phase) =>
      (phase.matches || []).map((match) => ({
        id: match.id,
        name: match.name,
        phaseName: phase.name,
      })),
    );
  }, [selectedDivision]);

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

  useEffect(() => {
    if (divisions.length === 0) {
      if (selectedDivisionId !== "") {
        setSelectedDivisionId("");
      }
      return;
    }

    if (
      selectedDivisionId === "" ||
      !divisions.some((division) => division.id === selectedDivisionId)
    ) {
      setSelectedDivisionId(divisions[0].id);
    }
  }, [divisions, selectedDivisionId]);

  useEffect(() => {
    if (selectedDivisionMatches.length === 0) {
      setPlacements((prev) => {
        const hasTarget = prev.some((placement) => placement.targetMatchId !== "");
        if (!hasTarget) {
          return prev;
        }
        return prev.map((placement) => ({
          ...placement,
          targetMatchId: "" as const,
        }));
      });
      return;
    }

    const allowedMatchIds = new Set(selectedDivisionMatches.map((match) => match.id));
    setPlacements((prev) => {
      let changed = false;
      const next = prev.map((placement) => {
        if (
          placement.targetMatchId !== "" &&
          !allowedMatchIds.has(placement.targetMatchId)
        ) {
          changed = true;
          return { ...placement, targetMatchId: "" as const };
        }
        return placement;
      });
      return changed ? next : prev;
    });
  }, [selectedDivisionMatches]);

  useEffect(() => {
    setProgressionPreview(null);
    setProgressionError(null);
    setProgressionMessage(null);
  }, [selectedDivisionId, useRecommendedAdvances, placements]);

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
      const response = await axios.get<DivisionRankingExport[]>(
        "qualifiers/rankings",
      );
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
      response.data.forEach((division) => {
        const top = (division.rankings || []).slice(0, count);
        top.forEach((entry, index: number) => {
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

  const addPlacement = () => {
    setPlacements((prev) => [
      ...prev,
      {
        id: nextPlacementId,
        fromRank: "",
        toRank: "",
        targetMatchId: "",
      },
    ]);
    setNextPlacementId((prev) => prev + 1);
  };

  const removePlacement = (id: number) => {
    setPlacements((prev) =>
      prev.length <= 1 ? prev : prev.filter((placement) => placement.id !== id),
    );
  };

  const updatePlacement = (
    id: number,
    field: "fromRank" | "toRank" | "targetMatchId",
    value: string,
  ) => {
    setPlacements((prev) =>
      prev.map((placement) => {
        if (placement.id !== id) {
          return placement;
        }
        if (field === "targetMatchId") {
          return {
            ...placement,
            targetMatchId: value ? Number(value) : "",
          };
        }
        return {
          ...placement,
          [field]: value,
        };
      }),
    );
  };

  const buildProgressionPayload = () => {
    if (selectedDivisionId === "") {
      throw new Error("Select a division first.");
    }

    const normalizedPlacements = placements.map((placement, index) => {
      const fromRank = Number(placement.fromRank);
      const toRank = Number(placement.toRank);
      const targetMatchId = Number(placement.targetMatchId);
      if (
        !Number.isInteger(fromRank) ||
        fromRank < 1 ||
        !Number.isInteger(toRank) ||
        toRank < 1 ||
        !Number.isInteger(targetMatchId) ||
        targetMatchId < 1
      ) {
        throw new Error(
          `Placement ${index + 1} needs valid from/to rank and target match.`,
        );
      }
      return {
        fromRank,
        toRank,
        targetMatchId,
      };
    });

    const orderedPlacements = [...normalizedPlacements].sort(
      (a, b) => a.fromRank - b.fromRank,
    );
    for (const placement of orderedPlacements) {
      if (placement.fromRank > placement.toRank) {
        throw new Error(
          `Invalid placement ${placement.fromRank}-${placement.toRank}; from rank must be <= to rank.`,
        );
      }
    }
    for (let index = 1; index < orderedPlacements.length; index++) {
      const previous = orderedPlacements[index - 1];
      const current = orderedPlacements[index];
      if (current.fromRank <= previous.toRank) {
        throw new Error(
          `Placement ranges overlap (${previous.fromRank}-${previous.toRank} and ${current.fromRank}-${current.toRank}).`,
        );
      }
    }

    return {
      divisionId: selectedDivisionId,
      useRecommendedAdvances,
      placements: normalizedPlacements,
    };
  };

  const previewProgression = async () => {
    setProgressionLoading(true);
    setProgressionError(null);
    setProgressionMessage(null);
    try {
      const payload = buildProgressionPayload();
      const response = await axios.post<QualifierProgressionPreview>(
        "qualifiers/progression/preview",
        payload,
      );
      setProgressionPreview(response.data);
      setProgressionMessage("Qualifier progression preview generated.");
    } catch (err) {
      setProgressionError(
        readApiErrorMessage(err, "Unable to preview qualifier progression."),
      );
    } finally {
      setProgressionLoading(false);
    }
  };

  const commitProgression = async () => {
    setProgressionLoading(true);
    setProgressionError(null);
    setProgressionMessage(null);
    try {
      const payload = {
        ...buildProgressionPayload(),
        clearTargetMatches,
      };
      const response = await axios.post<QualifierProgressionCommitResult>(
        "qualifiers/progression/commit",
        payload,
      );
      setProgressionPreview(response.data.preview);
      setProgressionMessage(
        `Committed seeding run ${response.data.runId}. Assigned ${response.data.assignedPlayers} players.`,
      );
    } catch (err) {
      setProgressionError(
        readApiErrorMessage(err, "Unable to commit qualifier progression."),
      );
    } finally {
      setProgressionLoading(false);
    }
  };

  const selectedCount = selectedIds.size;
  const selectedSubmissions = useMemo(
    () => submissions.filter((submission) => selectedIds.has(submission.id)),
    [selectedIds, submissions],
  );
  const canApproveSelected =
    selectedCount > 0 &&
    selectedSubmissions.some(
      (submission) => normalizeStatus(submission.status) !== "approved",
    );
  const canRejectSelected =
    selectedCount > 0 &&
    selectedSubmissions.some(
      (submission) => normalizeStatus(submission.status) !== "rejected",
    );

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
          <h3 className="text-lg font-semibold theme-text">
            Qualifier Seeding Preview
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={previewProgression}
              disabled={progressionLoading}
              className="rounded-md border border-sky-500 px-3 py-1 text-xs font-semibold text-sky-100 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={commitProgression}
              disabled={progressionLoading}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              Commit seeding
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={selectedDivisionId}
            onChange={(event) =>
              setSelectedDivisionId(
                event.target.value ? Number(event.target.value) : "",
              )
            }
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          >
            <option value="">Select division</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-200">
            <input
              type="checkbox"
              checked={useRecommendedAdvances}
              onChange={(event) =>
                setUseRecommendedAdvances(event.target.checked)
              }
            />
            Use ruleset recommended advances
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-200">
            <input
              type="checkbox"
              checked={clearTargetMatches}
              onChange={(event) =>
                setClearTargetMatches(event.target.checked)
              }
            />
            Clear target matches on commit
          </label>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-100">
              Placement mapping
            </h4>
            <button
              type="button"
              onClick={addPlacement}
              className="rounded-md border border-slate-500 px-2 py-1 text-[11px] font-semibold text-slate-100"
            >
              Add mapping
            </button>
          </div>
          <div className="space-y-2">
            {placements.map((placement, index) => (
              <div
                key={placement.id}
                className="grid grid-cols-1 gap-2 rounded-md border border-white/10 bg-black/20 p-2 md:grid-cols-8"
              >
                <div className="md:col-span-1 text-xs text-gray-300">
                  Slot {index + 1}
                </div>
                <input
                  type="number"
                  min={1}
                  placeholder="From rank"
                  value={placement.fromRank}
                  onChange={(event) =>
                    updatePlacement(placement.id, "fromRank", event.target.value)
                  }
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 md:col-span-2"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="To rank"
                  value={placement.toRank}
                  onChange={(event) =>
                    updatePlacement(placement.id, "toRank", event.target.value)
                  }
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 md:col-span-2"
                />
                <select
                  value={placement.targetMatchId}
                  onChange={(event) =>
                    updatePlacement(
                      placement.id,
                      "targetMatchId",
                      event.target.value,
                    )
                  }
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 md:col-span-2"
                >
                  <option value="">Target match</option>
                  {selectedDivisionMatches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.phaseName} / {match.name} (#{match.id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removePlacement(placement.id)}
                  disabled={placements.length <= 1}
                  className="rounded-md border border-red-500 px-2 py-1 text-[11px] font-semibold text-red-200 disabled:opacity-50 md:col-span-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {progressionLoading && (
          <div className="mt-3 text-xs text-gray-300">Processing...</div>
        )}
        {progressionError && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {progressionError}
          </div>
        )}
        {progressionMessage && (
          <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {progressionMessage}
          </div>
        )}

        {progressionPreview && (
          <div className="mt-4 space-y-3 rounded-md border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-gray-300">
              Division: {progressionPreview.divisionName} | Source:{" "}
              {progressionPreview.source} | Ranked:{" "}
              {progressionPreview.totalRankedPlayers}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-200 md:grid-cols-4">
              <div>Assign: {progressionPreview.summary.assigned}</div>
              <div>Already in target: {progressionPreview.summary.alreadyInTarget}</div>
              <div>Capacity skipped: {progressionPreview.summary.skippedByCapacity}</div>
              <div>Unassigned: {progressionPreview.summary.unassigned}</div>
            </div>

            {progressionPreview.boundaryTies.length > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {progressionPreview.boundaryTies.length} boundary tie warning(s)
                detected. Resolve manually before commit if needed.
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {progressionPreview.boundaryTies.map((warning) => (
                    <li
                      key={`${warning.fromRank}-${warning.toRank}-${warning.playerIds.join("-")}`}
                    >
                      #{warning.fromRank}-#{warning.toRank}: {warning.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-gray-200">
                <thead className="text-gray-300">
                  <tr>
                    <th className="py-2 pr-2">Rank</th>
                    <th className="py-2 pr-2">Player</th>
                    <th className="py-2 pr-2">Avg %</th>
                    <th className="py-2 pr-2">Submitted</th>
                    <th className="py-2 pr-2">Target</th>
                    <th className="py-2 pr-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {progressionPreview.assignments.map((row) => (
                    <tr
                      key={`${row.playerId}-${row.targetMatchId}-${row.rank}`}
                      className="border-t border-white/5"
                    >
                      <td className="py-1 pr-2">#{row.rank}</td>
                      <td className="py-1 pr-2">{row.playerName}</td>
                      <td className="py-1 pr-2">{row.averagePercentage.toFixed(2)}</td>
                      <td className="py-1 pr-2">{row.submittedCount}</td>
                      <td className="py-1 pr-2">{row.targetMatchName}</td>
                      <td className="py-1 pr-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {progressionPreview.unassignedPlayers.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300">
                  Unassigned players ({progressionPreview.unassignedPlayers.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-gray-200">
                    <thead className="text-gray-300">
                      <tr>
                        <th className="py-2 pr-2">Rank</th>
                        <th className="py-2 pr-2">Player</th>
                        <th className="py-2 pr-2">Avg %</th>
                        <th className="py-2 pr-2">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressionPreview.unassignedPlayers.map((row) => (
                        <tr key={row.playerId} className="border-t border-white/5">
                          <td className="py-1 pr-2">#{row.rank}</td>
                          <td className="py-1 pr-2">{row.playerName}</td>
                          <td className="py-1 pr-2">
                            {row.averagePercentage.toFixed(2)}
                          </td>
                          <td className="py-1 pr-2">{row.submittedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

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
            disabled={!canApproveSelected}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            Approve selected
          </button>
          <button
            type="button"
            onClick={() => updateStatus(Array.from(selectedIds), "rejected")}
            disabled={!canRejectSelected}
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
                  <td className="py-2 pr-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(submission.status)}`}
                    >
                      {formatStatusLabel(submission.status)}
                    </span>
                  </td>
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
                        disabled={!submission.screenshotUrl}
                        onClick={() =>
                          setActiveScreenshot({
                            url: submission.screenshotUrl,
                            playerName:
                              submission.player?.playerName ?? "player",
                          })
                        }
                        className="rounded-md border border-sky-500 px-2 py-1 text-[10px] font-semibold text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          submission.screenshotUrl
                            ? "View screenshot"
                            : "No screenshot submitted"
                        }
                      >
                        <FontAwesomeIcon icon={faCamera} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus([submission.id], "approved")}
                        disabled={normalizeStatus(submission.status) === "approved"}
                        className="rounded-md border border-emerald-500 px-2 py-1 text-[10px] font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus([submission.id], "rejected")}
                        disabled={normalizeStatus(submission.status) === "rejected"}
                        className="rounded-md border border-amber-500 px-2 py-1 text-[10px] font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
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
      <OkModal
        title="Qualifier screenshot"
        open={Boolean(activeScreenshot)}
        onClose={() => setActiveScreenshot(null)}
        onOk={() => setActiveScreenshot(null)}
        okText="Close"
      >
        {activeScreenshot && (
          <div className="space-y-3">
            <img
              src={activeScreenshot.url}
              alt={`Qualifier screenshot for ${activeScreenshot.playerName}`}
              className="max-h-[70vh] w-full rounded object-contain"
            />
            <a
              href={activeScreenshot.url}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-xs font-semibold text-sky-700 hover:text-sky-600"
            >
              Open full image
            </a>
          </div>
        )}
      </OkModal>
    </div>
  );
}
