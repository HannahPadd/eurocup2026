import { useEffect, useState } from "react";
import { Player } from "../../../models/Player";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinus,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Team } from "../../../models/Team.ts";
import { Division } from "../../../models/Division.ts";
import Select from "react-select";
import { toast } from "react-toastify";
import useAuth from "../../../hooks/useAuth";
import { getPlayerDivisionIds } from "../../../utils/playerDivisions";
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

export default function PlayersList({ onImport }: { onImport?: () => void }) {
  const { auth, setAuth } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [qualifierSubmissions, setQualifierSubmissions] = useState<
    PlayerQualifierSubmission[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(-1);

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
    setAuth((prev) =>
      prev ? { ...prev, isAdmin: nextIsAdmin } : prev,
    );
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
        ] = await Promise.all([
          axios.get<Player[]>("players"),
          axios.get<Team[]>("teams"),
          axios.get<Division[]>("divisions"),
          axios.get<PlayerQualifierSubmission[]>("qualifiers/admin/submissions"),
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

  const deletePlayer = (id: number) => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      axios.delete(`players/${id}`).then(() => {
        setPlayers(players.filter((p) => p.id !== id));
        setSelectedPlayerId(-1);
      });
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
        <div className="flex flex-row gap-3 items-center ">
          <h2 className="theme-text">Players List</h2>
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="rounded-md border border-slate-500/40 bg-slate-600/20 px-2 py-1 text-xs font-semibold text-slate-100"
            >
              Import players
            </button>
          )}
          <button
            onClick={createPlayer}
            title="Add new player"
            className="inline-flex items-center gap-2 rounded-md border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-700"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add player</span>
          </button>
        </div>
        <div className="flex flex-col gap-5 md:flex-row">
          <div
            className={`bg-gray-100 text-gray-900 w-full md:w-[260px] h-[400px] overflow-auto ${
              selectedPlayerId >= 0 ? "hidden md:block" : ""
            }`}
          >
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
          <div className="flex-1 min-w-0">
            {selectedPlayerId >= 0 && (
              <button
                className="mb-2 inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-3 py-1 text-sm text-blue-700 md:hidden"
                onClick={() => setSelectedPlayerId(-1)}
              >
                Select other player
              </button>
            )}
            {selectedPlayerId < 0 && (
              <div className={"theme-text"}>Select a player from the list to view informations.</div>
            )}
            {selectedPlayerId >= 0 && (
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
                    setPlayers(
                      (prev) =>
                        prev.map((p) =>
                          p.id === playerId ? response.data : p,
                        ),
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
                      prev.map((p) =>
                        p.id === playerId ? response.data : p,
                      ),
                    );
                    toast.success("Player divisions updated");
                  } catch (error) {
                    toast.error("Unable to update player divisions");
                  }
                }}
                qualifierSubmissions={qualifierSubmissions
                  .filter((submission) => submission.player?.id === selectedPlayerId)
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                  )}
              />
            )}
          </div>
        </div>
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
  qualifierSubmissions,
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
  qualifierSubmissions: PlayerQualifierSubmission[];
}) {
  const selectedDivisionIds = getPlayerDivisionIds(player);
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
      const message = axios.isAxiosError(error) &&
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Unable to update password.";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className={"rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 theme-text"}>
      <h3 className="text-2xl theme-text">Player Information</h3>
      <div>
        <h3 className="theme-text text-sm uppercase tracking-wide">Name</h3>
        <span className="text-lg font-semibold text-white">
          {getPlayerDisplayName(player)}
        </span>
      </div>

      <div>
        <h3 className="theme-text text-sm uppercase tracking-wide">Divisions</h3>
        <span className="text-white">
          {player.divisions && player.divisions.length > 0
            ? player.divisions.map((division) => division.name).join(", ")
            : "None"}
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
      <h3 className="mt-3 theme-text">Player Scores</h3>
      <p>No scores on record for this player.</p>
      <div className="mt-3">
        <h3 className="theme-text text-sm uppercase tracking-wide">
          Qualifier submissions
        </h3>
        {qualifierSubmissions.length === 0 ? (
          <p className="mt-1 text-xs text-gray-300">No qualifier submissions yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-white/10">
            {qualifierSubmissions.map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{submission.song?.title}</p>
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
        onToggleDivision={toggleDivision}
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
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
        </div>
      </OkModal>
    </div>
  );
}
