// app.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocket } from 'ws';

@WebSocketGateway({
    path: "/game",
    cors: {
        origin: '*', // Adjust this for security in production
    },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    
    private clients: Record<string, WebSocket> = {};

    constructor(){

    }

    handleConnection(client: WebSocket) {
    }

    handleDisconnect(client: WebSocket) {
    }

    @SubscribeMessage('identify')
    onIdentify(client: WebSocket, payload: any): void {
        console.log('Received message:', payload);
        
        this.clients[payload.id] = client;
    }


    sendState(id: string, state): void {
        this.clients[id].send(JSON.stringify({
            event: "state",
            data: state
        }));
        
        //this.clients[id].emit("state", state);
    }

    sendLog(logType: string, logMessage: string) {
        this.server.emit(logType, logMessage);
    }
}