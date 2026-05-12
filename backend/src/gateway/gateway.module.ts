import { Module } from '@nestjs/common';
import { BikesGateway } from './bikes.gateway';

@Module({
  providers: [BikesGateway],
  exports: [BikesGateway],
})
export class GatewayModule {}
