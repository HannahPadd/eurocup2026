import WS from "ws";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score, Song, Player } from '@persistence/entities';
import { StandingManager } from 'src/match-manager/services/standing.manager';
import { CreateScoreDto } from '../dtos';
import * as path from 'path';

export class ScoreListenerService implements OnModuleInit {
	constructor(private readonly moduleRef: ModuleRef) {}

	@InjectRepository(Score)
	private scoreRepository: Repository<Score>
	@InjectRepository(Song)
	private songRepository: Repository<Song>
	@InjectRepository(Player)
	private playerRepository: Repository<Player>

    private itgOnlineUrl: string
	private ws: ReconnectingWebSocket
	private initialized = false;

	private getStandingManager(): StandingManager | null {
		try {
			return this.moduleRef.get(StandingManager, { strict: false });
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

			const standingManager = this.getStandingManager();
			if (standingManager) {
				const dto = new CreateScoreDto();
				dto.songId = song.id;
				dto.playerId = player.id;
				dto.percentage = percentage;
				dto.isFailed = isFailed;

				const match = await standingManager.AddScore(dto);
				if (match) {
					return;
				}

				console.warn(
					`sendScoreResult fallback to score-only save; no active match/round for songId=${song.id}, playerId=${player.id}`,
				);
			}

			const newScore = new Score();
			newScore.percentage = percentage;
			newScore.isFailed = isFailed;
			newScore.song = song;
			newScore.player = player;

			await this.scoreRepository.save(newScore);
		}
    }
}
