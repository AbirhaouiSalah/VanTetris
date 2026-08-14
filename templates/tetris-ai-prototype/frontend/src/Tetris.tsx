import React, { useState, useEffect, useCallback } from 'react';

// Types
type Piece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

type Board = (string | null)[][];

// Constants
const SHAPES = [
  { shape: [[1, 1, 1, 1]], color: 'cyan', type: 'I' },
  { shape: [[1, 1], [1, 1]], color: 'yellow', type: 'O' },
  { shape: [[1, 1, 1], [0, 1, 0]], color: 'purple', type: 'T' },
  { shape: [[1, 1, 1], [1, 0, 0]], color: 'blue', type: 'L' },
  { shape: [[1, 1, 1], [0, 0, 1]], color: 'orange', type: 'J' },
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'green', type: 'S' },
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'red', type: 'Z' },
];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const Tetris: React.FC = () => {
  // State
  const [board, setBoard] = useState<Board>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [suggestedMove, setSuggestedMove] = useState<{ x: number; y: number; rotation: number } | null>(null);
  const [aiThinking, setAiThinking] = useState<boolean>(false);

  // Helper functions
  const newPiece = useCallback((): Piece => {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
      ...randomShape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randomShape.shape[0].length / 2),
      y: 0,
    };
  }, []);

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

  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i])).reverse();
    return { ...piece, shape: rotated };
  }, []);

  const placePiece = useCallback((piece: Piece, board: Board): Board => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((board: Board): { newBoard: Board; linesCleared: number } => {
    const newBoard = board.filter(row => row.some(cell => cell === null));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    const filledLines = Array(linesCleared).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    return { newBoard: [...filledLines, ...newBoard], linesCleared };
  }, []);

  // Movement functions
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || gameOver) return;
    
    const newPieceObj = { ...currentPiece };
    switch (direction) {
      case 'left':
        newPieceObj.x -= 1;
        break;
      case 'right':
        newPieceObj.x += 1;
        break;
      case 'down':
        newPieceObj.y += 1;
        break;
    }
    
    if (!checkCollision(newPieceObj, board)) {
      setCurrentPiece(newPieceObj);
    } else if (direction === 'down') {
      // Lock piece in place
      const newBoard = placePiece(currentPiece, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      setBoard(clearedBoard);
      setScore(prev => prev + linesCleared * 100);
      
      // Spawn next piece
      const next = nextPiece || newPiece();
      setCurrentPiece(next);
      setNextPiece(newPiece());
      
      // Check game over
      if (checkCollision(next, clearedBoard)) {
        setGameOver(true);
      }
    }
  }, [currentPiece, board, nextPiece, gameOver, checkCollision, placePiece, clearLines, newPiece]);

  const handleRotate = useCallback(() => {
    if (!currentPiece || gameOver) return;
    const rotatedPiece = rotatePiece(currentPiece);
    if (!checkCollision(rotatedPiece, board)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, board, gameOver, rotatePiece, checkCollision]);

  // AI Suggestion
  const fetchAISuggestion = useCallback(async () => {
    if (!currentPiece || aiThinking) return;
    
    setAiThinking(true);
    try {
      const pieceTypeMap: Record<string, string> = {
        'cyan': 'I',
        'yellow': 'O',
        'purple': 'T',
        'blue': 'L',
        'orange': 'J',
        'green': 'S',
        'red': 'Z',
      };

      const response = await fetch('http://localhost:5000/api/next-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: board,
          piece: pieceTypeMap[currentPiece.color] || 'T',
        }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setSuggestedMove({
          x: data.recommended_move.x,
          y: data.recommended_move.y || 0,
          rotation: data.recommended_move.rotation || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
    } finally {
      setAiThinking(false);
    }
  }, [board, currentPiece, aiThinking]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      movePiece('down');
    }, 500);
    return () => clearInterval(interval);
  }, [movePiece, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece('down');
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleRotate();
          break;
        case ' ':
          e.preventDefault();
          fetchAISuggestion();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, handleRotate, fetchAISuggestion, gameOver]);

  // Initialize game
  useEffect(() => {
    const initialPiece = newPiece();
    setCurrentPiece(initialPiece);
    setNextPiece(newPiece());
  }, [newPiece]);

  // Rendering functions
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

  const renderCurrentPiece = () => {
    if (!currentPiece) return null;
    return (
      <div 
        style={{ 
          position: 'absolute', 
          top: currentPiece.y * 25, 
          left: currentPiece.x * 25 
        }}
      >
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

  const renderSuggestion = () => {
    if (!suggestedMove || !currentPiece) return null;
    const piece = { ...currentPiece, x: suggestedMove.x, y: suggestedMove.y };
    return (
      <div 
        style={{ 
          position: 'absolute', 
          top: piece.y * 25, 
          left: piece.x * 25, 
          opacity: 0.5 
        }}
      >
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1>🎮 Tetris AI</h1>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div style={{ width: '250px', height: '500px', border: '2px solid #333', position: 'relative', background: '#1a1a1a' }}>
          {renderBoard()}
          {renderCurrentPiece()}
          {renderSuggestion()}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Score: {score}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Restart
        </button>
        <button 
          onClick={fetchAISuggestion}
          disabled={aiThinking}
          style={{ 
            padding: '8px 16px', 
            cursor: aiThinking ? 'not-allowed' : 'pointer',
            opacity: aiThinking ? 0.5 : 1
          }}
        >
          {aiThinking ? 'Thinking...' : '🤖 AI Suggestion'}
        </button>
      </div>
      {gameOver && (
        <h2 style={{ color: 'red' }}>💀 Game Over!</h2>
      )}
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Controls: Arrow keys to move, Space for AI suggestion
      </div>
    </div>
  );
};

export default Tetris;