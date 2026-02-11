import { Link } from "react-router-dom";
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

        <section className="bg-black/20 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-semibold theme-text">
            Register for tournament
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <input id="use-ticket" type="checkbox" className="h-4 w-4" />
            <label htmlFor="use-ticket" className="text-gray-200">
              Use my ticket registration
            </label>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registrationTracks.map((track) => (
              <label
                key={track}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              >
                <input type="checkbox" className="h-4 w-4" />
                <span>{track}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-300 mt-4">
            Registration after submit can only be edited on request.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition"
            >
              Submit
            </button>
          </div>
        </section>
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
