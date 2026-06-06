import { useEffect, useMemo, useState } from "react";
import { Player } from "../../../models/Player";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinus,
  faPenToSquare,
  faPlus,
  faTableList,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Team } from "../../../models/Team.ts";
import { Division } from "../../../models/Division.ts";
import Select from "react-select";
import { toast } from "react-toastify";
import useAuth from "../../../hooks/useAuth";
import {
  getPlayerForcedDivisionIds,
  getPlayerDivisionIds,
  isPlayerForcedInDivision,
  isPlayerInDivision,
} from "../../../utils/playerDivisions";
import { isQualifierPhase } from "../../../utils/qualifierPhase";
import PlayerDivisionsModal from "../divisions/PlayerDivisionsModal";
import OkModal from "../../layout/OkModal";

const getPlayerDisplayName = (player: Player) =>
  (player.playerName ?? player.name ?? "").trim() || "Unnamed player";

type PlayerQualifierSubmission = {
  id: number;
  percentage: number;
  status: "pending" | "approved" | "rejected" | string;
  updatedAt: string;
  player: {
    id: number;
  };
  song: {
    title: string;
    group: string;
    difficulty: number;
  };
};

type QualifierRankingEntry = {
  playerId: number;
  playerName: string;
  playerCountry?: string;
  averagePercentage: number;
  submittedCount: number;
  manualOverride?: boolean;
};

type QualifierDivisionRanking = {
  divisionId: number;
  divisionName: string;
  totalSongs: number;
  rankings: QualifierRankingEntry[];
  recommendedAdvances?: QualifierRankingEntry[];
};

const normalizeSubmissionStatus = (status?: string) =>
  (status ?? "").trim().toLowerCase();

const getSubmissionStatusClass = (status?: string) => {
  const normalized = normalizeSubmissionStatus(status);
  if (normalized === "approved") {
    return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  }
  if (normalized === "rejected") {
    return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  }
  return "border-slate-400/40 bg-slate-500/15 text-slate-100";
};

