import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { Division } from "../models/Division";

const qualifierBarCount = 15;
const qualifierBarColor = (index: number) => {
  const ratio = (index + 1) / qualifierBarCount;
  if (ratio <= 0.4) return "bg-green-500";
  if (ratio <= 0.75) return "bg-orange-400";
  return "bg-red-500";
};

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

type PlayerProfile = {
  id: number;
  playerName?: string;
  divisions?: Division[];
  hasRegistered?: boolean;
};

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
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionIds, setSelectedDivisionIds] = useState<number[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [registrationLocked, setRegistrationLocked] = useState(false);

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

  useEffect(() => {
    const loadDivisions = async () => {
      try {
        const response = await axios.get<Division[]>("divisions");
        setDivisions(response.data ?? []);
      } catch (error) {
        console.error("Error loading divisions:", error);
        setRegistrationError("Unable to load registration divisions.");
      }
    };

    loadDivisions();
  }, []);

  useEffect(() => {
    const loadRegistration = async () => {
      if (!playerId) {
        setSelectedDivisionIds([]);
        return;
      }
      setRegistrationLoading(true);
      setRegistrationError(null);
      try {
        const response = await axios.get<PlayerProfile>(`players/${playerId}`);
        const existing = response.data?.divisions ?? [];
        const registered =
          response.data?.hasRegistered ?? existing.length > 0;
        setSelectedDivisionIds(existing.map((division) => division.id));
        setRegistrationLocked(registered);
      } catch (error) {
        console.error("Error loading registration:", error);
        setRegistrationError("Unable to load registration status.");
      } finally {
        setRegistrationLoading(false);
      }
    };

    loadRegistration();
  }, [playerId]);

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

  const toggleDivisionSelection = (divisionId: number) => {
    setSelectedDivisionIds((prev) =>
      prev.includes(divisionId)
        ? prev.filter((id) => id !== divisionId)
        : [...prev, divisionId]
    );
  };

  const saveRegistration = async () => {
    if (!playerId) {
      setRegistrationError("Player profile is required to register.");
      return;
    }
    setRegistrationSaving(true);
    setRegistrationError(null);
    try {
      const registered = selectedDivisionIds.length > 0;
      await axios.patch(`players/${playerId}`, {
        divisionId: selectedDivisionIds,
        hasRegistered: registered,
      });
      setRegistrationLocked(registered);
    } catch (error) {
      console.error("Error saving registration:", error);
      setRegistrationError("Unable to save registration.");
    } finally {
      setRegistrationSaving(false);
    }
  };

  const requestRegistrationChange = async () => {
    if (!playerId) {
      setRegistrationError("Player profile is required to update registration.");
      return;
    }
    setRegistrationSaving(true);
    setRegistrationError(null);
    try {
      await axios.patch(`players/${playerId}`, {
        divisionId: [],
        hasRegistered: false,
      });
      setSelectedDivisionIds([]);
      setRegistrationLocked(false);
    } catch (error) {
      console.error("Error resetting registration:", error);
      setRegistrationError("Unable to reset registration.");
    } finally {
      setRegistrationSaving(false);
    }
  };

  const selectedDivisions = divisions.filter((division) =>
    selectedDivisionIds.includes(division.id)
  );

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
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-300">
                      <span>{division.divisionName}</span>
                      <span className="text-gray-400">
                        {song.song.difficulty}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: qualifierBarCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className={`${
                                i + 1 <= song.song.difficulty
                                  ? qualifierBarColor(i)
                                  : "bg-gray-600"
                              } h-[0.6rem] w-1.5 mt-[0.1rem] rounded-sm`}
                            ></span>
                          ),
                        )}
                      </div>
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
              Qualifier status
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              See how your submitted qualifiers place you right now.
            </p>
            {registrationLocked && selectedDivisions.length > 0 ? (
              <div className="mt-5 space-y-3">
              {selectedDivisions.map((division) => (
                <div
                  key={division.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
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
                  <span className="flex-1">
                    Signed up for {division.name}
                  </span>
                  <button
                    type="button"
                    className="rounded-md border border-white/30 px-3 py-1 text-xs font-semibold text-white/90 hover:border-white/60 hover:text-white"
                  >
                    See rules
                  </button>
                </div>
              ))}
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

          <section className="bg-black/20 border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-semibold theme-text">
              Register for tournament
            </h2>
          {!registrationLocked && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {registrationLoading && (
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
                  Loading divisions...
                </div>
              )}
              {!registrationLoading && divisions.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
                  No divisions available yet.
                </div>
              )}
              {divisions.map((division) => (
                <label
                  key={division.id}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition text-white"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    disabled={registrationLoading}
                    checked={selectedDivisionIds.includes(division.id)}
                    onChange={() => toggleDivisionSelection(division.id)}
                  />
                  <span>{division.name}</span>
                </label>
              ))}
            </div>
          )}
          {registrationError && (
            <p className="mt-3 text-sm text-red-200">{registrationError}</p>
          )}
          {registrationLocked ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                role="alert"
              >
                You are registered.
              </p>
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition disabled:cursor-not-allowed disabled:opacity-70"
                onClick={requestRegistrationChange}
                disabled={
                  registrationSaving ||
                  registrationLoading
                }
              >
                {registrationSaving ? "Updating..." : "Request register change"}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className="rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                role="alert"
              >
                Registration after submit can only be edited on request.
              </p>
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition disabled:cursor-not-allowed disabled:opacity-70"
                onClick={saveRegistration}
                disabled={
                  registrationSaving || registrationLoading
                }
              >
                {registrationSaving ? "Submitting..." : "Submit"}
              </button>
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
