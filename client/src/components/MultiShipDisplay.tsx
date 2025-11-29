import { type CSSProperties } from 'react';

export interface ShipData {
  id: string;
  name: string;
  hull: { current: number; max: number };
  initiative?: number;
  isActive?: boolean;
  isDestroyed?: boolean;
  color?: string;
}

interface MultiShipDisplayProps {
  ships: ShipData[];
  currentPhase?: 'manoeuvre' | 'attack' | 'actions' | 'round_end';
  activeShipId?: string | null;
}

const SHIP_COLORS = [
  '#4ade80', // Green
  '#60a5fa', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
];

export default function MultiShipDisplay({
  ships,
  currentPhase = 'manoeuvre',
  activeShipId = null
}: MultiShipDisplayProps) {

  const getShipColor = (index: number, customColor?: string): string => {
    return customColor || SHIP_COLORS[index % SHIP_COLORS.length];
  };

  const getHullPercentage = (ship: ShipData): number => {
    return (ship.hull.current / ship.hull.max) * 100;
  };

  const getHullColor = (percentage: number): string => {
    if (percentage > 66) return '#4ade80'; // Green
    if (percentage > 33) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const formatPhaseName = (phase: string): string => {
    return phase.charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ');
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ marginBottom: '10px', fontSize: '1.2rem' }}>Ships in Combat</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px'
      }}>
        {ships.map((ship, index) => {
          const shipColor = getShipColor(index, ship.color);
          const hullPercent = getHullPercentage(ship);
          const hullColor = getHullColor(hullPercent);
          const isActive = activeShipId === ship.id || ship.isActive;
          const isDestroyed = ship.isDestroyed || ship.hull.current <= 0;

          const cardStyle: CSSProperties = {
            padding: '15px',
            border: `3px solid ${isActive ? shipColor : '#444'}`,
            borderRadius: '8px',
            backgroundColor: isActive ? `${shipColor}15` : '#1a1a1a',
            opacity: isDestroyed ? 0.5 : 1,
            position: 'relative',
            transition: 'all 0.3s ease',
            boxShadow: isActive ? `0 0 10px ${shipColor}80` : 'none'
          };

          return (
            <div key={ship.id} style={cardStyle}>
              {/* Color indicator bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: shipColor,
                borderRadius: '8px 8px 0 0'
              }} />

              {/* Ship name */}
              <h3 style={{
                marginTop: '5px',
                marginBottom: '10px',
                color: shipColor,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {ship.name}
                {isActive && <span style={{ fontSize: '0.8rem' }}>▶</span>}
                {isDestroyed && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>💥</span>}
              </h3>

              {/* Hull status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '0.9rem'
                }}>
                  <span>Hull</span>
                  <span style={{ color: hullColor }}>
                    {ship.hull.current}/{ship.hull.max}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${hullPercent}%`,
                    height: '100%',
                    backgroundColor: hullColor,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Initiative */}
              {ship.initiative !== undefined && (
                <div style={{
                  fontSize: '0.9rem',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Initiative</span>
                  <span style={{
                    fontWeight: 'bold',
                    color: '#60a5fa'
                  }}>
                    {ship.initiative}
                  </span>
                </div>
              )}

              {/* Status indicator */}
              <div style={{
                fontSize: '0.8rem',
                color: '#888',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #333'
              }}>
                {isDestroyed ? (
                  <span style={{ color: '#ef4444' }}>DESTROYED</span>
                ) : isActive ? (
                  <span style={{ color: shipColor }}>
                    {formatPhaseName(currentPhase)}
                  </span>
                ) : (
                  <span>Standby</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {ships.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '2px dashed #333'
        }}>
          No ships in combat
        </div>
      )}
    </div>
  );
}
