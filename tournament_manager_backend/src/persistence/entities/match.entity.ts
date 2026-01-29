import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany, 
  ManyToMany, 
  JoinTable, 
  JoinColumn } from 'typeorm';

import { Round } from './round.entity'
import { Phase } from './phase.entity'
import { Player } from './player.entity'
import { Bracket } from './bracket.entity';


@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ nullable: true })
  notes: string;

  @Column()
  multiplier: number;

  @Column()
  isManualMatch: boolean;

  @Column()
  scoringSystem: string;

  @ManyToMany(() => Player, (player) => player.matches, { eager: true})
  @JoinTable()
  players: Player[];

  @OneToMany(() => Round, (round) => round.match, { eager: true, cascade: true  })
  rounds: Round[];

  @ManyToOne(() => Phase, (phase) => phase.matches, { onDelete: 'CASCADE' })
  @JoinColumn()
  phase: Promise<Phase>;

  @ManyToOne(() => Bracket, (bracket) => bracket.match)
  bracket: Bracket
}