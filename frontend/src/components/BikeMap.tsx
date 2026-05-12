import React, { useCallback } from 'react';
import { Bike, Station } from '../types';

interface Props {
  bikes: Bike[];
  stations: Station[];
  selectedBike: string | null;
  onSelectBike: (id: string | null) => void;
}

// Berlin bounding box
const BOUNDS = { minLat: 52.49, maxLat: 52.55, minLon: 13.35, maxLon: 13.46 };
const W = 700, H = 480;

function toXY(lat: number, lon: number) {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * W;
  const y = H - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H;
  return { x, y };
}

const STATUS_COLOR: Record<string, string> = {
  available: '#10b981',
  in_use:    '#00d4ff',
  charging:  '#f59e0b',
  maintenance: '#ef4444',
};

export function BikeMap({ bikes, stations, selectedBike, onSelectBike }: Props) {
  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelectBike(selectedBike === id ? null : id);
  }, [selectedBike, onSelectBike]);

  return (
    <div style={{ flex: 1, background: '#0d1117', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e2a3a', position: 'relative' }}>
      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, right: 12, background: '#111827dd', borderRadius: 8, padding: '8px 12px', zIndex: 10, fontSize: 11 }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
            <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #1e2a3a', marginTop: 4, paddingTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🅿️</span>
          <span style={{ color: '#94a3b8' }}>Station</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%" height="100%"
        style={{ display: 'block', cursor: 'pointer' }}
        onClick={() => onSelectBike(null)}
      >
        {/* Map background */}
        <rect width={W} height={H} fill="#0d1117" />

        {/* Grid lines */}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 80} x2={W} y2={i * 80} stroke="#1e2a3a" strokeWidth={1} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={H} stroke="#1e2a3a" strokeWidth={1} />
        ))}

        {/* Stations */}
        {stations.map(station => {
          const { x, y } = toXY(station.lat, station.lon);
          return (
            <g key={station.id}>
              <rect x={x - 18} y={y - 18} width={36} height={36} rx={6}
                fill="#1e2a3a" stroke="#8b5cf6" strokeWidth={1.5} />
              <text x={x} y={y - 4} textAnchor="middle" fontSize={14}>🅿️</text>
              <text x={x} y={y + 14} textAnchor="middle" fontSize={7} fill="#8b5cf6">{station.availableBikes}/{station.capacity}</text>
            </g>
          );
        })}

        {/* Bikes */}
        {bikes.map(bike => {
          const { x, y } = toXY(bike.lat, bike.lon);
          const color = STATUS_COLOR[bike.status] || '#94a3b8';
          const isSelected = selectedBike === bike.id;
          const isMoving = bike.status === 'in_use';

          return (
            <g key={bike.id} onClick={e => handleClick(e, bike.id)} style={{ cursor: 'pointer' }}>
              {/* Selection ring */}
              {isSelected && (
                <circle cx={x} cy={y} r={22} fill="none" stroke={color} strokeWidth={2} opacity={0.6}>
                  <animate attributeName="r" values="16;24;16" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Pulse for moving bikes */}
              {isMoving && !isSelected && (
                <circle cx={x} cy={y} r={12} fill={color} opacity={0.2}>
                  <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Bike dot */}
              <circle cx={x} cy={y} r={8} fill={color} stroke="#0a0f1e" strokeWidth={2} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={9}>🚲</text>
              {/* Battery indicator */}
              <rect x={x - 8} y={y - 18} width={16} height={4} rx={2} fill="#1e2a3a" />
              <rect x={x - 8} y={y - 18} width={bike.battery / 100 * 16} height={4} rx={2}
                fill={bike.battery > 30 ? '#10b981' : '#ef4444'} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
