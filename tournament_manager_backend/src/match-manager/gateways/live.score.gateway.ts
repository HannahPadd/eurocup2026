import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StandingManager } from 'src/match-manager/services/standing.manager';
import { WebSocket } from 'ws';

export class HoldNote {
    none: number;
    letGo: number;
    held: number;
    missed: number;
}

export class TapNote {
    none: number;
    hitMine: number;
    avoidMine: number;
    checkpointMiss: number;
    miss: number;
    W5: number;
    W4: number;
    W3: number;
    W2: number;
    W1: number;
    W0: number;
    checkpointHit: number;
}

export class LiveScore {
    song: string;
    playerNumber: number;
    playerName: string;
    actualDancePoints: number;
    currentPossibleDancePoints: number;
    possibleDancePoints: number;
    formattedScore: string;
    life: number;
    isFailed: boolean;
    tapNote: TapNote;
    holdNote: HoldNote;
    totalHoldsCount: number;
    id: string;
}

@WebSocketGateway({
    path: "/ws",
    cors: {
        origin: '*', // Adjust this for security in production
    },
})
export class LiveScoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    currentSong: string;
    scoreByPlayer: { [playerName: string]: LiveScore } = {};

    constructor(private readonly standingManger: StandingManager) { }
    
    @SubscribeMessage('scoreChange')
    scoreChange(client: Socket, payload: any): void {
        console.log('Received message:', payload);
        const score: LiveScore = payload;

        if (this.currentSong != score.song) {
            this.scoreByPlayer = {};
            this.currentSong = score.song;
            this.UpdateNewSongStarted(this.currentSong);
        }

        this.scoreByPlayer[score.playerName] = score;

        this.UpdateLiveScore(score);
    }

    @SubscribeMessage('onFinalResults')
    onFinalResults(client: WebSocket, data: any): void {
        console.log('Received message:', data);
        
        const score: LiveScore = JSON.parse(data);
        this.standingManger.AddLiveScore(score);
    }


    UpdateNewSongStarted(newSongTitle: string){
        this.server.emit('NewSongStarted', newSongTitle);
    }

    UpdateLiveScore(score: LiveScore) {
        this.server.emit('LiveScore', score);
    }
  
    handleConnection(client: WebSocket) {
        console.log(`Client connected to match gateway`);
        // client.on('message', async (messageBuffer: Buffer) => {
        //     const messageString = messageBuffer.toString();
        //     this.onFinalResults(messageString);
        // });
    }

    handleDisconnect(client: WebSocket) {
        console.log(`Client disconnected to match gateway`);
    }
}
