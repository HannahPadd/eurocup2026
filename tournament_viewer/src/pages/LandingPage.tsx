import { Link } from "react-router-dom";
import { useState } from "react";
import useAuth from "../hooks/useAuth";

const qualifierTracks = [
  "Tech Lower",
  "Tech Middle",
  "Tech High",
  "Stamina",
];

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
  const [useTicketRegistration, setUseTicketRegistration] = useState(false);
  const [mockRegistered, setMockRegistered] = useState(false);

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
            {qualifierTracks.map((track) => (
              <div
                key={track}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="font-semibold">{track}</div>
                <input
                  type="text"
                  placeholder="Score (77.77)"
                  className="w-full rounded-md bg-white text-black px-3 py-2"
                />
                <input
                  type="url"
                  placeholder="Screenshot URL"
                  className="w-full rounded-md bg-white text-black px-3 py-2"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition"
            >
              Save qualifiers
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
