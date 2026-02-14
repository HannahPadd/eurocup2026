import { useEffect, useState } from "react";
import axios from "axios";
import { countryToFlagUrl } from "../../utils/flags";

type QualifierRankingEntry = {
  playerId: number;
  playerName: string;
  playerCountry?: string;
  averagePercentage: number;
  submittedCount: number;
};

type QualifierDivisionRanking = {
  divisionId: number;
  divisionName: string;
  totalSongs: number;
  rankings: QualifierRankingEntry[];
};

export default function QualifierRankings() {
  const [divisions, setDivisions] = useState<QualifierDivisionRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visibleDivisions = divisions.filter((division) => division.totalSongs > 0);

  useEffect(() => {
    let isMounted = true;

    const loadRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<QualifierDivisionRanking[]>(
          "qualifiers/rankings",
        );
        if (isMounted) {
          setDivisions(response.data ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load qualifier rankings.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRankings();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
        Loading qualifier rankings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (visibleDivisions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
        No qualifier divisions available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleDivisions.map((division) => (
        <section
          key={division.divisionId}
          className="rounded-lg border border-white/10 bg-white/5 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold theme-text">
              {division.divisionName}
            </h3>
            <span className="text-xs text-gray-300">
              {division.totalSongs} qualifier songs
            </span>
          </div>
          {division.rankings.length === 0 ? (
            <p className="mt-3 text-sm text-gray-300">
              No qualifier submissions yet.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {division.rankings.map((entry, index) => (
                <div
                  key={`${division.divisionId}-${entry.playerId}`}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <span className="w-8 text-gray-400">#{index + 1}</span>
                  <span className="flex flex-1 items-center gap-2 font-semibold text-gray-100">
                    <img
                      src={countryToFlagUrl(entry.playerCountry, 24)}
                      alt={`${entry.playerName} flag`}
                      className="h-4 w-6 rounded-sm border border-white/20 object-cover"
                      loading="lazy"
                    />
                    {entry.playerName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {entry.submittedCount}/{division.totalSongs} songs
                  </span>
                  <span className="text-base font-semibold text-gray-100">
                    {entry.averagePercentage.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
