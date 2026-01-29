import { MatchManager } from "./services/match.manager";
import { PadRoller } from "./services/pad.roller";
import { SongRoller } from "./services/song.roller";
import { StandingManager } from "./services/standing.manager";
import { TournamentCache } from "./services/tournament.cache";
import { ScoringSystemProvider } from "./services/IScoringSystem";

export { MatchManager };
export { PadRoller };
export { SongRoller };
export { StandingManager};
export { TournamentCache };
export { ScoringSystemProvider };

export const Services = [
    MatchManager,
    PadRoller,
    SongRoller,
    StandingManager,
    TournamentCache,
    ScoringSystemProvider
];
