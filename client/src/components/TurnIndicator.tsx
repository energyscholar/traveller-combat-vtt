import { useGame } from '../context/GameContext';

export default function TurnIndicator() {
  const { gameState } = useGame();

  const isMyTurn = gameState.currentTurn === gameState.playerShip;
  const gameStarted = (gameState.currentRound ?? 0) > 0;

  // Determine state
  let state: 'waiting' | 'your-turn' | 'opponent-turn' = 'waiting';
  let turnStatus = '⏳ Waiting for game to start...';
  let roundDisplay = 'Click "Start Game" when both players are connected';

  if (gameStarted) {
    if (isMyTurn) {
      state = 'your-turn';
      turnStatus = '✅ YOUR TURN';
      roundDisplay = `Round ${gameState.currentRound}`;
    } else {
      state = 'opponent-turn';
      const opponentShip = gameState.playerShip === 'scout' ? 'Corsair' : 'Scout';
      turnStatus = `⏸️ ${opponentShip?.toUpperCase()}'S TURN`;
      roundDisplay = `Round ${gameState.currentRound} - Waiting...`;
    }
  }

  // Map state to colors
  const stateColors = {
    'waiting': {
      bg: 'rgba(255, 165, 0, 0.2)',
      border: '#ffa500',
    },
    'your-turn': {
      bg: 'rgba(0, 255, 0, 0.2)',
      border: '#00ff00',
    },
    'opponent-turn': {
      bg: 'rgba(255, 107, 107, 0.2)',
      border: '#ff6b6b',
    },
  };

  const colors = stateColors[state];

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        border: `2px solid ${colors.border}`,
        backgroundColor: colors.bg,
        transition: 'all 0.3s',
        ...(state === 'your-turn' && {
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
          animation: 'pulse-green 2s infinite',
        }),
      }}
    >
      {/* Turn Status */}
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {turnStatus}
      </div>

      {/* Round Display */}
      <div
        style={{
          fontSize: '16px',
          marginTop: '8px',
          opacity: 0.9,
        }}
      >
        {roundDisplay}
      </div>

      {/* CSS animation for pulse effect */}
      {state === 'your-turn' && (
        <style>{`
          @keyframes pulse-green {
            0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.3); }
            50% { box-shadow: 0 0 30px rgba(0, 255, 0, 0.6); }
          }
        `}</style>
      )}
    </div>
  );
}
