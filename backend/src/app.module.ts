import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KafkaModule } from './kafka/kafka.module';
import { BikesModule } from './bikes/bikes.module';
import { GatewayModule } from './gateway/gateway.module';
import { SimulatorModule } from './simulator/simulator.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    KafkaModule,
    GatewayModule,
    BikesModule,
    SimulatorModule,
  ],
})
export class AppModule {}
