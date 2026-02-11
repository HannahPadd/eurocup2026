import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

import { Player } from './player.entity';
import { Song } from './song.entity';

@Entity()
@Unique(["player", "song"])
export class QualifierSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  percentage: number;

  @Column()
  screenshotUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Player, { onDelete: 'CASCADE', eager: true })
  player: Player;

  @ManyToOne(() => Song, { onDelete: 'CASCADE', eager: true })
  song: Song;
}
