import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Division } from "../../../models/Division";

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

type QualifierProgressionPanelProps = {
  divisions: Division[];
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

export default function QualifierProgressionPanel({
  divisions,
}: QualifierProgressionPanelProps) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | "">("");
  const [useRecommendedAdvances, setUseRecommendedAdvances] = useState(false);
  const [clearTargetMatches, setClearTargetMatches] = useState(false);
  const [placements, setPlacements] = useState<
    QualifierProgressionPlacementInput[]
  >([{ id: 1, fromRank: "1", toRank: "10", targetMatchId: "" }]);
  const [nextPlacementId, setNextPlacementId] = useState(2);
  const [progressionPreview, setProgressionPreview] =
    useState<QualifierProgressionPreview | null>(null);
  const [progressionLoading, setProgressionLoading] = useState(false);
  const [progressionError, setProgressionError] = useState<string | null>(null);
  const [progressionMessage, setProgressionMessage] = useState<string | null>(
    null,
  );

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

    const allowedMatchIds = new Set(
      selectedDivisionMatches.map((match) => match.id),
    );
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

  return (
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
            onChange={(event) => setUseRecommendedAdvances(event.target.checked)}
          />
          Use ruleset recommended advances
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-200">
          <input
            type="checkbox"
            checked={clearTargetMatches}
            onChange={(event) => setClearTargetMatches(event.target.checked)}
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
                    <td className="py-1 pr-2">
                      {row.averagePercentage.toFixed(2)}
                    </td>
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
  );
}
