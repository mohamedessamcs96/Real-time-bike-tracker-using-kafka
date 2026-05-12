import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { KafkaService, TOPICS } from '../kafka/kafka.service';
import { BikesGateway } from '../gateway/bikes.gateway';
import { Bike, Station, Ride, BikeLocationEvent, RideEvent, Alert, BikeStatus } from './bikes.types';

// ─── Berlin seed data ──────────────────────────────────────────────────────────
const BERLIN_STATIONS: Station[] = [
  { id: 'S001', name: 'Alexanderplatz',    lat: 52.5219, lon: 13.4132, capacity: 20, availableBikes: 12, address: 'Alexanderplatz 1, Berlin' },
  { id: 'S002', name: 'Brandenburger Tor', lat: 52.5163, lon: 13.3777, capacity: 15, availableBikes: 8,  address: 'Pariser Platz, Berlin' },
  { id: 'S003', name: 'Potsdamer Platz',   lat: 52.5096, lon: 13.3761, capacity: 18, availableBikes: 10, address: 'Potsdamer Platz 1, Berlin' },
  { id: 'S004', name: 'Hackescher Markt',  lat: 52.5228, lon: 13.4022, capacity: 12, availableBikes: 6,  address: 'Hackescher Markt, Berlin' },
  { id: 'S005', name: 'Prenzlauer Berg',   lat: 52.5373, lon: 13.4154, capacity: 10, availableBikes: 5,  address: 'Prenzlauer Allee, Berlin' },
];

const INITIAL_BIKES: Bike[] = Array.from({ length: 15 }, (_, i) => {
  const station = BERLIN_STATIONS[i % BERLIN_STATIONS.length];
  return {
    id: `BIKE-${String(i + 1).padStart(3, '0')}`,
    name: `NextBike #${i + 1}`,
    lat: station.lat + (Math.random() - 0.5) * 0.005,
    lon: station.lon + (Math.random() - 0.5) * 0.005,
    battery: Math.floor(Math.random() * 60) + 40,
    status: i < 10 ? 'available' : 'in_use',
    speed: 0,
    stationId: i < 10 ? station.id : null,
    riderId: null,
    lastUpdated: Date.now(),
  };
});

