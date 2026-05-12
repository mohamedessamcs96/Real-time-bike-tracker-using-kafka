import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, Admin, Partitioners } from 'kafkajs';

export const TOPICS = {
  BIKE_LOCATION: 'bike-location',
  RIDE_EVENTS:   'ride-events',
  STATION_STATUS:'station-status',
  ALERTS:        'alerts',
} as const;

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private admin: Admin;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'nextbike-app',
      brokers: [process.env.KAFKA_BROKERS || 'kafka:29092'],
      retry: {
        initialRetryTime: 3000,
        retries: 10,
      },
    });
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 10, delay = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.admin.connect();
        await this.ensureTopics();
        await this.admin.disconnect();

        await this.producer.connect();
        this.logger.log('✅ Kafka producer connected');
        return;
      } catch (err) {
        this.logger.warn(`Kafka connection attempt ${i + 1}/${retries} failed: ${err.message}`);
        if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
      }
    }
    this.logger.error('Failed to connect to Kafka after all retries');
  }

  private async ensureTopics() {
    const existing = await this.admin.listTopics();
    const toCreate = Object.values(TOPICS)
      .filter(t => !existing.includes(t))
      .map(topic => ({ topic, numPartitions: 3, replicationFactor: 1 }));

    if (toCreate.length > 0) {
      await this.admin.createTopics({ topics: toCreate });
      this.logger.log(`Created topics: ${toCreate.map(t => t.topic).join(', ')}`);
    }
  }

  async publish(topic: string, key: string, value: object): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(value) }],
      });
    } catch (err) {
      this.logger.error(`Failed to publish to ${topic}: ${err.message}`);
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: any) => Promise<void>,
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const payload = JSON.parse(message.value?.toString() || '{}');
          await handler(payload);
        } catch (err) {
          this.logger.error(`Error processing message from ${topic}: ${err.message}`);
        }
      },
    });

    this.consumers.set(`${topic}-${groupId}`, consumer);
    this.logger.log(`📥 Subscribed to topic: ${topic} (group: ${groupId})`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }
}