const formatSubmissionStatus = (status?: string) => {
  const normalized = normalizeSubmissionStatus(status);
  if (!normalized) {
    return "Pending";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

type PlayersViewMode = "details" | "registrations";

const baseRegistrationStatusClass =
  "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold";

const registrationStatusClasses = {
  registered: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  qualified: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  notQualified: "border-red-400/50 bg-red-500/15 text-red-200",
  forced: "border-sky-400/50 bg-sky-500/15 text-sky-100",
};

const getDivisionRegistrationStatus = (
  player: Player,
  division: Division,
  qualifierRankings: QualifierDivisionRanking[],
) => {
  if (isPlayerForcedInDivision(player, division.id)) {
    return {
      label: "Forced",
      className: registrationStatusClasses.forced,
    };
  }

  const qualifierRanking = qualifierRankings.find(
    (ranking) => ranking.divisionId === division.id,
  );
  const qualifierRequired =
    (qualifierRanking?.totalSongs ?? 0) > 0 ||
    (division.phases ?? []).some((phase) => isQualifierPhase(phase));

  if (!qualifierRequired) {
    return {
      label: "Registered",
      className: registrationStatusClasses.registered,
    };
  }

  const qualifiedPlayerIds = new Set(
    (
      qualifierRanking?.recommendedAdvances ??
      qualifierRanking?.rankings ??
      []
    ).map((entry) => entry.playerId),
  );

  if (qualifiedPlayerIds.has(player.id)) {
    return {
      label: "Qualified",
      className: registrationStatusClasses.qualified,
    };
  }

  return {
    label: "Not qualified",
    className: registrationStatusClasses.notQualified,
  };
};

const getDivisionQualifierRanking = (
  division: Division | undefined,
  qualifierRankings: QualifierDivisionRanking[],
) =>
  division
    ? qualifierRankings.find((ranking) => ranking.divisionId === division.id)
    : undefined;

const isQualifierRequiredForDivision = (
  division: Division | undefined,
  qualifierRanking?: QualifierDivisionRanking,
) =>
  Boolean(
    division &&
    ((qualifierRanking?.totalSongs ?? 0) > 0 ||
      (division.phases ?? []).some((phase) => isQualifierPhase(phase))),
  );

const isTechPlacementDivision = (division: Division | undefined) =>
  Boolean(
    division?.name
      .trim()
      .toUpperCase()
      .match(/\b(LOW|MID|HIGH)\b/),
  );

export default function PlayersList() {
  const { auth, setAuth } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [qualifierSubmissions, setQualifierSubmissions] = useState<
    PlayerQualifierSubmission[]
  >([]);
  const [qualifierRankings, setQualifierRankings] = useState<
    QualifierDivisionRanking[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<PlayersViewMode>("details");
  const [selectedDivisionId, setSelectedDivisionId] = useState<number>(-1);

  const [search, setSearch] = useState<string>("");

  const isCurrentUser = (player: Player) => {
    if (!auth?.username) {
      return false;
    }
    const authName = auth.username.trim().toLowerCase();
    const playerName = getPlayerDisplayName(player).trim().toLowerCase();
    return authName.length > 0 && authName === playerName;
  };

  const syncAuthAdmin = (
    player: Player,
    updates: { isAdmin?: boolean; hasRegistered?: boolean },
  ) => {
    if (!isCurrentUser(player)) {
      return;
    }
    const nextIsAdmin = player.isAdmin ?? updates.isAdmin;
    if (typeof nextIsAdmin !== "boolean") {
      return;
    }
    setAuth((prev) => (prev ? { ...prev, isAdmin: nextIsAdmin } : prev));
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [
          playersResponse,
          teamsResponse,
          divisionsResponse,
          qualifierSubmissionsResponse,
          qualifierRankingsResponse,
        ] = await Promise.all([
          axios.get<Player[]>("players"),
          axios.get<Team[]>("teams"),
          axios.get<Division[]>("divisions"),
          axios.get<PlayerQualifierSubmission[]>(
            "qualifiers/admin/submissions",
          ),
          axios.get<QualifierDivisionRanking[]>("qualifiers/rankings"),
        ]);
        if (!isMounted) {
          return;
        }
        setPlayers(
          playersResponse.data.sort((a, b) =>
            getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b)),
          ),
        );
        setTeams(
          teamsResponse.data.sort((a, b) => a.name.localeCompare(b.name)),
        );
        setDivisions(
          (divisionsResponse.data ?? []).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        setQualifierSubmissions(qualifierSubmissionsResponse.data ?? []);
        setQualifierRankings(qualifierRankingsResponse.data ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setLoadError(
          "Unable to load players. Check your API key and server connection.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getSelectedPlayer = () => {
    return players.find((p) => p.id === selectedPlayerId);
  };

  useEffect(() => {
    if (selectedDivisionId >= 0 || divisions.length === 0) {
      return;
    }
    setSelectedDivisionId(divisions[0].id);
  }, [divisions, selectedDivisionId]);

  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId),
    [divisions, selectedDivisionId],
  );

  const registeredPlayersForDivision = useMemo(() => {
    if (!selectedDivision) {
      return [];
    }

    const registeredPlayers = players.filter(
      (player) =>
        isPlayerInDivision(player, selectedDivision.id) ||
        isPlayerForcedInDivision(player, selectedDivision.id),
    );
    const qualifierRanking = getDivisionQualifierRanking(
      selectedDivision,
      qualifierRankings,
    );

    if (
      isQualifierRequiredForDivision(selectedDivision, qualifierRanking) &&
      isTechPlacementDivision(selectedDivision)
    ) {
      const placedPlayerIds = new Set(
        (qualifierRanking?.rankings ?? []).map((entry) => entry.playerId),
      );
      return registeredPlayers
        .filter(
          (player) =>
            placedPlayerIds.has(player.id) ||
            isPlayerForcedInDivision(player, selectedDivision.id),
        )
        .sort((a, b) => {
          const aIndexRaw =
            qualifierRanking?.rankings.findIndex(
              (entry) => entry.playerId === a.id,
            ) ?? -1;
          const bIndexRaw =
            qualifierRanking?.rankings.findIndex(
              (entry) => entry.playerId === b.id,
            ) ?? -1;
          const aIndex = aIndexRaw >= 0 ? aIndexRaw : Number.MAX_SAFE_INTEGER;
          const bIndex = bIndexRaw >= 0 ? bIndexRaw : Number.MAX_SAFE_INTEGER;
          return aIndex - bIndex;
        });
    }

    return registeredPlayers.sort((a, b) =>
      getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b)),
    );
  }, [players, qualifierRankings, selectedDivision]);

  const openPlayerDetails = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setViewMode("details");
  };

  const createPlayer = () => {
    const name = prompt("Enter player name");

    if (name) {
      axios
        .post<Player>("players", { name, playerName: name })
        .then((response) => {
          setPlayers([...players, response.data]);
        });
    }
  };

  const deletePlayer = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this player?")) {
      return;
    }

    try {
      await axios.delete(`players/${id}`);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      setSelectedPlayerId(-1);
      toast.success("Player deleted");
    } catch (error) {
      toast.error("Unable to delete player");
    }
  };

  const editPlayerName = async (player: Player) => {
    const currentName = getPlayerDisplayName(player);
    const nextName = prompt("Edit player name", currentName)?.trim();
    if (!nextName || nextName === currentName) {
      return;
    }
    try {
      const response = await axios.patch<Player>(`players/${player.id}`, {
        playerName: nextName,
      });
      setPlayers((prev) =>
        prev.map((item) => (item.id === player.id ? response.data : item)),
      );
      setAuth((prev) =>
        prev && prev.username.trim().toLowerCase() === currentName.toLowerCase()
          ? { ...prev, username: nextName }
          : prev,
      );
      toast.success("Player name updated");
    } catch (error) {
      toast.error("Unable to update player name");
    }
  };

  const createTeam = () => {
    const name = prompt("Enter team name");

    if (name) {
      axios.post<Team>("teams", { name }).then((response) => {
        setTeams([...teams, response.data]);
      });
    }
  };

  const deleteTeam = (id: number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      axios.delete(`teams/${id}`).then(() => {
        setTeams(teams.filter((t) => t.id !== id));
      });
    }
  };

  const addToTeam = (playerId: number, teamId: number) => {
    try {
      axios
        .post(`tournament/${playerId}/assignToTeam/${teamId}`)
        .then((response) => {
          setPlayers(
            players.map((p) => (p.id === playerId ? response.data : p)),
          );
          toast.success("Player assigned to team");
        });
    } catch (e) {
      toast.error("Error assigning player to team");
    }
  };

  const removeFromTeam = (playerId: number) => {
    try {
      axios.post(`tournament/${playerId}/removeFromTeam`).then(() => {
        setPlayers(
          players.map((p) =>
            p.id === playerId ? { ...p, teamId: undefined } : p,
          ),
        );
        toast.success("Player removed from team");
      });
    } catch (e) {
      toast.error("Error removing player from team");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-start gap-3 ">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="inline-flex w-fit overflow-hidden rounded-md border border-white/20 bg-white/5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("details")}
              className={`inline-flex items-center gap-2 px-3 py-2 ${
                viewMode === "details"
                  ? "bg-rossoTag text-white"
                  : "theme-text hover:bg-white/10"
              }`}
            >
              <FontAwesomeIcon icon={faUser} />
              Player details
            </button>
            <button
              type="button"
              onClick={() => setViewMode("registrations")}
              className={`inline-flex items-center gap-2 border-l border-white/20 px-3 py-2 ${
                viewMode === "registrations"
                  ? "bg-rossoTag text-white"
                  : "theme-text hover:bg-white/10"
              }`}
            >
              <FontAwesomeIcon icon={faTableList} />
              Division table
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-5 md:flex-row">
          {viewMode === "details" && (
            <div className={selectedPlayerId >= 0 ? "hidden md:block" : ""}>
              <div className="mb-2 flex flex-row flex-wrap items-center gap-3">
                <h2 className="theme-text">Players List</h2>
                <button
                  onClick={createPlayer}
                  title="Add new player"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-700"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add player</span>
                </button>
              </div>
              <div className="h-[400px] w-full overflow-auto bg-gray-100 text-gray-900 md:w-[260px]">
                <input
                  className="p-1 w-full border-blu border outline-none"
                  type="search"
                  placeholder="Search player..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {loading && (
                  <div className="text-center py-2 text-gray-500">
                    Loading players...
                  </div>
                )}
                {!loading && loadError && (
                  <div className="text-center py-2 theme-text">{loadError}</div>
                )}
                {!loading &&
                  !loadError &&
                  players
                    .filter((p) =>
                      search.length === 0
                        ? true
                        : getPlayerDisplayName(p)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                    )
                    .map((player) => {
                      const displayName = getPlayerDisplayName(player);
                      return (
                        <div
                          key={player.id}
                          role="button"
                          onClick={() => setSelectedPlayerId(player.id)}
                          className={`${
                            selectedPlayerId === player.id
                              ? "bg-rossoTag text-white"
                              : "hover:bg-red-700 hover:text-white"
                          } cursor-pointer py-2 px-3 flex justify-between items-center gap-3 `}
                        >
                          <span>{displayName}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editPlayerName(player);
                              }}
                              className="text-sm"
                              title="Edit player name"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlayer(player.id);
                              }}
                              className="text-sm"
                              title="Delete player"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                {search.length > 0 &&
                  players.filter((p) =>
                    getPlayerDisplayName(p)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ).length === 0 && (
                    <div className="text-center py-2 theme-text">
                      No player found
                    </div>
                  )}
                {!loading && !loadError && players.length === 0 && (
                  <div className="text-center py-2 text-gray-500">
                    No players yet.
                  </div>
                )}
              </div>
            </div>
          )}
          {viewMode === "registrations" && (
            <div className="w-full md:w-[260px]">
              <div className="mb-2 flex flex-row flex-wrap items-center gap-3">
                <h2 className="theme-text">Divisions</h2>
              </div>
              <div className="h-[400px] w-full overflow-auto bg-gray-100 text-gray-900">
                {divisions.map((division) => (
                  <div
                    key={division.id}
                    role="button"
                    onClick={() => setSelectedDivisionId(division.id)}
                    className={`${
                      selectedDivisionId === division.id
                        ? "bg-rossoTag text-white"
                        : "hover:bg-red-700 hover:text-white"
                    } cursor-pointer py-2 px-3`}
                  >
                    {division.name}
                  </div>
                ))}
                {divisions.length === 0 && (
                  <div className="text-center py-2 text-gray-500">
                    No divisions available.
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {viewMode === "details" && selectedPlayerId >= 0 && (
              <button
                className="mb-2 inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-3 py-1 text-sm text-blue-700 md:hidden"
                onClick={() => setSelectedPlayerId(-1)}
              >
                Select other player
              </button>
            )}
            {viewMode === "details" && selectedPlayerId < 0 && (
              <div className={"theme-text"}>
                Select a player from the list to view information.
              </div>
            )}
            {viewMode === "details" && selectedPlayerId >= 0 && (
              <PlayerItem
                teams={teams}
                player={getSelectedPlayer() as Player}
                addToTeam={addToTeam}
                removeFromTeam={removeFromTeam}
                createTeam={createTeam}
                deleteTeam={deleteTeam}
                divisions={divisions}
                onUpdateFlags={async (playerId, updates) => {
                  try {
                    const response = await axios.patch<Player>(
                      `players/${playerId}`,
                      updates,
                    );
                    setPlayers((prev) =>
                      prev.map((p) => (p.id === playerId ? response.data : p)),
                    );
                    syncAuthAdmin(response.data, updates);
                    toast.success("Player updated");
                  } catch (error) {
                    toast.error("Unable to update player");
                  }
                }}
                onUpdateDivisions={async (playerId, divisionIds) => {
                  try {
                    const response = await axios.patch<Player>(
                      `players/${playerId}`,
                      {
                        divisionId: divisionIds,
                        hasRegistered: divisionIds.length > 0,
                      },
                    );
                    setPlayers((prev) =>
                      prev.map((p) => (p.id === playerId ? response.data : p)),
                    );
                    toast.success("Player divisions updated");
                  } catch (error) {
                    toast.error("Unable to update player divisions");
                  }
                }}
                onUpdateForcedDivisions={async (
                  playerId,
                  forcedDivisionIds,
                ) => {
                  try {
                    const response = await axios.patch<Player>(
                      `players/${playerId}`,
                      {
                        forcedDivisionIds,
                      },
                    );
                    setPlayers((prev) =>
                      prev.map((p) => (p.id === playerId ? response.data : p)),
                    );
                    toast.success("Forced divisions updated");
                  } catch (error) {
                    toast.error("Unable to update forced divisions");
                  }
                }}
                qualifierSubmissions={qualifierSubmissions
                  .filter(
                    (submission) => submission.player?.id === selectedPlayerId,
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime(),
                  )}
                qualifierRankings={qualifierRankings}
              />
            )}
            {viewMode === "registrations" && (
              <DivisionRegistrationsTable
                players={registeredPlayersForDivision}
                division={selectedDivision}
                totalPlayers={players.length}
                loading={loading}
                loadError={loadError}
                qualifierRankings={qualifierRankings}
                onOpenPlayer={openPlayerDetails}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DivisionRegistrationsTable({
  players,
  division,
  totalPlayers,
  loading,
  loadError,
  qualifierRankings,
  onOpenPlayer,
}: {
  players: Player[];
  division?: Division;
  totalPlayers: number;
  loading: boolean;
  loadError: string | null;
  qualifierRankings: QualifierDivisionRanking[];
  onOpenPlayer: (playerId: number) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 theme-text">
        Loading registrations...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 theme-text">
        {loadError}
      </div>
    );
  }

  if (!division) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 theme-text">
        Create a division to view registered players.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 theme-text">
      <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Registered players
          </h3>
          <p className="text-sm text-gray-300">
            {division.name} - {players.length} of {totalPlayers} players
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/10 text-xs uppercase tracking-wide text-gray-300">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Player
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Country
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Details
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {players.map((player) => {
              const status = getDivisionRegistrationStatus(
                player,
                division,
                qualifierRankings,
              );

              return (
                <tr key={player.id} className="bg-black/10">
                  <td className="px-3 py-2 font-semibold text-white">
                    {getPlayerDisplayName(player)}
                  </td>
                  <td className="px-3 py-2 text-gray-200">
                    {player.country?.trim() || "-"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenPlayer(player.id)}
                      className="text-sm font-semibold text-blue-200 underline-offset-2 hover:text-blue-100 hover:underline"
                    >
                      View details
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`${baseRegistrationStatusClass} ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {players.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-gray-300"
                >
                  No players selected this division on their profile yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerItem({
  player,
  teams,
  addToTeam,
  removeFromTeam,
  createTeam,
  deleteTeam,
  divisions,
  onUpdateFlags,
  onUpdateDivisions,
  onUpdateForcedDivisions,
  qualifierSubmissions,
  qualifierRankings,
}: {
  player: Player;
  teams: Team[];
  addToTeam: (playerId: number, teamId: number) => void;
  removeFromTeam: (playerId: number) => void;
  createTeam: () => void;
  deleteTeam: (teamId: number) => void;
  divisions: Division[];
  onUpdateFlags: (
    playerId: number,
    updates: { isAdmin?: boolean; hasRegistered?: boolean },
  ) => void;
  onUpdateDivisions: (playerId: number, divisionIds: number[]) => void;
  onUpdateForcedDivisions: (
    playerId: number,
    forcedDivisionIds: number[],
  ) => void;
  qualifierSubmissions: PlayerQualifierSubmission[];
  qualifierRankings: QualifierDivisionRanking[];
}) {
  const selectedDivisionIds = getPlayerDivisionIds(player);
  const forcedDivisionIds = getPlayerForcedDivisionIds(player);
  const displayDivisions = divisions.filter(
    (division) =>
      selectedDivisionIds.includes(division.id) ||
      forcedDivisionIds.includes(division.id),
  );
  const [divisionModalOpen, setDivisionModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const toggleDivision = (divisionId: number) => {
    const nextDivisionIds = selectedDivisionIds.includes(divisionId)
      ? selectedDivisionIds.filter((id) => id !== divisionId)
      : [...selectedDivisionIds, divisionId];
    onUpdateDivisions(player.id, nextDivisionIds);
  };

  const toggleForcedDivision = (divisionId: number) => {
    const nextForcedDivisionIds = forcedDivisionIds.includes(divisionId)
      ? forcedDivisionIds.filter((id) => id !== divisionId)
      : [...forcedDivisionIds, divisionId];
    onUpdateForcedDivisions(player.id, nextForcedDivisionIds);
  };

  const openPasswordModal = () => {
    setPasswordError(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPasswordError(null);
  };

  const submitPasswordUpdate = async () => {
    if (!newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await axios.patch(`players/${player.id}/password`, { newPassword });
      toast.success("Password updated");
      setPasswordModalOpen(false);
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) &&
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Unable to update password.";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div
      className={
        "rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 theme-text"
      }
    >
      <h3 className="text-2xl theme-text">Player Information</h3>
      <div>
        <h3 className="theme-text text-sm uppercase tracking-wide">Name</h3>
        <span className="text-lg font-semibold text-white">
          {getPlayerDisplayName(player)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDivisionModalOpen(true)}
        className="w-fit rounded-md border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-100"
      >
        Manage division registration
      </button>
      <button
        type="button"
        onClick={openPasswordModal}
        className="w-fit rounded-md border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-100"
      >
        Set player password
      </button>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={player.isAdmin ?? false}
            onChange={(event) =>
              onUpdateFlags(player.id, { isAdmin: event.target.checked })
            }
          />
          <span>isAdmin</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={player.hasRegistered ?? false}
            onChange={(event) =>
              onUpdateFlags(player.id, { hasRegistered: event.target.checked })
            }
          />
          <span>hasRegistered</span>
        </label>
      </div>
      <div className={"flex flex-wrap gap-2 items-center"}>
        <span>Team: </span>

        <Select
          onChange={(v) => {
            if (v?.value) {
              addToTeam(player.id, v.value);
            }
          }}
          value={
            player.teamId
              ? {
                  label: teams.find((t) => t.id === player.teamId)?.name,
                  value: player.teamId,
                }
              : null
          }
          className={"w-full md:w-56"}
          options={teams.map((t) => ({
            label: t.name,
            value: t.id,
          }))}
        />
        <button onClick={createTeam}>
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button onClick={() => removeFromTeam(player.id)}>
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <button onClick={() => deleteTeam(player.teamId as number)}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
      <div className="w-full">
        <h3 className="theme-text text-sm uppercase tracking-wide">
          Divisions & qualifications
        </h3>
        {displayDivisions.length > 0 ? (
          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {displayDivisions.map((division) => {
              const status = getDivisionRegistrationStatus(
                player,
                division,
                qualifierRankings,
              );

              return (
                <div
                  key={division.id}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-white/10 bg-black/10 px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                    {division.name}
                  </span>
                  <span
                    className={`${baseRegistrationStatusClass} shrink-0 ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-300">
            No registered divisions yet.
          </p>
        )}
      </div>
      <div className="mt-3">
        <h3 className="theme-text text-sm uppercase tracking-wide">
          Qualifier submissions
        </h3>
        {qualifierSubmissions.length === 0 ? (
          <p className="mt-1 text-xs text-gray-300">
            No qualifier submissions yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-white/10">
            {qualifierSubmissions.map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">
                    {submission.song?.title}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {submission.song?.group} · {submission.song?.difficulty}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {submission.percentage}%
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSubmissionStatusClass(submission.status)}`}
                  >
                    {formatSubmissionStatus(submission.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <PlayerDivisionsModal
        open={divisionModalOpen}
        onClose={() => setDivisionModalOpen(false)}
        playerName={getPlayerDisplayName(player)}
        divisions={divisions}
        selectedDivisionIds={selectedDivisionIds}
        forcedDivisionIds={forcedDivisionIds}
        onToggleDivision={toggleDivision}
        onToggleForcedDivision={toggleForcedDivision}
      />
      <OkModal
        title={`Set password for ${getPlayerDisplayName(player)}`}
        open={passwordModalOpen}
        onClose={closePasswordModal}
        onOk={submitPasswordUpdate}
        okText={passwordSaving ? "Saving..." : "Save"}
      >
        <div className="space-y-3">
          <label className="block text-sm text-gray-800">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm text-gray-800">
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              autoComplete="new-password"
            />
          </label>
          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
        </div>
      </OkModal>
    </div>
  );
}
