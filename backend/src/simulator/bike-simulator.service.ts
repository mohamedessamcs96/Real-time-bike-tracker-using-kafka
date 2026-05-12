import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { KafkaService, TOPICS } from '../kafka/kafka.service';
import { BikeLocationEvent, BikeStatus } from '../bikes/bikes.types';

// Simulated bikes state (independent of BikesService to show Kafka round-trip)
interface SimBike {
  id: string;
  lat: number;
  lon: number;
  battery: number;
  speed: number;
  status: BikeStatus;
  direction: number;   // bearing degrees
  moving: boolean;
}

const CENTER = { lat: 52.5200, lon: 13.4050 }; // Berlin centre

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function moveBike(bike: SimBike): SimBike {
  if (!bike.moving || bike.status !== 'in_use') {
    return { ...bike, speed: 0 };
  }

  // Drift direction slightly
  bike.direction += randomBetween(-15, 15);

  const speedKmh = randomBetween(8, 22);
  const distKm = speedKmh / 3600; // distance per second
  const dLat = (distKm / 111) * Math.cos((bike.direction * Math.PI) / 180);
  const dLon = (distKm / (111 * Math.cos((bike.lat * Math.PI) / 180))) * Math.sin((bike.direction * Math.PI) / 180);

  // Keep within ~2 km of Berlin centre
  const newLat = Math.abs(bike.lat + dLat - CENTER.lat) < 0.025 ? bike.lat + dLat : bike.lat - dLat * 0.5;
  const newLon = Math.abs(bike.lon + dLon - CENTER.lon) < 0.025 ? bike.lon + dLon : bike.lon - dLon * 0.5;

  return {
    ...bike,
    lat: newLat,
    lon: newLon,
    speed: speedKmh,
    battery: Math.max(0, bike.battery - 0.02),
  };
}

@Injectable()
export class BikeSimulatorService implements OnModuleInit {
  private readonly logger = new Logger(BikeSimulatorService.name);
  private simBikes: SimBike[] = [];
  private ready = false;

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    // Give Kafka time to initialise
    await new Promise(r => setTimeout(r, 8000));

    this.simBikes = Array.from({ length: 15 }, (_, i) => ({
      id: `BIKE-${String(i + 1).padStart(3, '0')}`,
      lat: CENTER.lat + randomBetween(-0.02, 0.02),
      lon: CENTER.lon + randomBetween(-0.02, 0.02),
      battery: randomBetween(40, 100),
      speed: 0,
      status: i < 10 ? 'available' : 'in_use',
      direction: randomBetween(0, 360),
      moving: i >= 10,
    }));

    this.ready = true;
    this.logger.log(`🚴 Simulator ready — simulating ${this.simBikes.length} bikes`);
  }

  // Publishes GPS updates every 3 seconds for in-use bikes
  @Interval(3000)
  async publishLocations() {
    if (!this.ready) return;

    for (let i = 0; i < this.simBikes.length; i++) {
      this.simBikes[i] = moveBike(this.simBikes[i]);
      const bike = this.simBikes[i];

      const event: BikeLocationEvent = {
        bikeId: bike.id,
        lat: bike.lat,
        lon: bike.lon,
        battery: Math.round(bike.battery),
        speed: Math.round(bike.speed * 10) / 10,
        status: bike.status,
        timestamp: Date.now(),
      };

      await this.kafkaService.publish(TOPICS.BIKE_LOCATION, bike.id, event);
    }
  }

  // Randomly toggle 1-2 bikes between available/in_use every 20 s
  @Interval(20000)
  flipBikeStatus() {
    if (!this.ready) return;

    const idx = Math.floor(Math.random() * this.simBikes.length);
    const bike = this.simBikes[idx];

    if (bike.status === 'available') {
      this.simBikes[idx] = { ...bike, status: 'in_use', moving: true };
    } else if (bike.status === 'in_use') {
      this.simBikes[idx] = { ...bike, status: 'available', moving: false, speed: 0 };
    }
  }
}
