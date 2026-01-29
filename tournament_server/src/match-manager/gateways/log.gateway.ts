// app.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  path: "/logupdatehub",
  cors: {
    origin: '*', // Adjust this for security in production
  },
})
export class LogGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to log gateway: ${client.id}`);
    // You could store connected clients here for later use
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected to log gateway: ${client.id}`);
  }

  logError(logMessage: string) {
    this.sendLog('error', logMessage);
  }

  logWarning(logMessage: string) {
    this.sendLog('warning', logMessage);
  }

  logInfo(logMessage: string) {
    this.sendLog('info', logMessage);
  }

  sendLog(logType: string, logMessage: string) {
      this.server.emit(logType, logMessage);
  }
}