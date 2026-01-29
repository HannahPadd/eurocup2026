import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    OneToMany } from 'typeorm';

import { Round } from './round.entity';
import { Player } from './player.entity';
import { Match } from './match.entity';


@Entity()
export class Bracket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    bracketTypeId: number;

    @OneToMany(() => Round, (round) => round.bracket)
    round: Round[];

    @OneToMany(() => Player, (player) => player.bracket)
    player: Player[];

    @OneToMany(() => Match, (match) => match.bracket)
    match: Match[];
}