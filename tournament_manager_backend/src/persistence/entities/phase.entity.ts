import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany } from 'typeorm';

import { Match } from './match.entity'
import { Division } from './division.entity'


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
}