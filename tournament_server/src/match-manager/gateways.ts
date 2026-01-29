import { GameGateway } from "./gateways/game.gateway";
import { LiveScoreGateway } from "./gateways/live.score.gateway";
import { LogGateway } from "./gateways/log.gateway";
import { MatchGateway } from "./gateways/match.gateway";

export { GameGateway }
export { LiveScoreGateway }
export { LogGateway }
export { MatchGateway }

export const Gateways = [
    GameGateway,
    LiveScoreGateway,
    LogGateway,
    MatchGateway
];