import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

type QualifierSubmission = {
  percentage: number;
  screenshotUrl: string;
  updatedAt: string;
};

type QualifierSong = {
  song: {
    id: number;
    title: string;
    group: string;
    difficulty: number;
  };
  submission?: QualifierSubmission;
};

type QualifierPhase = {
  phaseId: number;
  phaseName: string;
  songs: QualifierSong[];
};

type QualifierDivision = {
  divisionId: number;
  divisionName: string;
  phases: QualifierPhase[];
};

const registrationTracks = [
  "Tech competition",
  "Stamina",
  "Doubles",
  "Variety",
  "Pump it Up",
  "StepmaniaX",
];

export default function LandingPage() {
  const { auth } = useAuth();
  const playerName = auth?.username || "Player";
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [qualifiers, setQualifiers] = useState<QualifierDivision[]>([]);
  const [qualifierInputs, setQualifierInputs] = useState<
    Record<number, { percentage: string; screenshotUrl: string }>
  >({});
  const [qualifierLoading, setQualifierLoading] = useState(false);
  const [qualifierSaving, setQualifierSaving] = useState(false);
  const [qualifierError, setQualifierError] = useState<string | null>(null);
  const [useTicketRegistration, setUseTicketRegistration] = useState(false);
  const [mockRegistered, setMockRegistered] = useState(false);

  useEffect(() => {
    const loadPlayer = async () => {
      if (!auth?.username) {
        setPlayerId(null);
        return;
      }
      try {
        const response = await axios.get("players");
        const players = response.data as { id: number; playerName: string }[];
        const player = players.find((item) => item.playerName === auth.username);
        if (!player) {
          setQualifierError("Player profile not found for this account.");
          setPlayerId(null);
          return;
        }
        setPlayerId(player.id);
      } catch (error) {
        console.error("Error loading player profile:", error);
        setQualifierError("Unable to load player profile.");
      }
    };

    loadPlayer();
  }, [auth?.username]);

  const applyQualifierData = (data: QualifierDivision[]) => {
    setQualifiers(data);
    const nextInputs: Record<
      number,
      { percentage: string; screenshotUrl: string }
    > = {};
    for (const division of data) {
      for (const phase of division.phases) {
        for (const { song, submission } of phase.songs) {
          nextInputs[song.id] = {
            percentage: submission ? String(submission.percentage) : "",
            screenshotUrl: submission?.screenshotUrl ?? "",
          };
        }
      }
    }
    setQualifierInputs(nextInputs);
  };

  useEffect(() => {
    const loadQualifiers = async () => {
      if (!playerId) {
        setQualifiers([]);
        setQualifierInputs({});
        return;
      }
      setQualifierLoading(true);
      setQualifierError(null);
      try {
        const response = await axios.get<QualifierDivision[]>("qualifiers", {
          params: { playerId },
        });
        applyQualifierData(response.data ?? []);
      } catch (error) {
        console.error("Error loading qualifiers:", error);
        setQualifierError("Unable to load qualifiers.");
      } finally {
        setQualifierLoading(false);
      }
    };

    loadQualifiers();
  }, [playerId]);

  const qualifierSongs = useMemo(
    () =>
      qualifiers.flatMap((division) =>
        division.phases.flatMap((phase) =>
          phase.songs.map((song) => ({
            division,
            phase,
            song,
          }))
        )
      ),
    [qualifiers]
  );

  const updateQualifierInput = (
    songId: number,
    field: "percentage" | "screenshotUrl",
    value: string
  ) => {
    setQualifierInputs((prev) => ({
      ...prev,
      [songId]: {
        percentage: prev[songId]?.percentage ?? "",
        screenshotUrl: prev[songId]?.screenshotUrl ?? "",
        [field]: value,
      },
    }));
  };

  const saveQualifiers = async () => {
    if (!playerId) {
      setQualifierError("Player profile is required to submit qualifiers.");
      return;
    }
    setQualifierSaving(true);
    setQualifierError(null);
    try {
      const submissions: {
        songId: number;
        percentage: number;
        screenshotUrl: string;
      }[] = [];
      for (const { song } of qualifierSongs) {
        const entry = qualifierInputs[song.song.id];
        if (!entry?.percentage || !entry?.screenshotUrl) {
          continue;
        }
        const percentage = Number(entry.percentage);
        if (Number.isNaN(percentage)) {
          setQualifierError("Qualifier scores must be numbers.");
          setQualifierSaving(false);
          return;
        }
        submissions.push({
          songId: song.song.id,
          percentage,
          screenshotUrl: entry.screenshotUrl,
        });
      }

      await Promise.all(
        submissions.map((submission) =>
          axios.post(
            `qualifier/${playerId}/${submission.songId}`,
            {
              percentage: submission.percentage,
              screenshotUrl: submission.screenshotUrl,
            }
          )
        )
      );

      const refreshed = await axios.get<QualifierDivision[]>("qualifiers", {
        params: { playerId },
      });
      applyQualifierData(refreshed.data ?? []);
    } catch (error) {
      console.error("Error saving qualifiers:", error);
      setQualifierError("Unable to save qualifiers.");
    } finally {
      setQualifierSaving(false);
    }
  };

  return (
    <div className="text-white mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl sm:text-5xl font-bold theme-text">
          Welcome {playerName}
        </h1>
        <p className="text-gray-200">
          Lock in your qualifiers and tournament registration in one place.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-black/20 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-semibold theme-text">
            Send in qualifiers
          </h2>
          <p className="text-gray-300 mt-2">
            Submit a score (e.g. 77.77) and the URL of your screenshot.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4">
            {qualifierLoading && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                Loading qualifier songs...
              </div>
            )}
            {!qualifierLoading && qualifierSongs.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                No qualifier songs configured yet.
              </div>
            )}
            {qualifierSongs.map(({ division, phase, song }) => {
              const input = qualifierInputs[song.song.id] || {
                percentage: "",
                screenshotUrl: "",
              };
              return (
                <div
                  key={`${division.divisionId}-${phase.phaseId}-${song.song.id}`}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div>
                    <div className="font-semibold">{song.song.title}</div>
                    <div className="text-xs text-gray-300">
                      {division.divisionName} • {phase.phaseName} •{" "}
                      {song.song.group} {song.song.difficulty}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Score (77.77)"
                    className="w-full rounded-md bg-white text-black px-3 py-2"
                    value={input.percentage}
                    onChange={(event) =>
                      updateQualifierInput(
                        song.song.id,
                        "percentage",
                        event.target.value
                      )
                    }
                  />
                  <input
                    type="url"
                    placeholder="Screenshot URL"
                    className="w-full rounded-md bg-white text-black px-3 py-2"
                    value={input.screenshotUrl}
                    onChange={(event) =>
                      updateQualifierInput(
                        song.song.id,
                        "screenshotUrl",
                        event.target.value
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
          {qualifierError && (
            <p className="mt-3 text-sm text-red-200">{qualifierError}</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition disabled:cursor-not-allowed disabled:opacity-70"
              onClick={saveQualifiers}
              disabled={qualifierSaving || qualifierLoading}
            >
              {qualifierSaving ? "Saving..." : "Save qualifiers"}
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-black/20 border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-semibold theme-text">
              Register for tournament
            </h2>
          <div className="mt-4 flex items-center gap-2">
            <input
              id="use-ticket"
              type="checkbox"
              className="h-4 w-4"
              checked={useTicketRegistration}
              onChange={(event) =>
                setUseTicketRegistration(event.target.checked)
              }
            />
            <label htmlFor="use-ticket" className="text-gray-200">
              Use my ticket registration
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="mock-registered"
              type="checkbox"
              className="h-4 w-4"
              checked={mockRegistered}
              onChange={(event) => setMockRegistered(event.target.checked)}
            />
            <label htmlFor="mock-registered" className="text-gray-200">
              Mock player has registered
            </label>
          </div>
          {mockRegistered ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition"
              >
                Request changing registration
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {registrationTracks.map((track) => (
                  <label
                    key={track}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
                      useTicketRegistration
                        ? "cursor-not-allowed border-white/5 bg-white/5 text-gray-500"
                        : "border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      disabled={useTicketRegistration}
                    />
                    <span>{track}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className="rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                  role="alert"
                >
                  Registration after submit can only be edited on request.
                </p>
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition"
                >
                  Submit
                </button>
              </div>
            </>
          )}
          </section>

          <section className="bg-black/20 border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-semibold theme-text">
              Qualifier status
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              See how your submitted qualifiers place you right now.
            </p>
            {mockRegistered ? (
              <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-200">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </span>
                <span className="flex-1">Qualified for Tech middle</span>
                <button
                  type="button"
                  className="rounded-md border border-white/30 px-3 py-1 text-xs font-semibold text-white/90 hover:border-white/60 hover:text-white"
                >
                  See rules
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                  <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="flex-1">Signed up for Stamina</span>
                  <button
                    type="button"
                    className="rounded-md border border-white/30 px-3 py-1 text-xs font-semibold text-white/90 hover:border-white/60 hover:text-white"
                  >
                    See rules
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="flex-1">Signed up for Pump it up</span>
                  <button
                    type="button"
                    className="rounded-md border border-white/30 px-3 py-1 text-xs font-semibold text-white/90 hover:border-white/60 hover:text-white"
                  >
                    See rules
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="mt-5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                role="alert"
              >
                You have to register first.
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-6">
        <div>
          <h3 className="text-xl font-semibold theme-text">See tournament</h3>
          <p className="text-gray-300 mt-1">
            Check live standings and matches.
          </p>
        </div>
        <Link
          to="/tournament"
          className="bg-white text-black px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition"
        >
          Go to tournament
        </Link>
      </section>
    </div>
  );
}
