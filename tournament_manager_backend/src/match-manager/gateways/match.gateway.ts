
// app.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Match } from '@persistence/entities';

@WebSocketGateway({
  path: "/matchupdatehub",
  cors: {
    origin: '*', // Adjust this for security in production
  },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to match gateway: ${client.id}`);
    // You could store connected clients here for later use
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected to match gateway: ${client.id}`);
  }

  UpdateMatch(match: Match) {
    this.server.emit('UpdateMatch', match);
  }

  async OnMatchUpdate(match: Match) {
    if(!match) {
      return;
    }
    
    const phase = await match.phase;
    const division = await phase.division;

    const msg = {matchId: match.id, phaseId: phase.id, divisionId: division.id};

    this.server.emit('OnMatchUpdate', msg);
    delete match.phase;
  }  
}
