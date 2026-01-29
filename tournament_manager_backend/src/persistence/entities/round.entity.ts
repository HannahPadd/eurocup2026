import { 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany, 
  JoinColumn } from 'typeorm';

import { Match } from './match.entity'
import { Standing } from './standing.entity'
import { Song } from './song.entity'
import { MatchAssignment } from './match_assignment.entity';
import { Bracket } from './bracket.entity';


@Entity()
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Standing, (standing) => standing.round, { eager: true, cascade: true })
  standings: Standing[]

  disabledPlayerIds: number[];

  @ManyToOne(() => Match, (match) => match.rounds, { onDelete: 'CASCADE' })
  match: Match;

  @ManyToOne(() => Song, (song) => song.rounds, { onDelete: 'CASCADE', eager: true })
  song: Song;

  @OneToMany(() => MatchAssignment, (matchAssignment) => matchAssignment.round, { eager: true })
  matchAssignments: MatchAssignment[];

  @ManyToOne(() => Bracket, (bracket) => bracket.round)
  @JoinColumn()
  bracket: Bracket
}
