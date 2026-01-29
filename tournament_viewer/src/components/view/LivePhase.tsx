import { useEffect, useState, useCallback } from "react";
import { Match } from "../../models/Match";
import * as MatchesApi from "../../services/matches/matches.api";
import { Division } from "../../models/Division";
import { Phase } from "../../models/Phase";
import axios from "axios";
import MatchesView from "../manage/tournament/MatchesView";
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
} from "@microsoft/signalr";
import LiveScores from "./LiveScores";

export default function LivePhase() {
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    MatchesApi.getActiveMatch()
      .then((match) => {
        setActiveMatch(match);
        return axios.get("/phases/" + match.phaseId);
      })
      .then((response) => {
        setPhase(response.data);
        return axios.get("/divisions/" + response.data.divisionId);
      })
      .then((response) => {
        setDivision(response.data);
      })
      .catch(() => {
        setActiveMatch(null);
        setPhase(null);
        setDivision(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();

    const conn = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_PUBLIC_API_URL}../matchupdatehub`, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .build();

    conn.on("OnMatchUpdate", fetchData);

    conn
      .start()
      .then(() => {
        console.log("Now listening to match changes.");
      })
      .catch((error) => console.error("Connection failed: ", error));

    setConnection(conn);

    return () => {
      if (connection) {
        conn.stop();
      }
    };
  }, [fetchData]);

  return (
    <div>
      {import.meta.env.VITE_PUBLIC_ENABLE_LIVE_SCORES === "true" && (
        <LiveScores />
      )}
      {loading && <p>Loading...</p>}
      {!loading && !activeMatch && <p>No match in progress. Stay tuned!</p>}
      {division && phase && activeMatch && (
        <div>
          <h1 className="text-center text-7xl theme-text font-bold">
            {division.name}
          </h1>

          <MatchesView
            showPastMatches={false}
            phaseId={phase.id}
            division={division}
          />
        </div>
      )}
    </div>
  );
}
