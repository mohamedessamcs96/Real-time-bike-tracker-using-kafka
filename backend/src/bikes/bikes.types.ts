export interface Bike {
  id: string;
  name: string;
  lat: number;
  lon: number;
  battery: number;      // 0-100
  status: BikeStatus;
  speed: number;        // km/h
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

export interface Ride {
  id: string;
  bikeId: string;
  riderId: string;
  startTime: number;
  endTime: number | null;
  startStation: string;
  endStation: string | null;
  distance: number;     // km
  status: RideStatus;
}

export interface BikeLocationEvent {
  bikeId: string;
  lat: number;
  lon: number;
  battery: number;
  speed: number;
  status: BikeStatus;
  timestamp: number;
}

export interface RideEvent {
  type: 'RIDE_STARTED' | 'RIDE_ENDED' | 'RIDE_PAUSED';
  rideId: string;
  bikeId: string;
  riderId: string;
  timestamp: number;
  lat: number;
  lon: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  bikeId: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

export type BikeStatus = 'available' | 'in_use' | 'charging' | 'maintenance';
export type RideStatus = 'active' | 'completed' | 'cancelled';
export type AlertType = 'LOW_BATTERY' | 'MAINTENANCE_NEEDED' | 'GEOFENCE_BREACH' | 'THEFT_ALERT';
