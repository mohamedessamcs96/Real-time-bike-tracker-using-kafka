import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bike, Station, Stats, Alert } from '../types';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

export function useApi() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [bikesRes, stationsRes, statsRes, alertsRes] = await Promise.all([
        API.get('/api/bikes'),
        API.get('/api/stations'),
        API.get('/api/stats'),
        API.get('/api/alerts'),
      ]);
      setBikes(bikesRes.data);
      setStations(stationsRes.data);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchAll]);

  const updateBikeLocation = useCallback((update: { bikeId: string; lat: number; lon: number; battery: number; speed: number; status: any }) => {
    setBikes(prev => prev.map(b =>
      b.id === update.bikeId
        ? { ...b, lat: update.lat, lon: update.lon, battery: update.battery, speed: update.speed, status: update.status }
        : b
    ));
  }, []);

  const startRide = useCallback(async (bikeId: string) => {
    const res = await API.post('/api/rides/start', { bikeId, riderId: 'user-001' });
    await fetchAll();
    return res.data;
  }, [fetchAll]);

  const endRide = useCallback(async (rideId: string) => {
    const res = await API.post(`/api/rides/${rideId}/end`);
    await fetchAll();
    return res.data;
  }, [fetchAll]);

  return { bikes, stations, stats, alerts, loading, error, updateBikeLocation, startRide, endRide, refetch: fetchAll };
}
