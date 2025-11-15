import { BrowserRouter } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import './App.css';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="app-container">
          <h1>🚀 React Migration - Step 2 Complete</h1>
          <p>Infrastructure ready: GameContext + Socket.IO hook created.</p>
          <p>Next: Main Menu component (Step 3)</p>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
