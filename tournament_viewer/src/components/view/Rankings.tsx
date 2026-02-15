import { Team } from "../../models/Team.ts";
import { useEffect, useState } from "react";
import axios from "axios";
import { faMedal, faSpoon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Player } from "../../models/Player.ts";
import {toast} from "react-toastify";
import { connectJsonWebSocket } from "../../services/websocket/jsonWebSocket";

export default function Rankings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    axios.get("teams").then((response) => {
      setTeams(response.data);
    });

    axios.get("players").then((response) => {
      setPlayers(response.data);
    });
  }, []);

  useEffect(() => {
    const conn = connectJsonWebSocket("/matchupdatehub", {
      OnMatchUpdate: () => {
        axios.get("teams").then((response) => {
          setTeams(response.data);
        });

        axios.get("players").then((response) => {
          setPlayers(response.data);
        });
      },
    });

    conn.onopen = () => {
      console.log("Now listening to ranking changes.");
      toast.info("Now listening to ranking changes.");
    };

    return () => {
      conn.close();
    };
  }, []);


  return (
    <div>
      <div className={"flex flex-col gap-2"}>
        <h2 className={"rankings-title text-2xl"}>Teams ranking</h2>
        <TeamRanking teams={teams} />
        <h2 className={"rankings-title text-2xl"}>Overall players ranking</h2>
        <PlayerRanking players={players} />
      </div>
    </div>
  );
}

function TeamRanking({ teams }: { teams: Team[] }) {
  const [sortedTeams, setSortedTeams] = useState<Team[]>([]);

  // gold, silver, bronze, wood in hex
  const colors = [
    "#dcb700", // gold
    "#C0C0C0", // silver
    "#CD7F32", // bronze
    "#da8446", // wood
  ];

  const fontAwesomeIcons = [faMedal, faMedal, faMedal, faSpoon];

  useEffect(() => {
    setSortedTeams([...teams].sort((a, b) => b.score - a.score));
  }, [teams]);

  return (
    <div className="rounded-lg shadow-md">
      {sortedTeams.map((team, index) => (
        <div
          key={team.id}
          className={`flex items-center gap-4 p-4 mb-2 rounded-md ${
            index % 2 === 0 ? "rankings-bg-even" : "rankings-bg-odd"
          }`}
          style={{
            borderLeft: `4px solid ${colors[index] || "#ccc"}`,
          }}
        >
          {index <= 3 && (
            <span style={{ color: colors[index] }} className="text-xl">
              <FontAwesomeIcon icon={fontAwesomeIcons[index] || faSpoon} />
            </span>
          )}
          <span className="flex-1 text-lg font-semibold text-gray-200">
            #{index+1} {team.name}
          </span>
          <span
            className="text-gray-300 text-2xl font-bold"
            style={{
              color: colors[index],
            }}
          >
            {team.score}
          </span>
        </div>
      ))}
    </div>
  );
}

function PlayerRanking({ players }: { players: Player[] }) {
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const getPlayerDisplayName = (player: Player) =>
    (player.playerName ?? player.name ?? "").trim() || "Unnamed player";

  // gold, silver, bronze, wood in hex
  const colors = [
    "#dcb700", // gold
    "#C0C0C0", // silver
    "#CD7F32", // bronze
    "#da8446", // wood
  ];

  const fontAwesomeIcons = [faMedal, faMedal, faMedal, faSpoon];

  useEffect(() => {
    setSortedPlayers(
      [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    );
  }, [players]);

  return (
    <div className="rounded-lg shadow-md">
      {sortedPlayers.map((player, index) => (
        <div
          key={player.id}
          className={`flex items-center gap-4 p-4 mb-2 rounded-md ${
            index % 2 === 0 ? "rankings-bg-even" : "rankings-bg-odd"
          }`}
          style={{
            borderLeft: `4px solid ${colors[index] || "white"}`,
          }}
        >
          {index <= 3 && (
            <span style={{ color: colors[index] }} className="text-xl">
              <FontAwesomeIcon icon={fontAwesomeIcons[index] || faSpoon} />
            </span>
          )}
          <span className="flex-1 text-lg font-semibold text-gray-200">
             #{index+1} {getPlayerDisplayName(player)}
          </span>
          <span
            className="text-gray-300 text-2xl font-bold"
            style={{
              color: colors[index],
            }}
          >
            {player.score}
          </span>
        </div>
      ))}
    </div>
  );
}
