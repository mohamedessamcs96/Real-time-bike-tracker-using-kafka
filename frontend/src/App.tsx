import React, { useState, useCallback } from 'react';
import { StatsBar } from './components/StatsBar';
import { BikeMap } from './components/BikeMap';
import { BikePanel } from './components/BikePanel';
import { KafkaFeed } from './components/KafkaFeed';
import { useApi } from './hooks/useApi';
import { useSocket } from './hooks/useSocket';
import { LocationUpdate } from './types';

export default function App() {
  const [selectedBike, setSelectedBike] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'stations'>('map');
  const [toast, setToast] = useState<string | null>(null);

  const { bikes, stations, stats, alerts: apiAlerts, loading, error, updateBikeLocation, startRide } = useApi();

  const handleLocation = useCallback((update: LocationUpdate) => {
    updateBikeLocation(update);
  }, [updateBikeLocation]);

  const { connected, clientsCount, locationUpdates, alerts: wsAlerts } = useSocket(handleLocation);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartRide = async (bikeId: string) => {
    try {
      await startRide(bikeId);
      showToast(`🚴 Ride started on ${bikeId}!`);
      setSelectedBike(null);
    } catch {
      showToast('❌ Failed to start ride');
    }
  };

  const allAlerts = [...wsAlerts, ...apiAlerts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Top stats bar */}
      <StatsBar stats={stats} connected={connected} clientsCount={clientsCount} />

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 0, padding: '0 20px', background: '#111827', borderBottom: '1px solid #1e2a3a' }}>
        {(['map', 'stations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'transparent', textTransform: 'capitalize',
              color: activeTab === tab ? '#00d4ff' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #00d4ff' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'map' ? '🗺 Live Map' : '🅿️ Stations'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflow: 'hidden', minHeight: 0 }}>

        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
            <div>
              <div style={{ textAlign: 'center', fontSize: 32, marginBottom: 12 }}>🚴</div>
              Connecting to NextBike backend…
            </div>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: 16, background: '#1a0000', borderRadius: 10, border: '1px solid #ef4444', fontSize: 13, color: '#fca5a5' }}>
            ❌ Backend not reachable: <code>{error}</code>
            <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>Make sure <code>docker compose up</code> is running</div>
          </div>
        )}

        {!loading && activeTab === 'map' && (
          <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
            <BikeMap
              bikes={bikes}
              stations={stations}
              selectedBike={selectedBike}
              onSelectBike={setSelectedBike}
            />
            <BikePanel
              bikes={bikes}
              selectedBike={selectedBike}
              onSelectBike={setSelectedBike}
              onStartRide={handleStartRide}
            />
          </div>
        )}

        {!loading && activeTab === 'stations' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, overflowY: 'auto' }}>
            {stations.map(st => (
              <div key={st.id} style={{ background: '#111827', borderRadius: 12, border: '1px solid #1e2a3a', padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🅿️ {st.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{st.address}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Available Bikes</span>
                  <span style={{ fontWeight: 700, color: st.availableBikes > 3 ? '#10b981' : '#f59e0b' }}>
                    {st.availableBikes} / {st.capacity}
                  </span>
                </div>
                <div style={{ height: 8, background: '#1e2a3a', borderRadius: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: st.availableBikes / st.capacity > 0.3 ? '#10b981' : '#f59e0b',
                    width: `${(st.availableBikes / st.capacity) * 100}%`,
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
                  {st.lat.toFixed(4)}, {st.lon.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kafka live feed */}
        {!loading && (
          <KafkaFeed locationUpdates={locationUpdates} alerts={allAlerts} />
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px #00000066', zIndex: 9999,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
