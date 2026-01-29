import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  OneToMany, 
  ManyToOne, 
  JoinColumn } from 'typeorm';
  
import { Phase } from './phase.entity'
import { Tournament } from './tournament.entity';


@Entity()
export class Division {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Phase, (phase) => phase.division, { eager: true, cascade: true  })
  phases: Phase[];

  @ManyToOne(() => Tournament, (tournament) => tournament.divisions, { onDelete: 'CASCADE' })
  @JoinColumn()
  tournament: Tournament;
}

