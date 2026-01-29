import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  OneToMany } from 'typeorm';

import { Player } from './player.entity'


@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Player, (score) => score.team, { eager: true })
  players: Player[]
}
