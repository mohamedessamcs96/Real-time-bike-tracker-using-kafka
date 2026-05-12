import { Module } from '@nestjs/common';
import { BikeSimulatorService } from './bike-simulator.service';

@Module({
  providers: [BikeSimulatorService],
})
export class SimulatorModule {}
