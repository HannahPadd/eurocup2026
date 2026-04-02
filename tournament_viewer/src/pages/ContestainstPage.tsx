import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { countryToFlagUrl } from "../utils/flags";

type RegistrationRow = Record<string, unknown> & {
  "Registartion date"?: string;
  "Registration date"?: string;
  "Gamer tag"?: string;
  Country?: string;
  "Attending as"?: string;
  Anonymous?: string;
  "ITG Precision"?: string;
  "ITG Stamina"?: string;
  "ITG Variety-Fun"?: string;
  "ITG Doubles"?: string;
  "Pump It Up"?: string;
  StepManiaX?: string;
};

export default function ContestainstPage() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<RegistrationRow[]>("user/registrations");
        const data = response.data;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load registrations:", err);
        setError("Unable to load registrations JSON.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const competitors = useMemo(() => {
    return rows
      .filter((row) => row["Gamer tag"]?.trim())
      .filter((row) => (row["Attending as"] ?? "").trim() === "Competitor")
      .filter((row) => (row.Anonymous ?? "").trim() !== "Yes")
      .sort((a, b) => {
        const countryA = (a.Country ?? "").trim().toLowerCase();
        const countryB = (b.Country ?? "").trim().toLowerCase();
        const aUnspecified = !countryA || countryA === "unspecified";
        const bUnspecified = !countryB || countryB === "unspecified";
        if (aUnspecified !== bUnspecified) {
          return aUnspecified ? 1 : -1;
        }
        const countryCompare = countryA.localeCompare(countryB);
        if (countryCompare !== 0) {
          return countryCompare;
        }
        return (a["Gamer tag"] ?? "").localeCompare(b["Gamer tag"] ?? "");
      });
  }, [rows]);

  return (
    <div className="mx-auto mt-6 w-full max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <h1 className="text-center text-3xl font-semibold theme-text">Eurocup Registrations</h1>
      <p className="mt-2 text-center text-sm text-gray-300">
        {loading
          ? "Loading registrations..."
          : error
            ? error
            : `${competitors.length} competitors`}
      </p>

      {!loading && !error && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {competitors.map((row, index) => {
            const gamerTag = row["Gamer tag"] ?? "Unknown";
            const country = row.Country?.trim() || "Unspecified";
            return (
              <article
                key={`${gamerTag}-${row["Registartion date"] ?? row["Registration date"] ?? index}`}
                className="rounded-xl border border-gray-200 bg-white p-4 text-center text-gray-900"
              >
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={countryToFlagUrl(country, 40)}
                    alt={`${country} flag`}
                    className="h-8 w-12 rounded object-cover"
                  />
                  <p className="text-lg font-bold leading-tight">{gamerTag}</p>
                  <p className="text-xs text-gray-500">{country}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
