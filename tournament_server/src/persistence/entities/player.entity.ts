import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany, 
  ManyToMany, 
  JoinColumn, 
  JoinTable} from 'typeorm';

import { Score } from './score.entity'
import { Team } from './team.entity'
import { Match } from './match.entity';
import { MatchAssignment } from './match_assignment.entity';
import { Bracket } from './bracket.entity';
import { Division } from './division.entity';


@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: "" })
  playerPictureUrl: string;

  @Column()
  playerName: string;

  @Column({ default: "" })
  playedFor: string;

  @Column({ default: "No country specified"} )
  country: string;

  @Column({ default: -1 })
  highestStaminaPass: number;

  @Column({ default: -1 })
  statminaLevel: number;

  @Column({ default : -1 })
  footSpeedLevel: number;

  @Column({ default: -1 })
  crossOverTechLevel: number;

  @Column({ default: -1 })
  footSwitchTechLevel: number;

  @Column({ default: -1 })
  sideSwitchTechLevel: number;

  @Column({ default: -1 })
  bracketTechLevel: number;

  @Column({ default: -1 })
  doubleStepTechLevel: number;

  @Column({ default: -1 })
  jackTechLevel: number;

  @Column({ default: -1})
  xmodTechLevel: number;

  @Column({ default: -1})
  burstTechLevel: number;

  @Column({ default: -1 })
  rhythmsTechLevel: number;

  @Column({ default: ""})
  groovestatsApi: string;

  @OneToMany(() => Score, (score) => score.player, { cascade: true })
  scores: Score[];

  @ManyToOne(() => Team, (team) => team.players, { orphanedRowAction: "nullify" })
  @JoinColumn()
  team: Team;

  @ManyToMany(() => Match, (match) => match.players)
  matches: Match[];

  @OneToMany(() => MatchAssignment, (matchAssignment) => matchAssignment.player, { eager: true })
  matchAssignments: MatchAssignment[];

  @ManyToMany(() => Division)
  @JoinTable()
  divisions: Division[]

  @ManyToOne(() => Bracket, (bracket) => bracket.player)
  @JoinColumn()
  bracket: Bracket;
}

