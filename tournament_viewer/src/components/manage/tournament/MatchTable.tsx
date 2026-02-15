import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Match } from "../../../models/Match";
import {
  faBan,
  faCircle,
  faInfoCircle,
  faPencil,
  faPlus,
  faRefresh,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Division } from "../../../models/Division";
import { Phase } from "../../../models/Phase";
import AddEditSongToMatchModal from "./modals/AddEditSongToMatchModal";
import { useEffect, useState } from "react";
import AddStandingToMatchModal from "./modals/AddStandingToMatchModal";
import { toast } from "react-toastify";
import { Log } from "../../../models/Log";
import LogViewer from "../../layout/LogViewer";
import { Tab } from "@headlessui/react";
import { classNames } from "../../../pages/ManagePage";
import { connectJsonWebSocket } from "../../../services/websocket/jsonWebSocket";

type MatchTableProps = {
  division: Division;
  phase: Phase;
  match: Match;
  isActive: boolean;
  statusLabel?: string;
  controls?: boolean;
  onGetActiveMatch: () => void;
  onAddSongToMatchByRoll: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
  ) => void;
  onAddSongToMatchBySongId: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
  ) => void;
  onEditSongToMatchByRoll: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
    editSongId: number,
  ) => void;
  onEditSongToMatchBySongId: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
    editSongId: number,
  ) => void;
  onAddStandingToMatch: (
    playerId: number,
    songId: number,
    percentage: number,
    score: number,
    isFailed: boolean,
  ) => void;
  onRemoveSongFromMatch: (matchId: number, songId: number) => void;
  onEditStanding: (
    playerId: number,
    songId: number,
    percentage: number,
    score: number,
    isFailed: boolean,
  ) => void;
  onDeleteStanding: (playerId: number, songId: number) => void;
};

