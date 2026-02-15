import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Phase } from './phase.entity';
import { Player } from './player.entity';

export enum PhaseProgressionAction {
  ADVANCE = 'ADVANCE',
  SEND_TO_LOSERS = 'SEND_TO_LOSERS',
  ELIMINATE = 'ELIMINATE',
  HOLD_FOR_TIEBREAKER = 'HOLD_FOR_TIEBREAKER',
}

@Entity()
export class PhaseProgressionResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  runId: string;

  @ManyToOne(() => Phase, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  phase: Phase;

  @ManyToOne(() => Player, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  player: Player;

  @Column({ type: 'varchar' })
  action: PhaseProgressionAction;

  @Column({ nullable: true })
  targetPhaseId: number;

  @Column({ nullable: true })
  targetMatchId: number;

  @Column()
  rankingPosition: number;

  @Column({ default: false })
  tiedAtBoundary: boolean;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
