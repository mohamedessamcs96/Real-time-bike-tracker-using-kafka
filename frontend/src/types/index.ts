export type BikeStatus = 'available' | 'in_use' | 'charging' | 'maintenance';

export interface Bike {
  id: string;
  name: string;
  lat: number;
  lon: number;
  battery: number;
  status: BikeStatus;
  speed: number;
  stationId: string | null;
  riderId: string | null;
  lastUpdated: number;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  availableBikes: number;
  address: string;
}

export interface Alert {
  id: string;
  type: string;
  bikeId: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

export interface Stats {
  totalBikes: number;
  availableBikes: number;
  inUseBikes: number;
  chargingBikes: number;
  maintenanceBikes: number;
  activeRides: number;
  totalStations: number;
  avgBattery: number;
}

export interface LocationUpdate {
  bikeId: string;
  lat: number;
  lon: number;
  battery: number;
  speed: number;
  status: BikeStatus;
  timestamp: number;
}
