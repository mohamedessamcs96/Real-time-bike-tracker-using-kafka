import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Bike, RideEvent, Alert } from '../bikes/bikes.types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class BikesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BikesGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients})`);
    this.server.emit('clients_count', this.connectedClients);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} (total: ${this.connectedClients})`);
    this.server.emit('clients_count', this.connectedClients);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  // ─── Emit methods called by BikesService ────────────────────────

  emitBikeLocation(bike: Bike) {
    this.server.emit('bike_location', {
      bikeId: bike.id,
      lat: bike.lat,
      lon: bike.lon,
      battery: bike.battery,
      speed: bike.speed,
      status: bike.status,
      timestamp: bike.lastUpdated,
    });
  }

  emitRideEvent(event: RideEvent) {
    this.server.emit('ride_event', event);
  }

  emitAlert(alert: Alert) {
    this.server.emit('alert', alert);
  }
}
