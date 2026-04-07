'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';

// --- Cấu hình Tetris ---
const COLS = 10;
const ROWS = 20;
const INITIAL_SPEED = 800;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-400' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-400' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
};

export function Entertainment() {
  const [grid, setGrid] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [activePiece, setActivePiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Tạo quân mới
  const spawnPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOS);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOS[type as keyof typeof TETROMINOS];
    setActivePiece(piece);
    setPos({ x: 3, y: 0 });

    if (checkCollision(3, 0, piece.shape)) {
      setGameOver(true);
    }
  }, [grid]);

  // Kiểm tra va chạm
  const checkCollision = (nx: number, ny: number, shape: number[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = nx + c;
          const newY = ny + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX] !== 0)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Hợp nhất quân vào lưới
  const mergePiece = () => {
    const newGrid = grid.map(row => [...row]);
    activePiece.shape.forEach((row: number[], r: number) => {
      row.forEach((value, c) => {
        if (value !== 0) {
          if (pos.y + r >= 0) newGrid[pos.y + r][pos.x + c] = activePiece.color;
        }
      });
    });

    // Xóa hàng đầy
    let linesCleared = 0;
    const filteredGrid = newGrid.filter(row => {
      if (row.every(cell => cell !== 0)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(0));
    }

    setGrid(filteredGrid);
    setScore(s => s + linesCleared * 100);
    spawnPiece();
  };

  const move = (dx: number, dy: number) => {
    if (!checkCollision(pos.x + dx, pos.y + dy, activePiece.shape)) {
      setPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dy > 0) {
      mergePiece();
    }
  };

  // Logic Game Loop
  useEffect(() => {
    if (!activePiece && !gameOver) spawnPiece();
    const dropInterval = setInterval(() => {
      if (!gameOver) move(0, 1);
    }, INITIAL_SPEED);
    return () => clearInterval(dropInterval);
  }, [activePiece, pos, gameOver, spawnPiece]);

  // Điều khiển phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') move(-1, 0);
      if (e.key === 'ArrowRight') move(1, 0);
      if (e.key === 'ArrowDown') move(0, 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pos, activePiece, gameOver]);

  const resetGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setGameOver(false);
    setScore(0);
    setActivePiece(null);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tetris Zone</h2>
          <p className="text-gray-500">Xả stress sau giờ học!</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-mono shadow-lg">
          SCORE: {score}
        </div>
      </div>

      <Card className="p-4 bg-slate-900 shadow-2xl border-4 border-slate-700 relative flex justify-center items-center overflow-hidden">
        {/* Lưới Game */}
        <div 
          className="grid gap-px bg-slate-800 border border-slate-700"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1.5rem)` }}
        >
          {grid.map((row, y) => 
            row.map((cell, x) => {
              // Kiểm tra xem ô này có thuộc quân đang rơi không
              let activeColor = '';
              if (activePiece) {
                const r = y - pos.y;
                const c = x - pos.x;
                if (r >= 0 && r < activePiece.shape.length && c >= 0 && c < activePiece.shape[0].length) {
                  if (activePiece.shape[r][c]) activeColor = activePiece.color;
                }
              }

              return (
                <div 
                  key={`${x}-${y}`} 
                  className={`w-6 h-6 rounded-sm ${activeColor || cell || 'bg-slate-900'}`} 
                />
              );
            })
          )}
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm">
            <h3 className="text-4xl font-black mb-4 text-red-500">GAME OVER</h3>
            <p className="mb-6 text-slate-300">Bạn đã đạt được {score} điểm!</p>
            <button 
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold transition-all transform hover:scale-110"
            >
              Chơi lại
            </button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2">
         <button onClick={() => move(-1, 0)} className="bg-slate-200 p-4 rounded-xl active:bg-slate-300 transition-colors text-2xl">←</button>
         <button onClick={() => move(0, 1)} className="bg-slate-200 p-4 rounded-xl active:bg-slate-300 transition-colors text-2xl">↓</button>
         <button onClick={() => move(1, 0)} className="bg-slate-200 p-4 rounded-xl active:bg-slate-300 transition-colors text-2xl">→</button>
      </div>
      
      <p className="text-center text-sm text-gray-400">Dùng các phím mũi tên hoặc nút trên màn hình để điều khiển</p>
    </div>
  );
}