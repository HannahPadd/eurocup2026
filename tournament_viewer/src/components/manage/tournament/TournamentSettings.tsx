import { useCallback, useEffect, useMemo, useState } from "react";
import { Division } from "../../../models/Division";
import DivisionList from "./DivisionList";
import { Phase } from "../../../models/Phase";
import PhaseList from "./PhaseList";
import MatchesView from "./MatchesView";
import { Player } from "../../../models/Player";
import { Match } from "../../../models/Match";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faHandFist,
  faLayerGroup,
  faListCheck,
  faMusic,
  faMedal,
  faPlay,
  faStickyNote,
  faTrash,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  togglePlayerDivisionIds,
} from "../../../utils/playerDivisions";
import DivisionMembersModal from "../divisions/DivisionMembersModal";
import AddEditSongToMatchModal from "./modals/AddEditSongToMatchModal";
import EditMatchNotesModal from "./modals/EditMatchNotesModal";
import EditMatchPlayersModal from "./modals/EditMatchPlayersModal";
import {
  getLiveLobbyCode,
  getLiveLobbyPassword,
  setLiveLobbyCode,
  setLiveLobbyPassword,
} from "../../../utils/liveLobbyCode";

type TournamentSettingsProps = {
  controls: boolean;
};

type MatchCompletionStatus = {
  matchId: number;
  matchName: string;
  ready: boolean;
  totalRounds: number;
  completedRounds: number;
  missingRounds: {
    roundId: number;
    songId: number;
    songTitle: string;
    requiredPlayers: number;
    submittedPlayers: number;
    missingPlayers: { id: number; playerName: string }[];
  }[];
};

type RulesetStepLike = {
  sourceMatchId?: unknown;
};

function parsePositiveNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function resolveStepIndexForMatch(
  phase: Phase | null,
  matchId: number,
): { stepIndex?: number; error?: string } {
  const rawSteps = phase?.ruleset?.config?.steps;
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    return {};
  }

  const stepsWithSource: { index: number; sourceMatchId: number }[] = [];
  rawSteps.forEach((rawStep, index) => {
    const step =
      typeof rawStep === "object" && rawStep
        ? (rawStep as RulesetStepLike)
        : undefined;
    const sourceMatchId = parsePositiveNumber(step?.sourceMatchId);
    if (sourceMatchId) {
      stepsWithSource.push({ index, sourceMatchId });
    }
  });

  if (stepsWithSource.length === 0) {
    if (rawSteps.length === 1) {
      return { stepIndex: 0 };
    }
    return {
      error:
        "This phase has multiple ruleset steps but no valid sourceMatchId mapping. Open Manage > Rulesets and select the step manually.",
    };
  }

  const matchingSteps = stepsWithSource.filter(
    (step) => step.sourceMatchId === matchId,
  );
  if (matchingSteps.length === 1) {
    return { stepIndex: matchingSteps[0].index };
  }
  if (matchingSteps.length > 1) {
    return {
      error:
        "Multiple ruleset steps target this match. Open Manage > Rulesets and select the exact step before commit.",
    };
  }

  return {
    error:
      "No ruleset step targets this match. Open Manage > Rulesets and select the step before commit.",
  };
}

