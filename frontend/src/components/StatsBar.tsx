import React from 'react';
import { Stats } from '../types';

interface Props {
  stats: Stats | null;
  connected: boolean;
  clientsCount: number;
}

const S: Record<string, React.CSSProperties> = {
  bar: { display: 'flex', gap: 12, padding: '10px 20px', background: '#111827', borderBottom: '1px solid #1e2a3a', flexWrap: 'wrap', alignItems: 'center' },
  logo: { fontSize: 20, fontWeight: 700, color: '#00d4ff', marginRight: 12, letterSpacing: -0.5 },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#1e2a3a', borderRadius: 8, padding: '6px 14px', minWidth: 80 },
  label: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 18, fontWeight: 700, lineHeight: 1.2 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 5 },
  wsChip: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', background: '#0a0f1e', padding: '4px 10px', borderRadius: 20 },
};

export function StatsBar({ stats, connected, clientsCount }: Props) {
  const cards = stats ? [
    { label: 'Total Bikes',  value: stats.totalBikes,      color: '#f8fafc' },
    { label: 'Available',    value: stats.availableBikes,  color: '#10b981' },
    { label: 'In Use',       value: stats.inUseBikes,      color: '#00d4ff' },
    { label: 'Active Rides', value: stats.activeRides,     color: '#f59e0b' },
    { label: 'Stations',     value: stats.totalStations,   color: '#8b5cf6' },
    { label: 'Avg Battery',  value: `${stats.avgBattery}%`,color: stats.avgBattery > 50 ? '#10b981' : '#f59e0b' },
  ] : [];

  return (
    <div style={S.bar}>
      <span style={S.logo}>🚴 NextBike</span>
      {cards.map(c => (
        <div key={c.label} style={S.card}>
          <span style={{ ...S.value, color: c.color }}>{c.value}</span>
          <span style={S.label}>{c.label}</span>
        </div>
      ))}
      <div style={S.wsChip}>
        <span style={{ ...S.dot, background: connected ? '#10b981' : '#ef4444' }} />
        {connected ? `Live · ${clientsCount} viewer${clientsCount !== 1 ? 's' : ''}` : 'Connecting…'}
      </div>
    </div>
  );
}
