import { type CSSProperties } from 'react';

export type Phase = 'manoeuvre' | 'attack' | 'actions' | 'round_end';

interface PhaseDisplayProps {
  currentPhase: Phase;
  currentRound?: number;
  onAdvancePhase?: () => void;
  compact?: boolean;
}

const PHASE_INFO: Record<Phase, { name: string; icon: string; color: string; description: string }> = {
  manoeuvre: {
    name: 'Manoeuvre',
    icon: '🚀',
    color: '#60a5fa', // Blue
    description: 'Pilots allocate thrust and move ships'
  },
  attack: {
    name: 'Attack',
    icon: '⚔️',
    color: '#ef4444', // Red
    description: 'Gunners fire weapons'
  },
  actions: {
    name: 'Actions',
    icon: '🔧',
    color: '#f59e0b', // Amber
    description: 'Crew performs repairs and other actions'
  },
  round_end: {
    name: 'Round End',
    icon: '⏭️',
    color: '#8b5cf6', // Purple
    description: 'Round complete, preparing next round'
  }
};

const PHASE_SEQUENCE: Phase[] = ['manoeuvre', 'attack', 'actions', 'round_end'];

export default function PhaseDisplay({
  currentPhase,
  currentRound = 1,
  onAdvancePhase,
  compact = false
}: PhaseDisplayProps) {

  const phaseInfo = PHASE_INFO[currentPhase];
  const currentIndex = PHASE_SEQUENCE.indexOf(currentPhase);

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: `${phaseInfo.color}20`,
        border: `2px solid ${phaseInfo.color}`,
        borderRadius: '6px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>{phaseInfo.icon}</span>
        <span style={{ fontWeight: 'bold', color: phaseInfo.color }}>
          {phaseInfo.name}
        </span>
        <span style={{ color: '#888', fontSize: '0.9rem' }}>
          Round {currentRound}
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
          Combat Phase
        </h2>
        <div style={{
          padding: '4px 12px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #444',
          borderRadius: '4px',
          fontSize: '0.9rem',
          color: '#aaa'
        }}>
          Round {currentRound}
        </div>
      </div>

      {/* Current Phase Card */}
      <div style={{
        padding: '20px',
        backgroundColor: `${phaseInfo.color}15`,
        border: `3px solid ${phaseInfo.color}`,
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: `0 0 20px ${phaseInfo.color}40`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '2.5rem' }}>{phaseInfo.icon}</span>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.5rem',
              color: phaseInfo.color
            }}>
              {phaseInfo.name}
            </h3>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '0.9rem',
              color: '#aaa'
            }}>
              {phaseInfo.description}
            </p>
          </div>
        </div>

        {onAdvancePhase && (
          <button
            onClick={onAdvancePhase}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: phaseInfo.color,
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              width: '100%',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Advance Phase ▶
          </button>
        )}
      </div>

      {/* Phase Sequence Tracker */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {PHASE_SEQUENCE.map((phase, index) => {
          const info = PHASE_INFO[phase];
          const isActive = phase === currentPhase;
          const isComplete = index < currentIndex;

          const stepStyle: CSSProperties = {
            flex: 1,
            padding: '12px 8px',
            backgroundColor: isActive ? `${info.color}20` : isComplete ? '#2a2a2a' : '#1a1a1a',
            border: isActive ? `2px solid ${info.color}` : '1px solid #444',
            borderRadius: '8px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            opacity: isComplete ? 0.6 : 1
          };

          return (
            <div key={phase} style={stepStyle}>
              <div style={{
                fontSize: '1.5rem',
                marginBottom: '5px',
                filter: isComplete ? 'grayscale(100%)' : 'none'
              }}>
                {isComplete ? '✓' : info.icon}
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? info.color : isComplete ? '#666' : '#888'
              }}>
                {info.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
