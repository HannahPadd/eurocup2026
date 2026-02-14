import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { Division } from "../models/Division";
import { countryToFlagUrl } from "../utils/flags";
import QualifierList, {
  QualifierListItem,
} from "../components/qualifiers/QualifierList";
import { formatPercentageDisplay, parsePercentage } from "../utils/formatting";

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
  country?: string;
};

const UNKNOWN_COUNTRY_LABEL = "Unknown";

export default function LandingPage() {
  const { auth } = useAuth();
  const playerName = auth?.username || "Player";
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    null,
  );
  const [qualifiers, setQualifiers] = useState<QualifierDivision[]>([]);
  const [qualifierInputs, setQualifierInputs] = useState<
    Record<number, { percentage: string; screenshotUrl: string }>
  >({});
  const [qualifierLoading, setQualifierLoading] = useState(false);
  const [qualifierSaving, setQualifierSaving] = useState(false);
  const [qualifierError, setQualifierError] = useState<string | null>(null);
  const [qualifierSaved, setQualifierSaved] = useState(false);
  const [qualifierFlashKey, setQualifierFlashKey] = useState(0);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionIds, setSelectedDivisionIds] = useState<number[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [registrationLocked, setRegistrationLocked] = useState(false);
  const [countrySaving, setCountrySaving] = useState(false);

  useEffect(() => {
    const loadPlayer = async () => {
      if (!auth?.username) {
        setPlayerId(null);
        setPlayerProfile(null);
        return;
      }
      try {
        const response = await axios.get("players");
        const players = response.data as {
          id: number;
          playerName: string;
          country?: string;
        }[];
        const player = players.find((item) => item.playerName === auth.username);
        if (!player) {
          setQualifierError("Player profile not found for this account.");
          setPlayerId(null);
          setPlayerProfile(null);
          return;
        }
        setPlayerId(player.id);
        setPlayerProfile({
          id: player.id,
          playerName: player.playerName,
          country: player.country,
        });
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
        setPlayerProfile((prev) => (prev ? { ...prev, divisions: [] } : prev));
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
        setPlayerProfile(response.data ?? null);
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
            percentage: submission
              ? formatPercentageDisplay(submission.percentage)
              : "",
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

  const qualifierItems = useMemo<QualifierListItem[]>(
    () =>
      qualifierSongs.map(({ division, phase, song }) => ({
        key: `${division.divisionId}-${phase.phaseId}-${song.song.id}`,
        divisionName: division.divisionName,
        songId: song.song.id,
        songTitle: song.song.title,
        difficulty: song.song.difficulty,
      })),
    [qualifierSongs],
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
    setQualifierSaved(false);
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
          setQualifierError(
            "Qualifier scores must be numbers between 0.00 and 100.",
          );
          setQualifierSaving(false);
          return;
        }
        if (percentage < 0 || percentage > 100) {
          setQualifierError(
            "Qualifier scores must be between 0.00 and 100.",
          );
          setQualifierSaving(false);
          return;
        }
        const normalized =
          percentage >= 100
            ? 100
            : Number((Math.round(percentage * 100) / 100).toFixed(2));
        submissions.push({
          songId: song.song.id,
          percentage: normalized,
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
      setQualifierSaved(true);
      setQualifierFlashKey((prev) => prev + 1);
      window.setTimeout(() => setQualifierSaved(false), 3500);
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

  const updateCountry = async () => {
    if (!playerId) {
      setRegistrationError("Player profile is required to update country.");
      return;
    }
    const current = playerProfile?.country?.trim() || "";
    const next = prompt("Enter your country", current);
    if (next === null) {
      return;
    }
    const trimmed = next.trim();
    if (!trimmed) {
      setRegistrationError("Country cannot be empty.");
      return;
    }
    setCountrySaving(true);
    setRegistrationError(null);
    try {
      const response = await axios.patch<PlayerProfile>(`players/${playerId}`, {
        country: trimmed,
      });
      setPlayerProfile((prev) => ({
        ...(prev ?? { id: playerId }),
        ...response.data,
      }));
    } catch (error) {
      console.error("Error updating country:", error);
      setRegistrationError("Unable to update country.");
    } finally {
      setCountrySaving(false);
    }
  };

  const selectedDivisions = divisions.filter((division) =>
    selectedDivisionIds.includes(division.id)
  );

  const countryLabel = playerProfile?.country?.trim() || UNKNOWN_COUNTRY_LABEL;
  const countryFlag = countryToFlagUrl(playerProfile?.country, 40);

  return (
    <div className="text-white mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl sm:text-5xl font-bold theme-text">
          Welcome {playerName}
        </h1>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
          <img
            src={countryFlag}
            alt={`${countryLabel} flag`}
            className="h-4 w-6 rounded-sm border border-white/20 object-cover"
            loading="lazy"
          />
          <span className="font-semibold text-white">{countryLabel}</span>
          <button
            type="button"
            onClick={updateCountry}
            disabled={countrySaving}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            {countrySaving ? "Saving..." : "edit"}
          </button>
        </div>
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
            <QualifierList
              items={qualifierItems}
              inputs={qualifierInputs}
              onChange={updateQualifierInput}
              onBlurPercentage={(songId, value) => {
                const parsed = parsePercentage(value);
                updateQualifierInput(
                  songId,
                  "percentage",
                  parsed === null ? "" : formatPercentageDisplay(parsed),
                );
              }}
              flash={qualifierSaved}
              flashKey={qualifierFlashKey}
            />
          </div>
          {qualifierError && (
            <p className="mt-3 text-sm text-red-200">{qualifierError}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {qualifierSaved ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Qualifiers saved
              </span>
            ) : null}
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
