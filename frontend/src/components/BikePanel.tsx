import React from 'react';
import { Bike } from '../types';

interface Props {
  bikes: Bike[];
  selectedBike: string | null;
  onSelectBike: (id: string | null) => void;
  onStartRide: (bikeId: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  available: '#10b981', in_use: '#00d4ff', charging: '#f59e0b', maintenance: '#ef4444',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Available', in_use: 'In Use', charging: 'Charging', maintenance: 'Maintenance',
};

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: '#1e2a3a', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

export function BikePanel({ bikes, selectedBike, onSelectBike, onStartRide }: Props) {
  const selected = bikes.find(b => b.id === selectedBike);

  return (
    <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Selected bike detail */}
      {selected && (
        <div style={{ background: '#111827', borderRadius: 12, border: `1px solid ${STATUS_COLOR[selected.status]}`, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{selected.id}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: STATUS_COLOR[selected.status] + '33', color: STATUS_COLOR[selected.status] }}>
              {STATUS_LABEL[selected.status]}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Battery</span>
            </div>
            <BatteryBar pct={selected.battery} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Speed</span>
              <span style={{ color: '#f8fafc' }}>{selected.speed.toFixed(1)} km/h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Position</span>
              <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}>
                {selected.lat.toFixed(4)}, {selected.lon.toFixed(4)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Last Update</span>
              <span style={{ color: '#94a3b8' }}>{new Date(selected.lastUpdated).toLocaleTimeString()}</span>
            </div>
          </div>

          {selected.status === 'available' && (
            <button
              onClick={() => onStartRide(selected.id)}
              style={{ width: '100%', marginTop: 12, padding: '8px 0', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              🚴 Start Ride
            </button>
          )}
        </div>
      )}

      {/* Bike list */}
      <div style={{ background: '#111827', borderRadius: 12, border: '1px solid #1e2a3a', overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e2a3a', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          All Bikes ({bikes.length})
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 380 }}>
          {bikes.map(bike => (
            <div
              key={bike.id}
              onClick={() => onSelectBike(bike.id === selectedBike ? null : bike.id)}
              style={{
                padding: '9px 14px',
                borderBottom: '1px solid #0a0f1e',
                cursor: 'pointer',
                background: selectedBike === bike.id ? '#1e2a3a' : 'transparent',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>🚲</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>{bike.id}</div>
                <div style={{ fontSize: 10, color: STATUS_COLOR[bike.status] }}>
                  {STATUS_LABEL[bike.status]}{bike.status === 'in_use' ? ` · ${bike.speed.toFixed(1)} km/h` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontSize: 11, color: bike.battery > 30 ? '#10b981' : '#ef4444' }}>🔋 {bike.battery}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