export default function MatchTable({
  division,
  phase,
  match,
  isActive,
  statusLabel,
  controls = false,
  onGetActiveMatch,
  onAddSongToMatchByRoll,
  onAddSongToMatchBySongId,
  onEditSongToMatchByRoll,
  onEditSongToMatchBySongId,
  onAddStandingToMatch,
  onRemoveSongFromMatch,
  onDeleteStanding,
}: MatchTableProps) {
  // Create a lookup table for scores and percentages
  const scoreTable: {
    [key: string]: { score: number; percentage: number; isFailed: boolean };
  } = {};

  const [logs, setLogs] = useState<Log[]>([]);
  const [addSongToMatchModalOpen, setAddSongToMatchModalOpen] = useState(false);
  const [editSongId, setEditSongId] = useState<number | null>(null);

  const [addStandingToMatchModalOpen, setAddStandingToMatchModalOpen] =
    useState(false);

  const [songIdPlayerId, setSongIdPlayerId] = useState<{
    playerId: number;
    playerName: string;
    songId: number;
    songTitle: string;
  }>({ songId: 0, playerId: 0, playerName: "", songTitle: "" });

  match.rounds.forEach((round) => {
    round.standings.forEach((standing) => {
      const key = `${standing.score.player.id}-${standing.score.song.id}`;
      scoreTable[key] = {
        score: standing.points,
        percentage: standing.score.percentage,
        isFailed: standing.score.isFailed,
      };
    });
  });

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const scoreConn = connectJsonWebSocket("/matchupdatehub", {
      OnMatchUpdate: () => {
        onGetActiveMatch();
      },
    });
    scoreConn.onopen = () => {
      console.log("Now listening to match changes.");
      toast.info("Now listening to match changes.");
    };

    let errorConn: WebSocket | null = null;

    if (controls) {
      const onLog = (message: string, error?: string | null) => {
        console.log(message, error);

        if (error) {
          toast.error(`Error: ${message} - ${error}`, {
            autoClose: false,
          });
        }

        setLogs((prevLogs) => [
          ...prevLogs,
          { message, error: error ?? "", timestamp: new Date().toISOString() },
        ]);
      };

      errorConn = connectJsonWebSocket("/logupdatehub", {
        OnLogUpdate: (payload) => {
          const logPayload = payload as Log;
          onLog(logPayload.message, logPayload.error);
        },
        error: (payload) => onLog(String(payload), "error"),
        warning: (payload) => onLog(String(payload), "warning"),
        info: (payload) => onLog(String(payload), null),
      });

      errorConn.onopen = () => {
        console.log("Now listening to log changes.");
        toast.info("Now listening to log changes.");
      };
    }

    return () => {
      scoreConn.close();
      if (errorConn) {
        errorConn.close();
      }
    };
  }, [controls, isActive, onGetActiveMatch]);

  // Calculate total points for each player
  const getTotalPoints = (playerId: number) => {
    return match.rounds
      .map((round) => round.standings.find((s) => s.score.player.id === playerId))
      .reduce((acc, standing) => {
        if (standing) {
          return acc + standing.points;
        }
        return acc;
      }, 0);
  };

  // Sort players by total points
  const sortedPlayers = [...match.players].sort(
    (a, b) => getTotalPoints(b.id) - getTotalPoints(a.id),
  );

  return (
    <div className="flex flex-col w-full p-4 rounded-lg">
      <div className="flex flex-row mb-4 justify-center items-center">
        <div>
          <h2 className="text-center text-4xl font-bold theme-text">
            <div className="flex flex-row justify-center items-center gap-2">
              <span className="text-xl">{match.name}</span>
            </div>
            {(isActive || (!isActive && statusLabel)) && (
              <div className="mt-1 flex justify-center">
                <span
                  className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                    isActive
                      ? "border border-emerald-300/50 text-emerald-200"
                      : "border border-slate-300/40 text-slate-200"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faCircle}
                    className={
                      isActive ? "text-green-200 text-[8px] animate-pulse" : "text-slate-300 text-[8px]"
                    }
                  />
                  {isActive ? "Active" : statusLabel}
                </span>
              </div>
            )}
          </h2>
          {match.subtitle && (
            <p className="text-sm font-normal theme-text flex flex-row items-center gap-1">
              <FontAwesomeIcon icon={faInfoCircle} />
              {match.subtitle}
            </p>
          )}
        </div>
        <AddEditSongToMatchModal
          songId={editSongId}
          phaseId={phase.id}
          matchId={match.id}
          divisionId={division.id}
          open={addSongToMatchModalOpen}
          onAddSongToMatchByRoll={onAddSongToMatchByRoll}
          onAddSongToMatchBySongId={onAddSongToMatchBySongId}
          onEditSongToMatchByRoll={onEditSongToMatchByRoll}
          onEditSongToMatchBySongId={onEditSongToMatchBySongId}
          onClose={() => {
            setAddSongToMatchModalOpen(false);
            setEditSongId(null);
          }}
        />
        <AddStandingToMatchModal
          open={addStandingToMatchModalOpen}
          playerId={songIdPlayerId.playerId}
          isManualMatch={match.isManualMatch}
          songId={songIdPlayerId.songId}
          playerName={songIdPlayerId.playerName}
          songTitle={songIdPlayerId.songTitle}
          onClose={() => {
            setAddStandingToMatchModalOpen(false);
            setSongIdPlayerId({
              playerId: 0,
              songId: 0,
              playerName: "",
              songTitle: "",
            });
          }}
          onAddStandingToMatch={onAddStandingToMatch}
        />
      </div>
      <div className="flex flex-col gap-3">
        <Tab.Group>
          <Tab.List className="flex flex-row gap-10 border-b">
            <Tab
              className={({ selected }) =>
                classNames(
                  "py-2 px-4 text-lg",
                  selected
                    ? "border-b-2 border-blue-500 font-bold text-blue-500"
                    : "text-gray-500",
                )
              }
            >
              Match
            </Tab>
            {controls && (
              <Tab
                className={({ selected }) =>
                  classNames(
                    "py-2 px-4 text-lg",
                    selected
                      ? "border-b-2 border-blue-500 font-bold text-blue-500"
                      : "text-gray-500",
                  )
                }
              >
                Errors & Logs
              </Tab>
            )}
          </Tab.List>
          <Tab.Panels className="mt-3">
            <Tab.Panel>
              <div
                style={{ minWidth: match.rounds.length * 200 }}
                className={`shadow-lg overflow-auto lg:min-w-fit`}
              >
                <div
                  className={`grid grid-cols-${
                    match.rounds.length + 2
                  } w-full bg-lighter rounded-t-lg`}
                  style={{
                    gridTemplateColumns: `repeat(${
                      match.rounds.length + 2
                    }, 1fr)`,
                  }}
                >
                  <div className=" border-bg-lighter p-2">
                    <div className="text-center font-bold text-blue-100">
                      Player
                    </div>
                  </div>
                  {match.rounds.map((round, i) => (
                    <div key={i} className="border-x border-bg-lighter p-2">
                      <div className="text-center font-bold text-blue-100">
                        {round.song.title}
                        {controls && isActive && (
                          <>
                            <button
                              onClick={() => {
                                setEditSongId(round.song.id);
                                setAddSongToMatchModalOpen(true);
                              }}
                              className="ml-3"
                              title="Change round song"
                            >
                              <FontAwesomeIcon icon={faRefresh} />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Remove this song from the match? This only works if the round has no standings.",
                                  )
                                ) {
                                  onRemoveSongFromMatch(match.id, round.song.id);
                                }
                              }}
                              className="ml-2 text-red-200"
                              title="Remove round song"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className=" p-2">
                    <div className="text-center font-bold text-blue-100">
                      Total Points
                      {controls && isActive && (
                        <button
                          onClick={() => setAddSongToMatchModalOpen(true)}
                          className="ml-2"
                          title="Add song to match"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {sortedPlayers.map((player, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-${
                      match.rounds.length + 2
                    } w-full odd:bg-white even:bg-gray-50`}
                    style={{
                      gridTemplateColumns: `repeat(${
                        match.rounds.length + 2
                      }, 1fr)`,
                    }}
                  >
                    <div className="border border-gray-300 p-2">
                      <div className="text-center font-semibold text-gray-700">
                        {player.playerName ?? player.name ?? "Unknown player"}
                      </div>
                    </div>
                    {match.rounds.map((round, j) => {
                      const key = `${player.id}-${round.song.id}`;
                      const scoreData = scoreTable[key];

                      const playerDisabled =
                        scoreData?.isFailed && scoreData?.percentage === -1;

                      if (playerDisabled) {
                        return (
                          <div
                            className={
                              "flex flex-row gap-3 items-center justify-center bg-gray-400"
                            }
                          >
                            <p className={"font-bold"}>Disabled</p>
                            {controls && (
                              <button
                                className={"underline font-red-800 text-xs"}
                                onClick={() =>
                                  onDeleteStanding(player.id, round.song.id)
                                }
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={j} className="border border-gray-300 p-2">
                          <div className="text-center  justify-center flex flex-row gap-3 items-center text-gray-600">
                            <p
                              className={`${
                                scoreData?.isFailed
                                  ? "text-red-500 font-bold"
                                  : "text-black"
                              }`}
                            >
                              {scoreData && !playerDisabled
                                ? `${scoreData.score} (${
                                    scoreData.percentage
                                  }%) ${scoreData.isFailed ? "F" : ""}`
                                : "-"}
                              {controls && isActive && scoreData && (
                                <>
                                  <button
                                    title="Edit standing manually"
                                    className="text-xs ml-3 text-blu"
                                  >
                                    <FontAwesomeIcon icon={faPencil} />
                                  </button>
                                  <button
                                    title="Delete this standing"
                                    className="text-xs ml-3 text-red-500"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Are you sure you want to delete this standing?",
                                        )
                                      ) {
                                        onDeleteStanding(player.id, round.song.id);
                                      }
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </>
                              )}
                            </p>

                            {!scoreData && controls && isActive && (
                              <>
                                <button
                                  title="Manually add score"
                                  className="text-green-700"
                                  onClick={() => {
                                    setAddStandingToMatchModalOpen(true);
                                    setSongIdPlayerId({
                                      playerId: player.id,
                                      songId: round.song.id,
                                      playerName:
                                        player.name ??
                                        player.playerName ??
                                        "Unknown player",
                                      songTitle: round.song.title,
                                    });
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPlus} />
                                </button>
                                <button
                                  title="Disable player for this round"
                                  className="text-xs ml-3 text-red-500"
                                  onClick={() => {
                                    onAddStandingToMatch(
                                      player.id,
                                      round.song.id,
                                      -1,
                                      0,
                                      true,
                                    );
                                  }}
                                >
                                  <FontAwesomeIcon icon={faBan} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="border border-gray-300 p-2">
                      <div className="text-center text-gray-600">
                        {match.rounds
                          .map((round) =>
                            round.standings.find(
                              (s) => s.score.player.id === player.id,
                            ),
                          )
                          .reduce((acc, standing) => {
                            if (standing) {
                              return acc + standing.points;
                            }
                            return acc;
                          }, 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Tab.Panel>
            <Tab.Panel>
              {controls && (
                <div>
                  <LogViewer logs={logs} />
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
