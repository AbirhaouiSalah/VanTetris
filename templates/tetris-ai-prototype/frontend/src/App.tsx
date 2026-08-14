import React from 'react';
 
// Après (correction explicite) :
import Tetris from './Tetris.tsx';  // <-- Ajoutez l'extension .tsx
const App: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Tetris + IA</h1>
      <Tetris />
    </div>
  );
};

export default App;