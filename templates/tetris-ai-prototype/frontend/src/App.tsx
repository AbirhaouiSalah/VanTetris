import React, { useState, useEffect } from 'react';
import Tetris from './Tetris';

const App: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Tetris + IA</h1>
      <Tetris />
    </div>
  );
};

export default App;
