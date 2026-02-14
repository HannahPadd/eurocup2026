import { useEffect, useMemo, useState } from "react";
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

type TournamentSettingsProps = {
  controls: boolean;
};

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
      return;
    }
    try {
      const [matchesResponse, activeMatchResponse] = await Promise.all([
        axios.get<Match[]>(`tournament/expandphase/${selectedPhase.id}`),
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
    }
  };

  useEffect(() => {
    loadMatchActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase?.id, matchRefreshSignal]);

  const triggerMatchRefresh = () => setMatchRefreshSignal((prev) => prev + 1);

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
                )}
                {controls && selectedPhase && matches.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      Matches
                    </div>
                    <div className="mt-2 space-y-2">
                      {matches.map((match, index) => {
                        const isActive = activeMatchId === match.id;
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
                onMatchesSnapshot={(nextMatches, activeMatch) => {
                  setMatches(nextMatches);
                  setActiveMatchId(activeMatch?.id ?? null);
                }}
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
