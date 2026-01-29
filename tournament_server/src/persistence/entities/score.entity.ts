import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne } from 'typeorm';

import { Song } from './song.entity'
import { Player } from './player.entity'


@Entity()
export class Score {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal")
  percentage: number;

  @Column()
  isFailed: boolean;

  @ManyToOne(() => Song, (song) => song.scores, { eager: true, onDelete: 'CASCADE' })
  song: Song

  @ManyToOne(() => Player, (player) => player.scores, { eager: true,  onDelete: 'CASCADE' })
  player: Player
}
