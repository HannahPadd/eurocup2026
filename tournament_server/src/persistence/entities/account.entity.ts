import { Entity,
        Column,
        PrimaryGeneratedColumn,
        OneToOne,
        JoinColumn } from 'typeorm';

import { Player } from './player.entity';


@Entity()
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ default: "" })
    refreshToken: string;

    @Column({ default: "" })
    grooveStatsApi: string;

    @OneToOne(() => Player)
    @JoinColumn()
    player: Player

}