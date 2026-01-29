import { useEffect, useState } from "react";
import { Player } from "../../../models/Player";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Team } from "../../../models/Team.ts";
import Select from "react-select";
import { toast } from "react-toastify";

export default function PlayersList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(-1);

  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    axios.get<Player[]>("players").then((response) => {
      setPlayers(response.data.sort((a, b) => a.name.localeCompare(b.name)));
    });

    axios.get<Team[]>("teams").then((response) => {
      setTeams(response.data.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  const getSelectedPlayer = () => {
    return players.find((p) => p.id === selectedPlayerId);
  };

  const createPlayer = () => {
    const name = prompt("Enter player name");

    if (name) {
      axios.post<Player>("players", { name }).then((response) => {
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
        <div className="flex flex-row gap-3 ">
          <h2 className="text-red-700">Players List</h2>
          <button
            onClick={createPlayer}
            title="Add new player"
            className="w-4 text-green-700"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="flex flex-row gap-5">
          <div className="bg-gray-100 w-[200px] h-[400px] overflow-auto">
            <input
              className="p-1 w-full border-blu border outline-none"
              type="search"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {players
              .filter((p) =>
                search.length < 0
                  ? true
                  : p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((player) => {
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
                    <span>{player.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlayer(player.id);
                      }}
                      className="text-sm"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                );
              })}
            {search.length > 0 &&
              players.filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase()),
              ).length === 0 && (
                <div className="text-center py-2 text-red-500">
                  No player found
                </div>
              )}
          </div>
          <div>
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
}: {
  player: Player;
  teams: Team[];
  addToTeam: (playerId: number, teamId: number) => void;
  removeFromTeam: (playerId: number) => void;
  createTeam: () => void;
  deleteTeam: (teamId: number) => void;
}) {
  return (
    <div className={"flex flex-col gap-2 text-red-400"}>
      <h3 className="text-2xl text-red-700">Player Information</h3>
      <div>
        <span>Name: </span>
        <span>{player.name}</span>
      </div>
      <div className={"flex flex-row gap-2 items-center"}>
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
          className={"w-56"}
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
      <h3 className="mt-3 text-red-700">Player Scores</h3>
      <p>No scores on record for this player.</p>
    </div>
  );
}
