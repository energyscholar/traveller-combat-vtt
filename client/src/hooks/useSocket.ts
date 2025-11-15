import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGame } from '../context/GameContext';

export function useSocket() {
  const { updateGameState, addLogEntry } = useGame();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to server
    socketRef.current = io('http://localhost:3000');
    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      updateGameState({ connected: true, socketId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      updateGameState({ connected: false });
    });

    // Game events
    socket.on('welcome', (data) => {
      console.log('[Socket] Welcome:', data);
      updateGameState({
        playerId: data.playerId,
        playerNumber: data.playerId,
        playerShip: data.assignedShip,
      });
    });

    socket.on('space:autoAssigned', (data) => {
      console.log('[Socket] Auto-assigned:', data);
      updateGameState({
        playerShip: data.ship,
        mode: data.mode,
      });
    });

    socket.on('space:combatStart', (data) => {
      console.log('[Socket] Combat started:', data);
      updateGameState({ combat: data });
      addLogEntry('Combat started!', 'info');
    });

    socket.on('space:turnChange', (data) => {
      console.log('[Socket] Turn change:', data);
      updateGameState({ currentTurn: data.activePlayer });
      addLogEntry(`Turn ${data.turn}: Player ${data.activePlayer}'s turn`, 'info');
    });

    socket.on('space:combatUpdate', (data) => {
      console.log('[Socket] Combat update:', data);
      updateGameState({ combat: data.combat });
      if (data.log && Array.isArray(data.log)) {
        data.log.forEach((msg: string) => addLogEntry(msg, 'success'));
      }
    });

    socket.on('space:combatEnd', (data) => {
      console.log('[Socket] Combat ended:', data);
      addLogEntry(`Combat ended! Winner: Player ${data.winner}`, 'success');
    });

    socket.on('space:rangeSelected', (data) => {
      console.log('[Socket] Range selected:', data);
      updateGameState({ selectedRange: data.range });
    });

    socket.on('space:playerReady', (data) => {
      console.log('[Socket] Player ready:', data);
    });

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up connection');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('welcome');
      socket.off('space:autoAssigned');
      socket.off('space:combatStart');
      socket.off('space:turnChange');
      socket.off('space:combatUpdate');
      socket.off('space:combatEnd');
      socket.off('space:rangeSelected');
      socket.off('space:playerReady');
      socket.disconnect();
    };
  }, [updateGameState, addLogEntry]);

  return socketRef.current;
}
