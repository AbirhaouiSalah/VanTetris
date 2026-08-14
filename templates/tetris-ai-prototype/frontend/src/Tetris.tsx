import React, { useState, useEffect, useCallback } from 'react';

// Types
type Piece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

type Board = (string | null)[][];

const SHAPES = [
  { shape: [[1, 1, 1, 1]], color: 'cyan' },    // I
  { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O
  { shape: [[1, 1, 1], [0, 1, 0]], color: 'purple' }, // T
  { shape: [[1, 1, 1], [1, 0, 0]], color: 'blue' },  // L
  { shape: [[1, 1, 1], [0, 0, 1]], color: 'orange' }, // J
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },  // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },    // Z
];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const Tetris: React.FC = () => {
  const [board, setBoard] = useState<Board>(Array(BOARD_HEIGHT).fill(Array(BOARD_WIDTH).fill(null)));
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [suggestedMove, setSuggestedMove] = useState<{ x: number; y: number; rotation: number } | null>(null);

  // Initialiser les piÃ¨ces
  const newPiece = useCallback((): Piece => {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
      ...randomShape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randomShape.shape[0].length / 2),
      y: 0,
    };
  }, []);

  // VÃ©rifier les collisions
  const checkCollision = useCallback((piece: Piece, board: Board): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Faire tourner la piÃ¨ce
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i])).reverse();
    return { ...piece, shape: rotated };
  }, []);

  // Placer la piÃ¨ce sur le plateau
  const placePiece = useCallback((piece: Piece, board: Board): Board => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    return newBoard;
  }, []);

  // VÃ©rifier les lignes complÃ¨tes
  const clearLines = useCallback((board: Board): { newBoard: Board; linesCleared: number } => {
    const newBoard = board.filter(row => row.some(cell => cell === null));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    const filledLines = Array(linesCleared).fill(Array(BOARD_WIDTH).fill(null));
    return { newBoard: [...filledLines, ...newBoard], linesCleared };
  }, []);

  // DÃ©placer la piÃ¨ce
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece) return;
    const newPiece = { ...currentPiece };
    switch (direction) {
      case 'left':
        newPiece.x -= 1;
        break;
      case 'right':
        newPiece.x += 1;
        break;
      case 'down':
        newPiece.y += 1;
        break;
    }
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else if (direction === 'down') {
      const newBoard = placePiece(currentPiece, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      setBoard(clearedBoard);
      setScore(prev => prev + linesCleared * 100);
      setCurrentPiece(nextPiece);
      setNextPiece(newPiece());
      if (checkCollision(newPiece(), clearedBoard)) {
        setGameOver(true);
      }
    }
  }, [currentPiece, board, nextPiece, checkCollision, placePiece, clearLines]);

  // Faire tourner la piÃ¨ce
  const handleRotate = useCallback(() => {
    if (!currentPiece) return;
    const rotatedPiece = rotatePiece(currentPiece);
    if (!checkCollision(rotatedPiece, board)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, board, rotatePiece, checkCollision]);

  // DÃ©placer la piÃ¨ce vers le bas automatiquement
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      movePiece('down');
    }, 500);
    return () => clearInterval(interval);
  }, [movePiece, gameOver]);

  // RÃ©cupÃ©rer les suggestions de l'IA
  const fetchAISuggestion = useCallback(async () => {
    if (!currentPiece) return;
    try {
      const response = await fetch('http://localhost:5000/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: board,
          piece: currentPiece,
        }),
      });
      const data = await response.json();
      setSuggestedMove(data);
    } catch (error) {
      console.error('Erreur lors de la rÃ©cupÃ©ration de la suggestion IA:', error);
    }
  }, [board, currentPiece]);

  // Initialiser le jeu
  useEffect(() => {
    setCurrentPiece(newPiece());
    setNextPiece(newPiece());
  }, []);

  // GÃ©rer les touches du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          break;
        case 'ArrowRight':
          movePiece('right');
          break;
        case 'ArrowDown':
          movePiece('down');
          break;
        case 'ArrowUp':
          handleRotate();
          break;
        case ' ':
          fetchAISuggestion();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, handleRotate, fetchAISuggestion, gameOver]);

  // Rendu du plateau
  const renderBoard = () => {
    return board.map((row, y) => (
      <div key={y} style={{ display: 'flex' }}>
        {row.map((cell, x) => (
          <div
            key={x}
            style={{
              width: '25px',
              height: '25px',
              backgroundColor: cell || 'black',
              border: '1px solid #333',
              boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
    ));
  };

  // Rendu de la piÃ¨ce actuelle
  const renderCurrentPiece = () => {
    if (!currentPiece) return null;
    return (
      <div style={{ position: 'absolute', top: ${currentPiece.y * 25}px, left: ${currentPiece.x * 25}px }}>
        {currentPiece.shape.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              cell !== 0 ? (
                <div
                  key={x}
                  style={{
                    width: '25px',
                    height: '25px',
                    backgroundColor: currentPiece.color,
                    border: '1px solid #333',
                    boxSizing: 'border-box',
                  }}
                />
              ) : null
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Rendu de la suggestion de l'IA
  const renderSuggestion = () => {
    if (!suggestedMove || !currentPiece) return null;
    const piece = { ...currentPiece, x: suggestedMove.x, y: suggestedMove.y };
    return (
      <div style={{ position: 'absolute', top: ${piece.y * 25}px, left: ${piece.x * 25}px, opacity: 0.5 }}>
        {piece.shape.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              cell !== 0 ? (
                <div
                  key={x}
                  style={{
                    width: '25px',
                    height: '25px',
                    backgroundColor: 'white',
                    border: '1px dashed #fff',
                    boxSizing: 'border-box',
                  }}
                />
              ) : null
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div style={{ width: '250px', height: '500px', border: '2px solid #333' }}>
          {renderBoard()}
          {renderCurrentPiece()}
          {renderSuggestion()}
        </div>
      </div>
      <div>
        <p>Score: {score}</p>
        <button onClick={() => window.location.reload()}>RedÃ©marrer</button>
        <button onClick={fetchAISuggestion}>Demander une suggestion IA</button>
      </div>
      {gameOver && <h2>Game Over!</h2>}
    </div>
  );
};

export default Tetris;
