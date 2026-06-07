import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { RawScore } from "../../models/RawScore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faHeart } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Player } from "../../models/Player.ts";
import { Team, TEAM_COLORS } from "../../models/Team.ts";
import { countryToFlagUrl } from "../../utils/flags";
import { connectJsonWebSocket } from "../../services/websocket/jsonWebSocket";
import { getLiveLobbyPassword } from "../../utils/liveLobbyCode";

const normalizePercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const normalizeDifficultyType = (diffType?: string): string => {
  if (!diffType) return "";
  return diffType.replace("Difficulty_", "").toLowerCase();
};

const getDifficultyColor = (diffType?: string): string => {
  switch (normalizeDifficultyType(diffType)) {
    case "beginner":
      return "#22c55e";
    case "easy":
      return "#3b82f6";
    case "normal":
      return "#f59e0b";
    case "hard":
      return "#f97316";
    case "expert":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const normalizePlayerIdentity = (value?: string): string =>
  (value ?? "").trim().toLowerCase();

type LobbyPlayer = {
  profileName: string;
  playerId: string;
  score: number;
  exScore: number;
  health: number;
  failed: boolean;
  diffLevel?: number;
  diffType?: string;
  ready?: boolean;
  judgments?: {
    decents: number;
    excellents: number;
    fantasticPlus: number;
    fantastics: number;
    greats: number;
    holdsHeld: number;
    minesHit: number;
    misses: number;
    totalHolds: number;
    wayOffs: number;
  };
};

type LobbyStatePayload = {
  players?: LobbyPlayer[];
  songInfo?: {
    songPath?: string;
    title?: string;
  };
};

type SendScoreResultPayload = {
  player?: LobbyPlayer;
  songInfo?: {
    songPath?: string;
    title?: string;
  };
};

type LiveScoresProps = {
  divisionName?: string;
  scoreLead?: "FA" | "FA_PLUS";
  phaseName?: string;
  matchName?: string;
  roundLabel?: string;
};

type LiveScoreSnapshot = {
  scores: RawScore[];
  readyById: Record<string, boolean>;
  songTitle: string;
  songDiffType?: string;
  songDiffLevel?: number;
};

let liveScoreSnapshot: LiveScoreSnapshot = {
  scores: [],
  readyById: {},
  songTitle: "",
  songDiffType: undefined,
  songDiffLevel: undefined,
};

type LiveScoreEventName = "lobbyState" | "sendScoreResult";
type LiveScoreEventListener = (
  eventName: LiveScoreEventName,
  payload: unknown,
) => void;

const liveScoreListeners = new Set<LiveScoreEventListener>();
let liveScoreConnection: WebSocket | null = null;

const stripSongNumberPrefix = (title: string): string =>
  title.replace(/^\[\d+\]\s*-\s*/, "");

const getSongTitle = (songInfo?: SendScoreResultPayload["songInfo"]): string =>
  stripSongNumberPrefix(songInfo?.title ?? songInfo?.songPath?.split("/")?.[1] ?? "");

const notifyLiveScoreListeners = (
  eventName: LiveScoreEventName,
  payload: unknown,
) => {
  liveScoreListeners.forEach((listener) => listener(eventName, payload));
};

const spectateLobby = (
  conn: WebSocket,
  password: string,
) => {

  const func = (e: MessageEvent<string>) => {
    const msg = JSON.parse(e.data)
    if(msg.event == 'lobbySearched') {
      if(msg.data.lobbies.length > 0) {
        const lobby = msg.data.lobbies[0];
        conn.send(
          JSON.stringify({
            event: "spectateLobby",
            data: {
              code: lobby.code,
              password,
              spectator: {
                profileName: "Tournament Viewer",
              },
            },
          }),
        );
      }

      conn.removeEventListener("message", func);
    }
  };
  conn.addEventListener("message", func)
  
  conn.send(JSON.stringify({
    event: 'searchLobby',
    data: {
      temporary: false
    }
  }))
};

const spectateLiveLobby = (conn: WebSocket) => {
  const lobbyPassword = getLiveLobbyPassword();

  spectateLobby(conn, lobbyPassword);
};

const ensureLiveScoreConnection = () => {
  if (liveScoreConnection?.readyState === WebSocket.OPEN) {
    spectateLiveLobby(liveScoreConnection);
    return liveScoreConnection;
  }

  if (liveScoreConnection?.readyState === WebSocket.CONNECTING) {
    return liveScoreConnection;
  }

  liveScoreConnection = connectJsonWebSocket("/", {
    lobbyState: (payload: unknown) =>
      notifyLiveScoreListeners("lobbyState", payload),
    sendScoreResult: (payload: unknown) =>
      notifyLiveScoreListeners("sendScoreResult", payload),
  }, { target: "itgonline", disableOnFailure: false });

  if (liveScoreConnection) {
    liveScoreConnection.onopen = () => {
      console.log("Now listening to scores changes.");
      spectateLiveLobby(liveScoreConnection as WebSocket);
    };
    liveScoreConnection.addEventListener("close", () => {
      liveScoreConnection = null;
    });
  }

  return liveScoreConnection;
};

const toRawScore = (
  player: LobbyPlayer,
  songPath: string,
  scoreLead: "FA" | "FA_PLUS",
): RawScore => {
  const faScore = normalizePercent(Number(player.score));
  const faPlusScore = normalizePercent(Number(player.exScore ?? player.score));
  const displayedScore = scoreLead === "FA_PLUS" ? faPlusScore : faScore;
  const judgments = player.judgments;
  if (!judgments) {
    return {
      score: {
        playerName: player.profileName,
        song: songPath,
        formattedScore: displayedScore.toFixed(2),
        faPercentage: faScore.toFixed(2),
        faPlusPercentage: faPlusScore.toFixed(2),
        life: 0,
        isFailed: Boolean(player.failed),
        actualDancePoints: 0,
        currentPossibleDancePoints: 0,
        possibleDancePoints: 0,
        totalHoldsCount: 0,
        playerNumber: parseInt(String(player.playerId ?? "").replace("P", ""), 10),
        id: player.playerId,
        holdNote: { held: 0, letGo: 0, missed: 0, none: 0 },
        tapNote: {
          W0: 0,
          W1: 0,
          W2: 0,
          W3: 0,
          W4: 0,
          W5: 0,
          miss: 0,
          avoidMine: 0,
          checkpointHit: 0,
          checkpointMiss: 0,
          hitMine: 0,
          none: 0,
        },
      },
    };
  }

  const lifePercent = normalizePercent(Number(player.health));

  return {
      score: {
        playerName: player.profileName,
        song: songPath,
        formattedScore: displayedScore.toFixed(2),
        faPercentage: faScore.toFixed(2),
        faPlusPercentage: faPlusScore.toFixed(2),
      life: lifePercent,
      isFailed: Boolean(player.failed),
      actualDancePoints: 0,
      currentPossibleDancePoints: 0,
      possibleDancePoints: 0,
      totalHoldsCount: judgments.totalHolds,
      playerNumber: parseInt(String(player.playerId ?? "").replace("P", ""), 10),
      id: player.playerId,
      holdNote: {
        held: judgments.holdsHeld,
        letGo: 0,
        missed: 0,
        none: 0,
      },
      tapNote: {
        W0: judgments.fantasticPlus,
        W1: judgments.fantastics,
        W2: judgments.excellents,
        W3: judgments.greats,
        W4: judgments.decents,
        W5: judgments.wayOffs,
        miss: judgments.misses,
        avoidMine: 0,
        checkpointHit: 0,
        checkpointMiss: 0,
        hitMine: judgments.minesHit,
        none: 0,
      },
    },
  };
};

export default function LiveScores({
  divisionName,
  scoreLead = "FA",
  phaseName,
  matchName,
  roundLabel,
}: LiveScoresProps) {
  const [scores, setScores] = useState<RawScore[]>(
    () => liveScoreSnapshot.scores,
  );
  const [showJudgements, setShowJudgements] = useState(true);
  const [showFaPlusSplit, setShowFaPlusSplit] = useState(true);
  const [readyById, setReadyById] = useState<Record<string, boolean>>(
    () => liveScoreSnapshot.readyById,
  );
  const [songTitle, setSongTitle] = useState(liveScoreSnapshot.songTitle);
  const [songDiffType, setSongDiffType] = useState<string | undefined>(
    liveScoreSnapshot.songDiffType,
  );
  const [songDiffLevel, setSongDiffLevel] = useState<number | undefined>(
    liveScoreSnapshot.songDiffLevel,
  );

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const scoreLeadRef = useRef(scoreLead);

  useEffect(() => {
    scoreLeadRef.current = scoreLead;
  }, [scoreLead]);

  const applyLiveScoreSnapshot = (snapshot: LiveScoreSnapshot) => {
    liveScoreSnapshot = snapshot;
    setScores(snapshot.scores);
    setReadyById(snapshot.readyById);
    setSongTitle(snapshot.songTitle);
    setSongDiffType(snapshot.songDiffType);
    setSongDiffLevel(snapshot.songDiffLevel);
  };

  useEffect(() => {
    const handleLiveScoreEvent: LiveScoreEventListener = (
      eventName,
      payload,
    ) => {
      if (eventName === "lobbyState") {
        const typedPayload = payload as LobbyStatePayload;
        const oldScores = typedPayload?.players;

        if (!oldScores?.length) {
          console.log("Skip", oldScores);
          return;
        }
        const songPath = typedPayload.songInfo?.songPath ?? "";
        const newScores: RawScore[] = oldScores.map((player) =>
          toRawScore(player, songPath, scoreLeadRef.current),
        );

        const nextReadyById = Object.fromEntries(
          oldScores.map((player) => [player.playerId, Boolean(player.ready)]),
        );
        const nextSongTitle = getSongTitle(typedPayload.songInfo);
        const nextSongDiffType = oldScores[0]?.diffType;
        const nextSongDiffLevel = oldScores[0]?.diffLevel;

        applyLiveScoreSnapshot({
          scores: newScores,
          readyById: nextReadyById,
          songTitle: nextSongTitle,
          songDiffType: nextSongDiffType,
          songDiffLevel: nextSongDiffLevel,
        });
        console.log("SetScores");
        return;
      }

      if (eventName === "sendScoreResult") {
        const typedPayload = payload as SendScoreResultPayload;
        const finalPlayer = typedPayload?.player;
        if (!finalPlayer) {
          return;
        }

        const songPath = typedPayload.songInfo?.songPath ?? "";
        const nextScore = toRawScore(finalPlayer, songPath, scoreLeadRef.current);
        const nextSongTitle = getSongTitle(typedPayload.songInfo);
        const nextSongDiffType = finalPlayer.diffType;
        const nextSongDiffLevel = finalPlayer.diffLevel;

        setScores((prev) => {
          const filtered = prev.filter(
            (item) => item.score.playerName !== nextScore.score.playerName,
          );
          const nextScores = [...filtered, nextScore];
          liveScoreSnapshot = {
            ...liveScoreSnapshot,
            scores: nextScores,
            songTitle: nextSongTitle,
            songDiffType: nextSongDiffType,
            songDiffLevel: nextSongDiffLevel,
          };
          return nextScores;
        });

        setSongTitle(nextSongTitle);
        setSongDiffType(nextSongDiffType);
        setSongDiffLevel(nextSongDiffLevel);
      }
    };

    liveScoreListeners.add(handleLiveScoreEvent);
    ensureLiveScoreConnection();

    axios.get("players").then((response) => {
      setPlayers(response.data);
    });

    axios.get("teams").then((response) => {
      setTeams(response.data);
    });

    return () => {
      liveScoreListeners.delete(handleLiveScoreEvent);
    };
  }, []);

  const getDisplayedScore = useCallback(
    (score: RawScore): string => {
      if (scoreLead === "FA_PLUS") {
        return score.score.faPlusPercentage ?? score.score.formattedScore;
      }
      return score.score.faPercentage ?? score.score.formattedScore;
    },
    [scoreLead],
  );

  const sortedScores = useMemo(() => {
    return [...scores].sort((a, b) => {
      const scoreA = +getDisplayedScore(a);
      const scoreB = +getDisplayedScore(b);
      const isDeadA = a.score.isFailed || a.score.life <= 0;
      const isDeadB = b.score.isFailed || b.score.life <= 0;

      if (isDeadA && !isDeadB) return 1;
      if (!isDeadA && isDeadB) return -1;
      return scoreB - scoreA;
    });
  }, [scores, getDisplayedScore]);

  const playersByIdentity = useMemo(() => {
    const map = new Map<string, Player>();
    for (const player of players) {
      const byName = normalizePlayerIdentity(player.name);
      const byPlayerName = normalizePlayerIdentity(player.playerName);
      if (byName && !map.has(byName)) map.set(byName, player);
      if (byPlayerName && !map.has(byPlayerName)) map.set(byPlayerName, player);
    }
    return map;
  }, [players]);

  const getPlayer = (playerName: string) =>
    playersByIdentity.get(normalizePlayerIdentity(playerName));

  const getTeamColor = (playerName: string) => {
    const player = getPlayer(playerName);

    console.log(player);

    if (!player) return "#000000";

    const teamId = player.teamId;

    if (teamId) {
      const team = teams.find((t) => t.id === teamId);

      if (team) {
        return TEAM_COLORS.find((t) => t.name === team.name)?.color;
      }
    }

    return "#000000";
  };

  if (scores.length === 0) return <></>;

  return (
    <div className="text-bianco w-auto">
      <div className="mb-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-300">Now playing:</p>
        <div className="mt-1">
          <h2 className="theme-text text-left text-lg sm:text-2xl font-bold leading-tight break-words flex flex-wrap items-center gap-2">
            {songTitle || sortedScores[0]?.score.song.split("/")[1]}
            {typeof songDiffLevel === "number" && (
              <span
                className="inline-flex shrink-0 items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-sm"
                style={{ backgroundColor: getDifficultyColor(songDiffType) }}
                title={normalizeDifficultyType(songDiffType) || "difficulty"}
              >
                {songDiffLevel}
              </span>
            )}
          </h2>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-200">
          {matchName && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2 py-0.5">
              Match: <span className="ml-1 font-semibold text-white">{matchName}</span>
            </span>
          )}
          {roundLabel && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2 py-0.5">
              Round: <span className="ml-1 font-semibold text-white">{roundLabel}</span>
            </span>
          )}
          {phaseName && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2 py-0.5">
              Phase: <span className="ml-1 font-semibold text-white">{phaseName}</span>
            </span>
          )}
          {divisionName && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2 py-0.5">
              Division: <span className="ml-1 font-semibold text-white">{divisionName}</span>
            </span>
          )}
        </div>
      </div>
      <div className="grid my-2 border-b pb-2  grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-1">
        {sortedScores.map((score, idx) => {
          const isDead = score.score.isFailed || score.score.life <= 0;
          return (
            <div
              key={score.score.playerName}
              style={{
                backgroundColor: isDead
                  ? "#5a2a2a"
                  : getTeamColor(score.score.playerName),
              }}
              className={`flex flex-col items-start p-2  rounded-md shadow-md transition-transform transform ${
                isDead ? "opacity-90" : ""
              } text-sfondoPagina ${idx === 0 ? "animate-first-place" : ""} `}
            >
              <div
                className={`flex flex-row gap-5 justify-between items-end w-full ${
                  isDead ? "text-gray-300" : "text-white"
                }`}
              >
              <span className="flex items-center gap-2 text-xl">
                <span className="italic">#{idx + 1}</span>{" "}
                <img
                  src={countryToFlagUrl(
                    getPlayer(score.score.playerName)?.country,
                    24,
                  )}
                  alt={`${score.score.playerName} flag`}
                  className="h-4 w-6 rounded-sm border border-white/20 object-cover"
                  loading="lazy"
                />
                <span className="font-bold flex items-center gap-1">
                  {score.score.playerName}
                  {readyById[score.score.id] && (
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-green-200 text-sm"
                      title="Ready"
                    />
                  )}
                </span>
              </span>

              <span
                className={`font-bold text-xl ${
                  scoreLead === "FA_PLUS" ? "text-sky-200" : ""
                }`}
              >
                {getDisplayedScore(score)}%
              </span>
              </div>
            {showJudgements && (
              <div className=" flex text-xs text-ellipsis flex-wrap gap-3  text-bianco">
                {showFaPlusSplit ? (
                  <>
                    {score.score.tapNote.W0 > 0 && (
                      <span className="text-blue-200">
                        {score.score.tapNote.W0}FA+
                      </span>
                    )}
                    {score.score.tapNote.W1 > 0 && (
                      <span>{score.score.tapNote.W1}FA</span>
                    )}
                  </>
                ) : (
                  score.score.tapNote.W0 + score.score.tapNote.W1 > 0 && (
                    <span className="text-blue-200">
                      {score.score.tapNote.W0 + score.score.tapNote.W1}FA
                    </span>
                  )
                )}
                {score.score.tapNote.W2 > 0 && (
                  <span className="text-yellow-300">
                    {score.score.tapNote.W2}EX
                  </span>
                )}
                {score.score.tapNote.W3 > 0 && (
                  <span className="text-green-300">
                    {score.score.tapNote.W3}GR
                  </span>
                )}
                {score.score.tapNote.W4 > 0 && (
                  <span className="text-pink-300">
                    {score.score.tapNote.W4}DE
                  </span>
                )}
                {score.score.tapNote.W5 > 0 && (
                  <span className="text-orange-300">
                    {score.score.tapNote.W5}WO
                  </span>
                )}
                {score.score.tapNote.miss > 0 && (
                  <span className="text-red-300">
                    {score.score.tapNote.miss}MISS
                  </span>
                )}
              </div>
            )}
            <div className="w-full flex flex-row items-center gap-3">
              <FontAwesomeIcon icon={faHeart} className="text-white" />
              <div className="relative w-full h-2 my-2 rounded-md bg-grigio overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full transition-all ${
                    score.score.life >= 99
                      ? "bg-green-500"
                      : score.score.life < 20
                        ? "bg-red-500"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${score.score.life}%` }}
                ></div>
              </div>
            </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-end">
        <button
          onClick={() => setShowJudgements((prev) => !prev)}
          className="text-bianco bg-lighter px-2 py-0.5 text-xs rounded-md"
        >
          {showJudgements ? "Hide" : "Show"} judgements
        </button>
        <button
          onClick={() => setShowFaPlusSplit((prev) => !prev)}
          className="text-bianco bg-lighter px-2 py-0.5 text-xs rounded-md"
          title="Toggle Fantastic split"
        >
          {showFaPlusSplit ? "FA+" : "FA"}
        </button>
      </div>
    </div>
  );
}
