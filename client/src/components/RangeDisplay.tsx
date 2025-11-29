import type { RangeBand } from '../utils/hexGrid';

interface RangeDisplayProps {
  range: RangeBand;
  distance: number;
}

/**
 * Range band color mapping for visual clarity.
 * Matches Traveller combat difficulty tiers.
 */
const RANGE_COLORS: Record<RangeBand, { bg: string; border: string; text: string }> = {
  'Adjacent': {
    bg: 'rgba(0, 255, 0, 0.15)',
    border: '#00ff00',
    text: '#00ff00',
  },
  'Close': {
    bg: 'rgba(50, 205, 50, 0.15)',
    border: '#32cd32',
    text: '#32cd32',
  },
  'Medium': {
    bg: 'rgba(255, 215, 0, 0.15)',
    border: '#ffd700',
    text: '#ffd700',
  },
  'Long': {
    bg: 'rgba(255, 140, 0, 0.15)',
    border: '#ff8c00',
    text: '#ff8c00',
  },
  'Very Long': {
    bg: 'rgba(255, 69, 0, 0.15)',
    border: '#ff4500',
    text: '#ff4500',
  },
};

/**
 * Range band descriptions for tactical awareness.
 * Provides context for combat difficulty modifiers.
 */
const RANGE_DESCRIPTIONS: Record<RangeBand, string> = {
  'Adjacent': 'Point-blank range - Highest accuracy',
  'Close': 'Close range - Good accuracy',
  'Medium': 'Medium range - Moderate accuracy',
  'Long': 'Long range - Reduced accuracy',
  'Very Long': 'Very long range - Difficult shots',
};

/**
 * Enhanced range display component with visual indicators.
 * Shows current range band with color-coding and tactical info.
 */
export default function RangeDisplay({ range, distance }: RangeDisplayProps) {
  const colors = RANGE_COLORS[range];
  const description = RANGE_DESCRIPTIONS[range];

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        border: `2px solid ${colors.border}`,
        backgroundColor: colors.bg,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Range Band Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: colors.text,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {range} Range
          </span>
        </div>

        {/* Hex Distance */}
        <span
          style={{
            fontSize: '16px',
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {Math.floor(distance)} hexes
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontStyle: 'italic',
        }}
      >
        {description}
      </div>
    </div>
  );
}
