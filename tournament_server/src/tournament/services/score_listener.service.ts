import WS from "ws";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score, Song, Player } from '@persistence/entities';
import { initialize } from "passport";

export class ScoreListenerService implements OnModuleInit {
	@InjectRepository(Score)
	private scoreRepository: Repository<Score>
	@InjectRepository(Song)
	private songRepository: Repository<Song>
	@InjectRepository(Player)
	private playerRepository: Repository<Player>

    private itgOnlineUrl: string
    private ws: ReconnectingWebSocket
	private initialized = false;
	
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

			const song = await this.songRepository.findOneBy({ title: message.data.songInfo.title });

			if (!song) {	
				throw new NotFoundException(`Song with title ${message.data.songInfo.title} not found`);
			}

			const player = await this.playerRepository.findOneBy({ playerName: message.data.player.name });

			if (!player) {
				throw new NotFoundException(`Player with playerName ${message.data.player.name} not found`);
			}

			const newScore = new Score();

			newScore.percentage = message.data.player.exScore;
			newScore.isFailed = false; // Fails don't get submitted
			newScore.song = song;
			newScore.player = player;

			await this.scoreRepository.save(newScore);
		}
    }
}