@Injectable()
export class BikesService implements OnModuleInit {
  private readonly logger = new Logger(BikesService.name);
  private bikes: Map<string, Bike> = new Map();
  private stations: Map<string, Station> = new Map();
  private rides: Map<string, Ride> = new Map();
  private alerts: Alert[] = [];

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly gateway: BikesGateway,
  ) {}

  async onModuleInit() {
    // Seed data
    INITIAL_BIKES.forEach(b => this.bikes.set(b.id, b));
    BERLIN_STATIONS.forEach(s => this.stations.set(s.id, s));

    // Subscribe to Kafka topics
    await this.kafkaService.subscribe(
      TOPICS.BIKE_LOCATION,
      'bikes-location-consumer',
      this.handleLocationEvent.bind(this),
    );

    await this.kafkaService.subscribe(
      TOPICS.RIDE_EVENTS,
      'bikes-ride-consumer',
      this.handleRideEvent.bind(this),
    );

    await this.kafkaService.subscribe(
      TOPICS.ALERTS,
      'bikes-alert-consumer',
      this.handleAlert.bind(this),
    );

    this.logger.log('🚴 BikesService initialized with Kafka consumers');
  }

  // ─── Kafka event handlers ──────────────────────────────────────────

  private async handleLocationEvent(event: BikeLocationEvent) {
    const bike = this.bikes.get(event.bikeId);
    if (!bike) return;

    bike.lat = event.lat;
    bike.lon = event.lon;
    bike.battery = event.battery;
    bike.speed = event.speed;
    bike.status = event.status;
    bike.lastUpdated = event.timestamp;

    this.bikes.set(bike.id, bike);
    this.gateway.emitBikeLocation(bike);

    // Trigger low battery alert
    if (bike.battery < 15 && bike.battery > 0) {
      await this.createAlert(bike.id, 'LOW_BATTERY', `Battery at ${bike.battery}%`, 'high');
    }
  }

  private async handleRideEvent(event: RideEvent) {
    if (event.type === 'RIDE_STARTED') {
      const ride: Ride = {
        id: event.rideId,
        bikeId: event.bikeId,
        riderId: event.riderId,
        startTime: event.timestamp,
        endTime: null,
        startStation: 'S001',
        endStation: null,
        distance: 0,
        status: 'active',
      };
      this.rides.set(ride.id, ride);
    } else if (event.type === 'RIDE_ENDED') {
      const ride = this.rides.get(event.rideId);
      if (ride) {
        ride.endTime = event.timestamp;
        ride.status = 'completed';
        this.rides.set(ride.id, ride);
      }
    }
    this.gateway.emitRideEvent(event);
  }

  private async handleAlert(alert: Alert) {
    this.alerts.unshift(alert);
    if (this.alerts.length > 50) this.alerts.pop();
    this.gateway.emitAlert(alert);
  }

  // ─── REST-facing methods ───────────────────────────────────────────

  getAllBikes(): Bike[] {
    return Array.from(this.bikes.values());
  }

  getBike(id: string): Bike | undefined {
    return this.bikes.get(id);
  }

  getAllStations(): Station[] {
    return Array.from(this.stations.values());
  }

  getStation(id: string): Station | undefined {
    return this.stations.get(id);
  }

  getActiveRides(): Ride[] {
    return Array.from(this.rides.values()).filter(r => r.status === 'active');
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }

  getStats() {
    const bikes = this.getAllBikes();
    return {
      totalBikes: bikes.length,
      availableBikes: bikes.filter(b => b.status === 'available').length,
      inUseBikes: bikes.filter(b => b.status === 'in_use').length,
      chargingBikes: bikes.filter(b => b.status === 'charging').length,
      maintenanceBikes: bikes.filter(b => b.status === 'maintenance').length,
      activeRides: this.getActiveRides().length,
      totalStations: this.stations.size,
      avgBattery: Math.round(bikes.reduce((s, b) => s + b.battery, 0) / bikes.length),
    };
  }

  async startRide(bikeId: string, riderId: string): Promise<Ride | null> {
    const bike = this.bikes.get(bikeId);
    if (!bike || bike.status !== 'available') return null;

    const rideId = uuidv4();
    const event: RideEvent = {
      type: 'RIDE_STARTED',
      rideId,
      bikeId,
      riderId,
      timestamp: Date.now(),
      lat: bike.lat,
      lon: bike.lon,
    };

    bike.status = 'in_use';
    bike.riderId = riderId;
    bike.stationId = null;
    this.bikes.set(bikeId, bike);

    await this.kafkaService.publish(TOPICS.RIDE_EVENTS, rideId, event);
    return this.rides.get(rideId) ?? { id: rideId, ...event, startStation: '', endStation: null, distance: 0, startTime: event.timestamp, endTime: null, status: 'active' };
  }

  async endRide(rideId: string): Promise<Ride | null> {
    const ride = this.rides.get(rideId);
    if (!ride) return null;

    const bike = this.bikes.get(ride.bikeId);
    const event: RideEvent = {
      type: 'RIDE_ENDED',
      rideId,
      bikeId: ride.bikeId,
      riderId: ride.riderId,
      timestamp: Date.now(),
      lat: bike?.lat ?? 0,
      lon: bike?.lon ?? 0,
    };

    if (bike) {
      bike.status = 'available';
      bike.riderId = null;
      bike.speed = 0;
      this.bikes.set(bike.id, bike);
    }

    await this.kafkaService.publish(TOPICS.RIDE_EVENTS, rideId, event);
    return ride;
  }

  private async createAlert(bikeId: string, type: Alert['type'], message: string, severity: Alert['severity']) {
    const alert: Alert = {
      id: uuidv4(),
      type,
      bikeId,
      message,
      timestamp: Date.now(),
      severity,
    };
    await this.kafkaService.publish(TOPICS.ALERTS, bikeId, alert);
  }
}
