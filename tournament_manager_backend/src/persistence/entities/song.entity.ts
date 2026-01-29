import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  OneToMany } from 'typeorm';

import { Score } from './score.entity'
import { Round } from './round.entity'


@Entity()
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  group: string;

  @Column()
  difficulty: number;

  @OneToMany(() => Score, (score) => score.song, { cascade: true })
  scores: Score[]

  @OneToMany(() => Round, (round) => round.song, { cascade: true })
  rounds: Round[]
}

