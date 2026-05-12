import { Controller, Get, Post, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { BikesService } from './bikes.service';

@Controller('api')
export class BikesController {
  constructor(private readonly bikesService: BikesService) {}

  @Get('bikes')
  getBikes() {
    return this.bikesService.getAllBikes();
  }

  @Get('bikes/:id')
  getBike(@Param('id') id: string) {
    const bike = this.bikesService.getBike(id);
    if (!bike) throw new NotFoundException(`Bike ${id} not found`);
    return bike;
  }

  @Get('stations')
  getStations() {
    return this.bikesService.getAllStations();
  }

  @Get('stations/:id')
  getStation(@Param('id') id: string) {
    const station = this.bikesService.getStation(id);
    if (!station) throw new NotFoundException(`Station ${id} not found`);
    return station;
  }

  @Get('rides/active')
  getActiveRides() {
    return this.bikesService.getActiveRides();
  }

  @Get('alerts')
  getAlerts() {
    return this.bikesService.getAlerts();
  }

  @Get('stats')
  getStats() {
    return this.bikesService.getStats();
  }

  @Post('rides/start')
  async startRide(@Body() body: { bikeId: string; riderId: string }) {
    const ride = await this.bikesService.startRide(body.bikeId, body.riderId);
    if (!ride) throw new BadRequestException('Bike is not available');
    return ride;
  }

  @Post('rides/:rideId/end')
  async endRide(@Param('rideId') rideId: string) {
    const ride = await this.bikesService.endRide(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    return ride;
  }
}
