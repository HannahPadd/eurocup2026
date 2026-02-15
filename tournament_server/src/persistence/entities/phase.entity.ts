import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne,
  JoinColumn,
  OneToMany } from 'typeorm';

import { Match } from './match.entity'
import { Division } from './division.entity'
import { Ruleset } from './ruleset.entity';


@Entity()
export class Phase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Match, (match) => match.phase, { eager: true, cascade: true })
  matches: Match[];

  @ManyToOne(() => Division, (division) => division.phases, { onDelete: 'CASCADE' })
  division: Promise<Division>;

  @ManyToOne(() => Ruleset, (ruleset) => ruleset.phases, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  ruleset: Ruleset;
}
