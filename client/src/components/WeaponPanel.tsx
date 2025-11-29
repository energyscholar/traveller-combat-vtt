/**
 * WeaponPanel Component
 *
 * Displays weapon firing controls including turret/target/weapon selection
 * and fire button. Integrates with useWeaponFiring hook.
 */

export interface WeaponPanelProps {
  /** Currently selected turret index */
  selectedTurret: number | null;
  /** Currently selected target */
  selectedTarget: string | null;
  /** Currently selected weapon index */
  selectedWeapon: number | null;
  /** Whether firing is currently allowed */
  canFire: boolean;
  /** Number of turrets available */
  turretCount: number;
  /** Available weapons for selection */
  availableWeapons: Array<{
    id: number;
    name: string;
    damage: string;
  }>;
  /** Callback when turret is selected */
  onSelectTurret: (index: number) => void;
  /** Callback when target is selected */
  onSelectTarget: (target: string) => void;
  /** Callback when weapon is selected */
  onSelectWeapon: (index: number) => void;
  /** Callback when fire button is clicked */
  onFire: () => void;
  /** Callback when use default button is clicked */
  onUseDefault: () => void;
  /** Callback when end turn button is clicked */
  onEndTurn: () => void;
  /** Optional: compact mode for smaller displays */
  compact?: boolean;
}

export default function WeaponPanel({
  selectedTurret,
  selectedTarget,
  selectedWeapon,
  canFire,
  turretCount,
  availableWeapons,
  onSelectTurret,
  onSelectTarget,
  onSelectWeapon,
  onFire,
  onUseDefault,
  onEndTurn,
  compact = false
}: WeaponPanelProps) {
  const handleTurretChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectTurret(parseInt(e.target.value));
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectTarget(e.target.value);
  };

  const handleWeaponChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectWeapon(parseInt(e.target.value));
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#1a1a1a',
        border: '2px solid #333',
        borderRadius: '8px'
      }}>
        {/* Compact controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedTurret ?? ''}
            onChange={handleTurretChange}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Turret...</option>
            {Array.from({ length: turretCount }, (_, i) => (
              <option key={i} value={i}>Turret {i + 1}</option>
            ))}
          </select>

          <select
            value={selectedTarget ?? ''}
            onChange={handleTargetChange}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Target...</option>
            <option value="opponent">Opponent</option>
          </select>

          <select
            value={selectedWeapon ?? ''}
            onChange={handleWeaponChange}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Weapon...</option>
            {availableWeapons.map(weapon => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.name} ({weapon.damage})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onFire}
          disabled={!canFire}
          style={{
            padding: '10px',
            backgroundColor: canFire ? '#dc2626' : '#666',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: canFire ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            opacity: canFire ? 1 : 0.5
          }}
        >
          FIRE!
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#1a1a1a',
      border: '2px solid #333',
      borderRadius: '8px',
      minWidth: '300px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: '#ccc',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid #444',
        paddingBottom: '8px'
      }}>
        Weapon Controls
      </div>

      {/* Turret Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{
          fontSize: '0.85rem',
          color: '#999',
          textTransform: 'uppercase'
        }}>
          Turret:
        </label>
        <select
          value={selectedTurret ?? ''}
          onChange={handleTurretChange}
          style={{
            padding: '10px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="">Select turret...</option>
          {Array.from({ length: turretCount }, (_, i) => (
            <option key={i} value={i}>Turret {i + 1}</option>
          ))}
        </select>
      </div>

      {/* Target Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{
          fontSize: '0.85rem',
          color: '#999',
          textTransform: 'uppercase'
        }}>
          Target:
        </label>
        <select
          value={selectedTarget ?? ''}
          onChange={handleTargetChange}
          style={{
            padding: '10px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="">Select target...</option>
          <option value="opponent">Opponent Ship</option>
        </select>
      </div>

      {/* Weapon Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{
          fontSize: '0.85rem',
          color: '#999',
          textTransform: 'uppercase'
        }}>
          Weapon:
        </label>
        <select
          value={selectedWeapon ?? ''}
          onChange={handleWeaponChange}
          style={{
            padding: '10px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="">Select weapon...</option>
          {availableWeapons.map(weapon => (
            <option key={weapon.id} value={weapon.id}>
              {weapon.name} ({weapon.damage})
            </option>
          ))}
        </select>
      </div>

      {/* Fire Button */}
      <button
        onClick={onFire}
        disabled={!canFire}
        style={{
          padding: '14px 20px',
          backgroundColor: canFire ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : '#666',
          background: canFire ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : '#666',
          border: canFire ? '2px solid #7f1d1d' : '2px solid #444',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          cursor: canFire ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          opacity: canFire ? 1 : 0.5,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
        onMouseEnter={(e) => {
          if (canFire) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        🔥 FIRE!
      </button>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderTop: '1px solid #444',
        paddingTop: '16px'
      }}>
        <button
          onClick={onUseDefault}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#ccc',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3a3a3a';
            e.currentTarget.style.borderColor = '#555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
            e.currentTarget.style.borderColor = '#444';
          }}
        >
          Use Default
        </button>

        <button
          onClick={onEndTurn}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#ccc',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3a3a3a';
            e.currentTarget.style.borderColor = '#555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
            e.currentTarget.style.borderColor = '#444';
          }}
        >
          End Turn
        </button>
      </div>

      {/* Selection Status */}
      {(selectedTurret !== null || selectedTarget !== null || selectedWeapon !== null) && (
        <div style={{
          fontSize: '0.8rem',
          color: '#666',
          textAlign: 'center',
          marginTop: '-8px'
        }}>
          {selectedTurret !== null && `Turret ${selectedTurret + 1}`}
          {selectedTarget !== null && ` → ${selectedTarget}`}
          {selectedWeapon !== null && ` → ${availableWeapons[selectedWeapon]?.name}`}
        </div>
      )}
    </div>
  );
}
