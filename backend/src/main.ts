import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  });

  // Kafka microservice listener
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKERS || 'kafka:29092'],
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID || 'nextbike-group',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3001);

  console.log(`🚴 NextBike Backend running on port ${process.env.PORT || 3001}`);
  console.log(`📡 Kafka connecting to: ${process.env.KAFKA_BROKERS || 'kafka:29092'}`);
}
bootstrap();
