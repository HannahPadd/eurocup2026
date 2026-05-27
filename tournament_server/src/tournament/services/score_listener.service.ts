import WS from "ws";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { NotFoundException, OnModuleInit, Injectable, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score, Song, Player, Round, Standing } from '@persistence/entities';
import { StandingManager } from 'src/match-manager/services/standing.manager';
import { TournamentCache } from "../../match-manager/services/tournament.cache";
import * as path from 'path';

export class ScoreListenerService implements OnModuleInit {
	constructor(
		private readonly moduleRef: ModuleRef,
	) { }

	@InjectRepository(Score)
	private scoreRepository: Repository<Score>
	@InjectRepository(Song)
	private songRepository: Repository<Song>
	@InjectRepository(Player)
	private playerRepository: Repository<Player>
	@InjectRepository(Round)
	private roundRepository: Repository<Round>
	@InjectRepository(Standing)
	private standingRepository: Repository<Standing>

    private itgOnlineUrl: string
	private ws: ReconnectingWebSocket
	private initialized = false;

	private getTournamentCache(): TournamentCache | null {
		try {
			return this.moduleRef.get(TournamentCache, { strict: false });
		} catch {
			return null;
		}
	}

	private parsePlayerName(data: any): string {
		const candidates = [
			data?.player?.playerName,
			data?.player?.profileName,
			data?.player?.name,
		];
		for (const value of candidates) {
			if (typeof value === 'string' && value.trim()) {
				return value.trim();
			}
		}
		throw new NotFoundException('Unable to resolve player name from sendScoreResult payload');
	}

	private async findSong(data: any): Promise<Song> {
		const candidates: string[] = [];

		const title = data?.songInfo?.title;
		if (typeof title === 'string' && title.trim()) {
			candidates.push(title.trim());
		}

		const songPath = data?.songInfo?.songPath;
		if (typeof songPath === 'string' && songPath.trim()) {
			candidates.push(path.basename(songPath.trim()));
		}

		const dedupedCandidates = Array.from(new Set(candidates));
		for (const candidate of dedupedCandidates) {
			const song = await this.songRepository.findOneBy({ title: candidate });
			if (song) {
				return song;
			}
		}

		throw new NotFoundException(
			`Song not found for sendScoreResult. Tried: ${dedupedCandidates.join(', ') || 'none'}`,
		);
	}
	
	public async onModuleInit() {
		if (this.initialized) {
			console.warn('ScoreListenerService is already initialized. Skipping initialization.');
			return;
		}
		this.initialized = true;
		
		this.itgOnlineUrl = process.env.ITG_ONLINE_URL;
		
		const options = {
			WebSocket: WS, // custom WebSocket constructor
			connectionTimeout: 1000,
			maxRetries: 10,
		};

		this.ws = new ReconnectingWebSocket(this.itgOnlineUrl, [], options);

		this.ws.addEventListener('open', () => {
			console.log('Score listener connected');
		});

		this.ws.addEventListener('close', () => {
			console.log('Score listener disconnected. Attempting to reconnect...');
		});

		const me = this

        this.ws.addEventListener('message', (data) => {
			const message = JSON.parse(data.data);
			me.onMessage(message)
				.then(() => {})
				.catch((err) => {
					console.error('Error processing message:', err);
				});
		});
    }

    send(data: any) {
        this.ws.send(JSON.stringify(data));
    }

    async onMessage(message: any) {
        if(message.event === 'sendScoreResult') {		
			console.log(`Score result: `, message.data);

			const song = await this.findSong(message.data);
			const playerName = this.parsePlayerName(message.data);
			const player = await this.playerRepository.findOneBy({ playerName });

			if (!player) {
				throw new NotFoundException(`Player with playerName ${playerName} not found`);
			}

			const rawPercentage = Number(message?.data?.player?.exScore ?? message?.data?.player?.score ?? 0);
			const percentage = Number.isFinite(rawPercentage) ? rawPercentage : 0;
			const isFailed = Boolean(message?.data?.player?.failed ?? false);

			const newScore = new Score();
			newScore.percentage = percentage;
			newScore.isFailed = isFailed;
			newScore.song = song;
			newScore.player = player;

			if(!song) // No songId available
				return;

			// Write score row to the database
			await this.scoreRepository.save(newScore);

			const tournamentCache = this.getTournamentCache()

			const activeMatch = await tournamentCache.GetActiveMatch();
			if(!activeMatch)
				return;

			const round = await this.roundRepository.findOneBy({
				match: activeMatch,
				song: song
			});

			if(!round) // Could not find match round by song
				return;
			
			// Write score to match (Standing)
			const standing = this.standingRepository.create({
				score: newScore,
				round: round,
				points: 0
			})

			if(!standing)
				throw new Error("Failed saving standing")
		}
    }
}
