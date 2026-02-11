import { DivisionsService } from './services/divisions.service';
import { MatchesService } from './services/match.service';
import { PhasesService } from './services/phases.service';
import { PlayerService } from './services/players.service';
import { RoundsService } from './services/rounds.service';
import { TeamsService } from './services/teams.service';
import { TournamentsService } from './services/tournaments.service';
import { ScoresService } from './services/scores.service';
import { SongService } from './services/songs.service';
import { StandingsService } from './services/standing.service';
import { SetupService } from './services/setup.service';
import { MatchAssignmentService } from './services/match_assignment.service';
import { StreamViewService } from './services/streamview.service';
import { UserService } from '../user/services/user.service';
import { QualifiersService } from './services/qualifiers.service';

export { DivisionsService }
export { MatchesService }
export { PhasesService }
export { PlayerService }
export { RoundsService }
export { TeamsService }
export { TournamentsService }
export { ScoresService }
export { SongService }
export { StandingsService }
export { SetupService }
export { MatchAssignmentService }
export { StreamViewService }
export { UserService as AccountService }
export { QualifiersService }

export const Services = [
    DivisionsService,
    MatchesService,
    PhasesService,
    PlayerService,
    RoundsService,
    ScoresService,
    SongService,
    StandingsService,
    TeamsService,
    TournamentsService,
    SetupService,
    MatchAssignmentService,
    StreamViewService,
    UserService,
    QualifiersService,
  ]
