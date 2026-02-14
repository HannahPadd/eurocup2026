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

const getPlayerDisplayName = (player: Player) =>
  (player.playerName ?? player.name ?? "").trim() || "Unnamed player";


export default function PlayersList({ onImport }: { onImport?: () => void }) {
  const { auth, setAuth } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
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
        const [playersResponse, teamsResponse, divisionsResponse] = await Promise.all([
          axios.get<Player[]>("players"),
          axios.get<Team[]>("teams"),
          axios.get<Division[]>("divisions"),
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
}) {
  const selectedDivisionIds = getPlayerDivisionIds(player);
  const [divisionModalOpen, setDivisionModalOpen] = useState(false);

  const toggleDivision = (divisionId: number) => {
    const nextDivisionIds = selectedDivisionIds.includes(divisionId)
      ? selectedDivisionIds.filter((id) => id !== divisionId)
      : [...selectedDivisionIds, divisionId];
    onUpdateDivisions(player.id, nextDivisionIds);
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
      <PlayerDivisionsModal
        open={divisionModalOpen}
        onClose={() => setDivisionModalOpen(false)}
        playerName={getPlayerDisplayName(player)}
        divisions={divisions}
        selectedDivisionIds={selectedDivisionIds}
        onToggleDivision={toggleDivision}
      />
    </div>
  );
}
