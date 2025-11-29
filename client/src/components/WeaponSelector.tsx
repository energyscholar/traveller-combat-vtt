import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

interface Weapon {
  id: string;
  name: string;
  damage: string;
  ammo: number | null;
}

interface WeaponSelectorProps {
  onWeaponChange?: (weaponId: string) => void;
}

const WEAPONS_BY_SHIP: Record<string, Weapon[]> = {
  scout: [
    { id: 'pulseLaser', name: 'Pulse Laser', damage: '2d6', ammo: null },
    { id: 'missiles', name: 'Missiles', damage: '4d6', ammo: 6 },
  ],
  corsair: [
    { id: 'beamLaser', name: 'Beam Laser', damage: '3d6', ammo: null },
    { id: 'missiles', name: 'Missiles', damage: '4d6', ammo: 6 },
  ],
};

export default function WeaponSelector({ onWeaponChange }: WeaponSelectorProps) {
  const { gameState } = useGame();
  const [selectedWeapon, setSelectedWeapon] = useState('');

  // Get weapons for player's ship
  const playerShip = gameState.playerShip || '';
  const availableWeapons = WEAPONS_BY_SHIP[playerShip] || [];

  // Auto-select first weapon when ship changes
  useEffect(() => {
    if (availableWeapons.length > 0 && !selectedWeapon) {
      const firstWeaponId = availableWeapons[0].id;
      setSelectedWeapon(firstWeaponId);
      if (onWeaponChange) {
        onWeaponChange(firstWeaponId);
      }
    }
  }, [playerShip, availableWeapons, selectedWeapon, onWeaponChange]);

  const handleWeaponChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const weaponId = event.target.value;
    setSelectedWeapon(weaponId);
    if (onWeaponChange) {
      onWeaponChange(weaponId);
    }
  };

  const formatWeaponDisplay = (weapon: Weapon): string => {
    const ammoText = weapon.ammo ? ` (${weapon.ammo} shots)` : ' (Unlimited)';
    return `${weapon.name} ${weapon.damage}${ammoText}`;
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label
        htmlFor="weapon-select"
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#fff',
        }}
      >
        Weapon:
      </label>
      <select
        id="weapon-select"
        value={selectedWeapon}
        onChange={handleWeaponChange}
        disabled={availableWeapons.length === 0}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          borderRadius: '4px',
          border: '1px solid #444',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        {availableWeapons.length === 0 && (
          <option value="">No weapons available</option>
        )}
        {availableWeapons.map((weapon) => (
          <option key={weapon.id} value={weapon.id}>
            {formatWeaponDisplay(weapon)}
          </option>
        ))}
      </select>
    </div>
  );
}
