import React from 'react';
import { LocationUpdate, Alert } from '../types';

interface Props {
  locationUpdates: LocationUpdate[];
  alerts: Alert[];
}

const SEVERITY_COLOR: Record<string, string> = { low: '#64748b', medium: '#f59e0b', high: '#ef4444' };
const STATUS_COLOR: Record<string, string> = {
  available: '#10b981', in_use: '#00d4ff', charging: '#f59e0b', maintenance: '#ef4444',
};

export function KafkaFeed({ locationUpdates, alerts }: Props) {
  return (
    <div style={{ display: 'flex', gap: 12, height: 200 }}>
      {/* Location events */}
      <div style={{ flex: 1, background: '#111827', borderRadius: 12, border: '1px solid #1e2a3a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e2a3a', fontSize: 11, fontWeight: 600, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }}>
            <span style={{ display: 'block', width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', animation: 'pulse 1s infinite' }} />
          </span>
          Kafka · bike-location topic
        </div>
        <div style={{ overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: 10.5, padding: '4px 0' }}>
          {locationUpdates.slice(0, 20).map((u, i) => (
            <div key={i} style={{ padding: '3px 14px', borderBottom: '1px solid #0a0f1e', color: '#64748b', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#374151' }}>{new Date(u.timestamp).toLocaleTimeString()}</span>
              <span style={{ color: STATUS_COLOR[u.status] || '#94a3b8' }}>●</span>
              <span style={{ color: '#94a3b8' }}>{u.bikeId}</span>
              <span style={{ color: '#4b5563' }}>lat:{u.lat.toFixed(4)} lon:{u.lon.toFixed(4)}</span>
              <span style={{ color: u.battery > 30 ? '#10b981' : '#ef4444' }}>🔋{u.battery}%</span>
              {u.speed > 0 && <span style={{ color: '#00d4ff' }}>{u.speed.toFixed(1)}km/h</span>}
            </div>
          ))}
          {locationUpdates.length === 0 && (
            <div style={{ padding: '20px 14px', color: '#374151', textAlign: 'center' }}>Waiting for events…</div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div style={{ width: 300, background: '#111827', borderRadius: 12, border: '1px solid #1e2a3a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e2a3a', fontSize: 11, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          ⚠ Kafka · alerts topic
        </div>
        <div style={{ overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: 10.5, padding: '4px 0' }}>
          {alerts.slice(0, 15).map((a, i) => (
            <div key={i} style={{ padding: '4px 14px', borderBottom: '1px solid #0a0f1e' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: SEVERITY_COLOR[a.severity] + '33', color: SEVERITY_COLOR[a.severity] }}>{a.severity}</span>
                <span style={{ color: '#94a3b8' }}>{a.bikeId}</span>
                <span style={{ color: '#374151', marginLeft: 'auto' }}>{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
              <div style={{ color: '#64748b', marginTop: 1 }}>{a.message}</div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div style={{ padding: '20px 14px', color: '#374151', textAlign: 'center' }}>No alerts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