export default function TournamentSettings({
  controls,
}: TournamentSettingsProps) {
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null,
  );
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [savingPlayerId, setSavingPlayerId] = useState<number | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [openCreateMatchModalSignal, setOpenCreateMatchModalSignal] =
    useState(0);
  const [matchRefreshSignal, setMatchRefreshSignal] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [notesMatch, setNotesMatch] = useState<Match | null>(null);
  const [playersMatch, setPlayersMatch] = useState<Match | null>(null);
  const [songsMatch, setSongsMatch] = useState<Match | null>(null);
  const [liveLobbyCode, setLiveLobbyCodeState] = useState(getLiveLobbyCode());
  const [liveLobbyPassword, setLiveLobbyPasswordState] = useState(
    getLiveLobbyPassword(),
  );
  const [completionByMatchId, setCompletionByMatchId] = useState<
    Record<number, MatchCompletionStatus>
  >({});
  const [completionLoadingByMatchId, setCompletionLoadingByMatchId] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    if (!controls) {
      return;
    }
    axios
      .get<Player[]>("players")
      .then((response) => setPlayers(response.data ?? []))
      .catch(() => toast.error("Unable to load players for division setup."));
  }, [controls]);

  const statusLine = useMemo(() => {
    if (!selectedDivision) {
      return "Select a division to begin setup.";
    }
    if (!selectedPhase) {
      return `Division "${selectedDivision.name}" selected. Pick a phase.`;
    }
    return `Editing "${selectedDivision.name}" • "${selectedPhase.name}"`;
  }, [selectedDivision, selectedPhase]);

  const updatePlayerDivision = async (player: Player, division: Division) => {
    const nextDivisionIds = togglePlayerDivisionIds(player, division);
    setSavingPlayerId(player.id);
    try {
      const response = await axios.patch<Player>(`players/${player.id}`, {
        divisionId: nextDivisionIds,
        hasRegistered: nextDivisionIds.length > 0,
      });
      setPlayers((prev) =>
        prev.map((item) => (item.id === player.id ? response.data : item)),
      );
    } catch {
      toast.error("Unable to update player division.");
    } finally {
      setSavingPlayerId(null);
    }
  };

  const activeMatchIndex = matches.findIndex((match) => match.id === activeMatchId);

  const loadMatchActions = async () => {
    if (!selectedPhase) {
      setMatches([]);
      setActiveMatchId(null);
      setCompletionByMatchId({});
      setCompletionLoadingByMatchId({});
      return;
    }
    try {
      const [matchesResponse, activeMatchResponse] = await Promise.all([
        axios.get<Match[]>(`matches/phase/${selectedPhase.id}`),
        axios.get<Match | null>("tournament/activeMatch"),
      ]);
      setMatches(matchesResponse.data ?? []);
      const active = activeMatchResponse.data;
      setActiveMatchId(
        active && (matchesResponse.data ?? []).some((m) => m.id === active.id)
          ? active.id
          : null,
      );

    } catch {
      setMatches([]);
      setActiveMatchId(null);
      setCompletionByMatchId({});
      setCompletionLoadingByMatchId({});
    }
  };

  useEffect(() => {
    loadMatchActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase?.id, matchRefreshSignal]);

  const triggerMatchRefresh = () => setMatchRefreshSignal((prev) => prev + 1);

  const loadCompletionStatus = useCallback(async (matchId: number) => {
    setCompletionLoadingByMatchId((prev) => ({ ...prev, [matchId]: true }));
    try {
      const response = await axios.get<MatchCompletionStatus>(
        `matches/${matchId}/completion-status`,
      );
      setCompletionByMatchId((prev) => ({ ...prev, [matchId]: response.data }));
    } catch {
      toast.error("Unable to load match completion status.");
    } finally {
      setCompletionLoadingByMatchId((prev) => ({ ...prev, [matchId]: false }));
    }
  }, []);

  useEffect(() => {
    if (!activeMatchId) {
      return;
    }
    if (completionByMatchId[activeMatchId]) {
      return;
    }
    void loadCompletionStatus(activeMatchId);
  }, [activeMatchId, completionByMatchId, loadCompletionStatus]);

  const handleMatchesSnapshot = useCallback(
    (nextMatches: Match[], activeMatch: Match | null) => {
      setMatches(nextMatches);
      setActiveMatchId(activeMatch?.id ?? null);
    },
    [],
  );

  const commitProgressionFromGeneral = async (match: Match) => {
    const status = completionByMatchId[match.id];
    if (!status) {
      toast.error("Completion status unavailable. Refresh status first.");
      return;
    }

    if (!status.ready) {
      const missingSummary = status.missingRounds
        .flatMap((round) =>
          round.missingPlayers.map((player) => player.playerName || `#${player.id}`),
        )
        .slice(0, 6)
        .join(", ");
      const accepted = window.confirm(
        `Match is not complete. Missing players include: ${missingSummary || "unknown"}. Commit anyway?`,
      );
      if (!accepted) {
        return;
      }
    }

    const { stepIndex, error: stepResolutionError } = resolveStepIndexForMatch(
      selectedPhase,
      match.id,
    );
    if (stepResolutionError) {
      toast.error(stepResolutionError);
      return;
    }

    try {
      const response = await axios.post<{
        runId: string;
        saved: number;
        autoAssignedPlayers: number;
      }>(`matches/${match.id}/progression/commit`, {
        autoAssignPlayersToTargetMatches: true,
        stepIndex,
      });

      toast.success(
        `Progression committed. Saved ${response.data.saved}, auto-assigned ${response.data.autoAssignedPlayers}.`,
      );
      await loadCompletionStatus(match.id);
      triggerMatchRefresh();
    } catch {
      toast.error(
        "Commit failed. If this phase uses multiple ruleset steps, use Manage > Rulesets to select the step.",
      );
    }
  };

  const setQualifierMatchName = async (matchId: number) => {
    try {
      await axios.patch(`matches/${matchId}`, { name: "Qualifier" });
      triggerMatchRefresh();
      toast.success("Match name set to Qualifier.");
    } catch {
      toast.error("Unable to set qualifier match name.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-3">
          <h2 className="theme-text">
            {controls ? "Configure your tournament" : "History of Tournaments"}!
          </h2>
        </div>
        {controls && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Setup status:</span>
              <span>{statusLine}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                <FontAwesomeIcon icon={faLayerGroup} />
                Pick division
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="opacity-60" />
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                <FontAwesomeIcon icon={faListCheck} />
                Pick phase
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="opacity-60" />
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                Manage matches
              </span>
            </div>
            <div className="mt-3 grid w-full grid-cols-1 gap-2 text-xs text-gray-300 sm:flex sm:flex-wrap sm:items-center">
              <label htmlFor="live-lobby-code" className="font-semibold">
                Live lobby code:
              </label>
              <input
                id="live-lobby-code"
                value={liveLobbyCode}
                onChange={(event) => setLiveLobbyCodeState(event.target.value)}
                onBlur={() =>
                  setLiveLobbyCodeState(setLiveLobbyCode(liveLobbyCode))
                }
                placeholder="BGYJ"
                className="w-full rounded border border-white/20 bg-black/30 px-2 py-1 font-mono uppercase tracking-wide text-white sm:w-24"
              />
              <label htmlFor="live-lobby-password" className="font-semibold sm:ml-2">
                Password:
              </label>
              <input
                id="live-lobby-password"
                type="password"
                value={liveLobbyPassword}
                onChange={(event) =>
                  setLiveLobbyPasswordState(event.target.value)
                }
                onBlur={() =>
                  setLiveLobbyPasswordState(
                    setLiveLobbyPassword(liveLobbyPassword),
                  )
                }
                placeholder="(optional)"
                className="w-full rounded border border-white/20 bg-black/30 px-2 py-1 text-white sm:w-28"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="space-y-3 lg:w-[360px] lg:shrink-0">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Division
            </div>
            <DivisionList
              controls={controls}
              onDivisionSelect={(division) => setSelectedDivision(division)}
              onManageDivisionMembers={() => setMembersModalOpen(true)}
            />
            {selectedDivision && (
              <>
                <div className="text-xs uppercase tracking-wide text-gray-400">
                  Phase
                </div>
                <PhaseList
                  controls={controls}
                  onPhaseSelect={setSelectedPhase}
                  divisionId={selectedDivision.id}
                />
                {controls && selectedPhase && (
                  <div>
                    <div className="text-xs uppercase tracking-wide pb-3 text-gray-400">
                      Matches
                    </div>
                      <div className="inline-flex w-fit self-start bg-gray-200 p-2 px-4 rounded-lg">
                        <button
                          onClick={() => {
                            setOpenCreateMatchModalSignal((prev) => prev + 1)
                            triggerMatchRefresh();
                          }}
                          className="text-green-800 font-bold inline-flex w-fit flex-row gap-2 items-center"
                        >
                          <FontAwesomeIcon icon={faHandFist} />
                          <span>New match</span>
                        </button>
                      </div>
                  </div>
                )}
                {controls && selectedPhase && matches.length > 0 && (
                  <div>
                    <div className="mt-2 space-y-2">
                      {matches.map((match, index) => {
                        const isActive = activeMatchId === match.id;
                        const completion = completionByMatchId[match.id];
                        const completionLoading = Boolean(
                          completionLoadingByMatchId[match.id],
                        );
                        const roundsUntil =
                          activeMatchIndex >= 0 && index > activeMatchIndex
                            ? index - activeMatchIndex
                            : 0;
                        const isPast =
                          activeMatchIndex >= 0 && index < activeMatchIndex;
                        return (
                          <div
                            key={`left-actions-${match.id}`}
                            className="rounded-md border border-white/10 bg-black/20 p-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">
                                {match.name}
                              </span>
                              {isActive && (
                                <span className="text-[10px] rounded-full bg-emerald-700/40 px-2 py-0.5 text-emerald-100">
                                  Active
                                </span>
                              )}
                              {!isActive && isPast && (
                                <span className="text-[10px] rounded-full bg-slate-700/40 px-2 py-0.5 text-slate-200">
                                  Past
                                </span>
                              )}
                              {!isActive && !isPast && roundsUntil > 0 && (
                                <span className="text-[10px] rounded-full bg-blue-700/40 px-2 py-0.5 text-blue-100">
                                  In {roundsUntil} {roundsUntil === 1 ? "round" : "rounds"}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isActive && (
                                <>
                                  <button
                                    title="Commit progression for active match"
                                    onClick={async () => {
                                      await commitProgressionFromGeneral(match);
                                    }}
                                    className="rounded-md border border-amber-400/50 px-2 py-1 text-xs text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={
                                      completionLoading ||
                                      !completion
                                    }
                                  >
                                    Commit
                                  </button>
                                </>
                              )}
                              {!isActive && (
                                <button
                                  title="Set active match"
                                  onClick={async () => {
                                    await axios.post("tournament/setactivematch", {
                                      matchId: match.id,
                                    });
                                    triggerMatchRefresh();
                                  }}
                                  className="rounded-md border border-emerald-400/50 px-2 py-1 text-xs text-emerald-200"
                                >
                                  <FontAwesomeIcon icon={faPlay} />
                                </button>
                              )}
                              <button
                                title="Add song to match"
                                onClick={() => setSongsMatch(match)}
                                className="rounded-md border border-blue-400/50 px-2 py-1 text-xs text-blue-200"
                              >
                                <FontAwesomeIcon icon={faMusic} />
                              </button>
                              <button
                                title="Edit notes"
                                onClick={() => setNotesMatch(match)}
                                className="rounded-md border border-slate-400/50 px-2 py-1 text-xs text-slate-200"
                              >
                                <FontAwesomeIcon icon={faStickyNote} />
                              </button>
                              <button
                                title="Edit players"
                                onClick={() => setPlayersMatch(match)}
                                className="rounded-md border border-indigo-400/50 px-2 py-1 text-xs text-indigo-200"
                              >
                                <FontAwesomeIcon icon={faUsers} />
                              </button>
                              <button
                                title="Set match name to Qualifier"
                                onClick={async () => {
                                  await setQualifierMatchName(match.id);
                                }}
                                className="rounded-md border border-amber-400/50 px-2 py-1 text-xs text-amber-200"
                              >
                                <FontAwesomeIcon icon={faMedal} />
                              </button>
                              <button
                                title="Delete match"
                                onClick={async () => {
                                  await axios.delete(`matches/${match.id}`);
                                  triggerMatchRefresh();
                                }}
                                className="rounded-md border border-red-400/50 px-2 py-1 text-xs text-red-200"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            {!selectedDivision && (
              <p className="text-xs text-gray-400">
                Create or select a division to unlock phase setup.
              </p>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {selectedPhase && selectedDivision ? (
              <MatchesView
                showPastMatches={true}
                controls={controls}
                division={selectedDivision}
                phaseId={selectedPhase.id}
                showCreateButton={false}
                openCreateMatchModalSignal={openCreateMatchModalSignal}
                refreshSignal={matchRefreshSignal}
                onMatchesSnapshot={handleMatchesSnapshot}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-gray-300">
                Select a division and phase to view match information.
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedPhase && songsMatch && (
        <AddEditSongToMatchModal
          open={Boolean(songsMatch)}
          divisionId={selectedDivision?.id ?? -1}
          phaseId={selectedPhase.id}
          matchId={songsMatch.id}
          onAddSongToMatchByRoll={async (divisionId, phaseId, matchId, group, level) => {
            await axios.post("tournament/addsongtomatch", {
              divisionId,
              phaseId,
              matchId,
              group,
              level,
            });
            triggerMatchRefresh();
          }}
          onAddSongToMatchBySongId={async (divisionId, phaseId, matchId, songId) => {
            await axios.post("tournament/addsongtomatch", {
              divisionId,
              phaseId,
              matchId,
              songId,
            });
            triggerMatchRefresh();
          }}
          onEditSongToMatchByRoll={async (divisionId, phaseId, matchId, group, level, editSongId) => {
            await axios.post("tournament/editmatchsong", {
              divisionId,
              phaseId,
              matchId,
              group,
              level,
              songId: editSongId,
              editSongId,
            });
            triggerMatchRefresh();
          }}
          onEditSongToMatchBySongId={async (divisionId, phaseId, matchId, songId, editSongId) => {
            await axios.post("tournament/editmatchsong", {
              divisionId,
              phaseId,
              matchId,
              songId,
              editSongId,
            });
            triggerMatchRefresh();
          }}
          onClose={() => setSongsMatch(null)}
        />
      )}
      {notesMatch && (
        <EditMatchNotesModal
          open={Boolean(notesMatch)}
          match={notesMatch}
          onClose={() => setNotesMatch(null)}
          onSave={async (matchId, notes) => {
            await axios.patch(`matches/${matchId}`, { notes });
            triggerMatchRefresh();
          }}
        />
      )}
      {playersMatch && (
        <EditMatchPlayersModal
          open={Boolean(playersMatch)}
          match={playersMatch}
          onClose={() => setPlayersMatch(null)}
          onSave={async (matchId, playerIds) => {
            await axios.patch(`matches/${matchId}`, { playerIds });
            triggerMatchRefresh();
          }}
        />
      )}
      <DivisionMembersModal
        open={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        division={selectedDivision}
        players={players}
        savingPlayerId={savingPlayerId}
        onTogglePlayerDivision={updatePlayerDivision}
      />
    </div>
  );
}
