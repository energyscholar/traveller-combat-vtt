/**
 * useWeaponFiring Hook
 *
 * Manages weapon firing state and socket.io integration for combat.
 * Handles turret/weapon/target selection and fire button state.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

export interface WeaponOption {
  id: number;
  name: string;
  damage: string;
  type: 'laser' | 'missile' | 'sandcaster';
}

export interface WeaponFiringState {
  /** Currently selected turret index */
  selectedTurret: number | null;
  /** Currently selected target */
  selectedTarget: string | null;
  /** Currently selected weapon index */
  selectedWeapon: number | null;
  /** Whether firing is currently allowed */
  canFire: boolean;
  /** Number of turrets available on this ship */
  turretCount: number;
  /** Available weapons for selection */
  availableWeapons: WeaponOption[];
}

export interface UseWeaponFiringOptions {
  /** Socket.io client instance */
  socket: Socket | null;
  /** Number of turrets on the ship */
  turretCount?: number;
  /** Available weapons */
  weapons?: WeaponOption[];
}

const DEFAULT_WEAPONS: WeaponOption[] = [
  { id: 0, name: 'Pulse Laser', damage: '2d6', type: 'laser' },
  { id: 1, name: 'Sandcaster', damage: 'Defense', type: 'sandcaster' },
  { id: 2, name: 'Missiles', damage: '4d6, 6 shots', type: 'missile' }
];

/**
 * Hook for managing weapon firing via socket.io
 */
export function useWeaponFiring(options: UseWeaponFiringOptions) {
  const {
    socket,
    turretCount = 1,
    weapons = DEFAULT_WEAPONS
  } = options;

  const [state, setState] = useState<WeaponFiringState>({
    selectedTurret: null,
    selectedTarget: null,
    selectedWeapon: null,
    canFire: false,
    turretCount,
    availableWeapons: weapons
  });

  // Update can fire state when selections change
  useEffect(() => {
    const canFire =
      state.selectedTurret !== null &&
      state.selectedTarget !== null &&
      state.selectedWeapon !== null;

    setState(prev => ({ ...prev, canFire }));
  }, [state.selectedTurret, state.selectedTarget, state.selectedWeapon]);

  // Select turret
  const selectTurret = useCallback((turretIndex: number) => {
    setState(prev => ({
      ...prev,
      selectedTurret: turretIndex
    }));
  }, []);

  // Select target
  const selectTarget = useCallback((target: string) => {
    setState(prev => ({
      ...prev,
      selectedTarget: target
    }));
  }, []);

  // Select weapon
  const selectWeapon = useCallback((weaponIndex: number) => {
    setState(prev => ({
      ...prev,
      selectedWeapon: weaponIndex
    }));
  }, []);

  // Fire weapon
  const fire = useCallback(() => {
    if (!socket || !state.canFire) {
      console.warn('[WEAPON] Cannot fire:', {
        hasSocket: !!socket,
        canFire: state.canFire
      });
      return;
    }

    const action = {
      turret: state.selectedTurret!,
      target: state.selectedTarget!,
      weapon: state.selectedWeapon!
    };

    console.log(`[WEAPON] Firing turret ${action.turret} weapon ${action.weapon} at ${action.target}`);

    socket.emit('space:fire', action);

    // Disable firing until next turn
    setState(prev => ({ ...prev, canFire: false }));
  }, [socket, state.canFire, state.selectedTurret, state.selectedTarget, state.selectedWeapon]);

  // Use default action (auto-select and fire)
  const useDefault = useCallback(() => {
    if (!socket) {
      console.warn('[WEAPON] Cannot use default: no socket');
      return;
    }

    // Auto-select first options
    setState(prev => ({
      ...prev,
      selectedTurret: 0,
      selectedTarget: 'opponent',
      selectedWeapon: 0
    }));

    // Fire will be triggered by the canFire effect
    setTimeout(() => {
      const action = {
        turret: 0,
        target: 'opponent',
        weapon: 0
      };
      socket.emit('space:fire', action);
      setState(prev => ({ ...prev, canFire: false }));
    }, 0);
  }, [socket]);

  // End turn
  const endTurn = useCallback(() => {
    if (!socket) {
      console.warn('[WEAPON] Cannot end turn: no socket');
      return;
    }

    console.log('[WEAPON] Ending turn');
    socket.emit('space:endTurn');

    // Disable all actions
    setState(prev => ({ ...prev, canFire: false }));
  }, [socket]);

  // Reset for new turn
  const resetForNewTurn = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTurret: null,
      selectedTarget: null,
      selectedWeapon: null,
      canFire: false
    }));
  }, []);

  // Listen for fire results from server
  useEffect(() => {
    if (!socket) return;

    const handleFireResult = (data: any) => {
      console.log('[WEAPON] Fire result:', data);
    };

    const handleFireError = (error: any) => {
      console.error('[WEAPON] Fire error:', error);
      // Re-enable firing on error
      setState(prev => ({ ...prev, canFire: true }));
    };

    const handleTurnStart = () => {
      console.log('[WEAPON] Turn started, resetting selections');
      resetForNewTurn();
    };

    socket.on('space:fireResult', handleFireResult);
    socket.on('space:fireError', handleFireError);
    socket.on('space:turnStart', handleTurnStart);

    return () => {
      socket.off('space:fireResult', handleFireResult);
      socket.off('space:fireError', handleFireError);
      socket.off('space:turnStart', handleTurnStart);
    };
  }, [socket, resetForNewTurn]);

  return {
    ...state,
    selectTurret,
    selectTarget,
    selectWeapon,
    fire,
    useDefault,
    endTurn,
    resetForNewTurn
  };
}
