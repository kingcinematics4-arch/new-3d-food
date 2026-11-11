'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, X, Circle, Zap, RotateCcw, Loader2, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from 'lucide-react';

const GOLD = '#B8A47A';
const CHARCOAL = '#0B0B0A';
const SURFACE = '#171613';
const SURFACE_2 = '#1D1B17';
const CREAM = '#F3EFE7';
const MUTED = '#6B675F';

export default function GamePage({ params }: { params: { game: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug') || null;
  const table = searchParams.get('table') || null;
  const gameId = params.game;

  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}` : '/menu';

  const GAME_COMPONENTS: Record<string, JSX.Element> = {
    'tic-tac-toe': <TicTacToe />,
    '2048': <Game2048 />,
    'memory-match': <MemoryMatch />,
    snake: <Snake />,
  };

  const GameComponent = GAME_COMPONENTS[gameId];

  if (!GameComponent) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: CHARCOAL, color: CREAM }}>
        <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href={menuHref} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">
              <ArrowLeft size="14" strokeWidth="1.5" stroke="white" />
              <span>Back to Menu</span>
            </a>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
          <p className="text-white/50">Game not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CHARCOAL, color: CREAM, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href={menuHref} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">
            <ArrowLeft size="14" strokeWidth="1.5" stroke="white" />
            <span>Back to Menu</span>
          </a>
          <button
            onClick={() => router.push(slug ? `/games/${gameId}?slug=${encodeURIComponent(slug)}&table=${encodeURIComponent(table || '')}` : `/games/${gameId}`)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors"
          >
            <RotateCcw size="14" strokeWidth="1.5" stroke="white" />
            <span>Restart</span>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12 flex-1">
        {GameComponent}
      </main>

      <footer className="border-t border-white/10 bg-black/80 px-6 py-6 text-center">
        <p className="text-[0.55rem] text-white/40 tracking-wider uppercase">
          DinePixel Games &bull; For entertainment while you dine{slug ? ` &bull; Table ${table || '—'}` : ''}
        </p>
      </footer>
    </div>
  );
}

/* ============================================
   GAME 1: TIC-TAC-TOE
   ============================================ */

function TicTacToe() {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const handleCellClick = useCallback((index: number) => {
    if (winner || board[index]) return;
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const win = WINNING_LINES.find(line => line.every(i => newBoard[i] === currentPlayer));
    if (win) {
      setWinner(currentPlayer);
      setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
    } else if (newBoard.every(cell => cell !== '')) {
      setWinner('draw');
    } else {
      setCurrentPlayer(prev => (prev === 'X' ? 'O' : 'X'));
    }
  }, [board, currentPlayer, winner]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setWinner(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="text-xs text-white/40 uppercase tracking-wider">Tic-Tac-Toe</span>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-xs font-bold ${currentPlayer === 'X' ? 'text-white bg-white/20' : 'text-white/50'}`}>X</div>
            <span className="text-white/50 text-xs">vs</span>
            <div className={`px-2 py-1 rounded text-xs font-bold ${currentPlayer === 'O' ? 'text-white bg-white/20' : 'text-white/50'}`}>O</div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-white">{scores.X}</span>
            <span className="text-xs text-white/50">-</span>
            <span className="text-sm font-medium text-white">{scores.O}</span>
          </div>
        </div>
      </div>

      {winner && (
        <div className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className={`text-xs font-bold ${winner === 'draw' ? 'text-white/70' : 'text-dine-gold'}`}>
            {winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 w-full max-w-xs aspect-square mx-auto">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className="aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-2xl font-bold transition-colors hover:bg-white/10"
            style={{ color: cell === 'X' ? '#EF4444' : cell === 'O' ? '#3B82F6' : 'inherit' }}
          >
            {cell || <span className="text-white/10">·</span>}
          </button>
        ))}
      </div>

      <button
        onClick={resetGame}
        className="w-full py-2 rounded border border-white/10 bg-white/5 text-[0.65rem] font-medium text-white/80 uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
      >
        <RotateCcw size="14" strokeWidth="1.5" /> New Game
      </button>
    </div>
  );
}

/* ============================================
   GAME 2: 2048
   ============================================ */

function Game2048() {
  const [grid, setGrid] = useState<number[][]>(initGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const bestRef = useRef(best);

  useEffect(() => {
    const stored = localStorage.getItem('dine2048_best');
    if (stored) setBest(parseInt(stored, 10));
  }, []);

  function initGrid(): number[][] {
    const g = Array.from({ length: 4 }, () => Array(4).fill(0));
    return addRandom(addRandom(g));
  }

  function addRandom(g: number[][]): number[][] {
    const copy = g.map(row => [...row]);
    const empties: [number, number][] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (copy[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) return copy;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    copy[r][c] = Math.random() < 0.9 ? 2 : 4;
    return copy;
  }

  function compress(row: number[]): number[] {
    const filtered = row.filter(v => v !== 0);
    const result: number[] = [];
    let skipped = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1] && skipped !== i) {
        result.push(filtered[i] * 2);
        setScore(s => s + filtered[i] * 2);
        skipped = i + 1;
        i++;
      } else {
        result.push(filtered[i]);
      }
    }
    while (result.length < 4) result.push(0);
    return result;
  }

  function rotate(g: number[][]): number[][] {
    return g[0].map((_, i) => g.map(row => row[i]).reverse());
  }

  function move(dir: 'up' | 'down' | 'left' | 'right') {
    if (gameOver) return;
    let g = grid;
    const rotations = dir === 'left' ? 0 : dir === 'up' ? 1 : dir === 'right' ? 2 : 3;
    for (let i = 0; i < rotations; i++) g = rotate(g);
    const before = JSON.stringify(g);
    g = g.map(row => compress(row));
    if (JSON.stringify(g) !== before) {
      g = addRandom(g);
      for (let i = 0; i < 4 - rotations; i++) g = rotate(g);
      setGrid(g);
      if (isGameOver(g)) setGameOver(true);
      if (score > bestRef.current) {
        bestRef.current = score;
        setBest(score);
        localStorage.setItem('dine2048_best', String(score));
      }
    }
  }

  function isGameOver(g: number[][]): boolean {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) return false;
        if (c < 3 && g[r][c] === g[r][c + 1]) return false;
        if (r < 3 && g[r][c] === g[r + 1][c]) return false;
      }
    }
    return true;
  }

  const cellColor = (v: number): string => {
    const colors: Record<number, string> = {
      2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
      32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
      512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
    };
    return colors[v] || '#cdc1b4';
  };

  const cellTextColor = (v: number): string => (v > 4 ? '#776e65' : '#f9f6f2');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); move('up'); break;
        case 'ArrowDown': e.preventDefault(); move('down'); break;
        case 'ArrowLeft': e.preventDefault(); move('left'); break;
        case 'ArrowRight': e.preventDefault(); move('right'); break;
      }
    };
    let touchStartX = 0, touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (gameOver) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        dx > 0 ? move('right') : move('left');
      } else {
        dy > 0 ? move('down') : move('up');
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [gameOver, move]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="text-xs text-white/40 uppercase tracking-wider">2048</span>
          <div className="flex gap-3">
            <ScorePill label="Score" value={score} color="text-white" />
            <ScorePill label="Best" value={best} color="text-dine-gold" />
          </div>
        </div>
        {gameOver && (
          <span className="text-xs font-bold text-dine-gold">Game Over</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 w-full max-w-xs aspect-square mx-auto p-1 bg-[#bbada0] rounded-xl">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="aspect-square rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-100"
              style={{
                backgroundColor: cell === 0 ? 'rgba(238, 228, 218, 0.35)' : cellColor(cell),
                color: cellTextColor(cell),
              }}
            >
              {cell === 0 ? '' : cell}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setGrid(initGrid());
            setScore(0);
            setGameOver(false);
          }}
          className="flex-1 py-2 rounded border border-white/10 bg-white/5 text-[0.65rem] font-medium text-white/80 uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw size="14" strokeWidth="1.5" /> New Game
        </button>
      </div>

      <div className="text-xs text-white/40 text-center">
        Use arrow keys or swipe to move tiles
      </div>
    </div>
  );
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.55rem] text-white/50 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

/* ============================================
   GAME 3: MEMORY MATCH
   ============================================ */

function MemoryMatch() {
  const symbols = ['🍕', '🍔', '🍣', '🌮', '🍜', '🍩', '🍦', '🥤', '🍎', '🍇', '🍉', '🍒'];
  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5).map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false }));
    setCards(deck);
    setMoves(0);
    setMatched([]);
    setFlipped([]);
    setGameWon(false);
    setStartTime(Date.now());
  }, []);

  const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

  const handleCard = (id: number) => {
    if (gameWon || matched.includes(id) || flipped.includes(id) || flipped.length >= 2) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (cards[a].symbol === cards[b].symbol) {
        setMatched(m => [...m, a, b]);
        setFlipped([]);
        if (matched.length + 2 === cards.length) {
          setGameWon(true);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 800);
      }
    }
  };

  const restart = () => {
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5).map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false }));
    setCards(deck);
    setMoves(0);
    setMatched([]);
    setFlipped([]);
    setGameWon(false);
    setStartTime(Date.now());
  };

  const cols = 4;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="text-xs text-white/40 uppercase tracking-wider">Memory Match</span>
          <div className="flex gap-3">
            <div className="flex flex-col">
              <span className="text-[0.55rem] text-white/50 uppercase tracking-wider">Moves</span>
              <span className="text-sm font-medium text-white">{moves}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.55rem] text-white/50 uppercase tracking-wider">Time</span>
              <span className="text-sm font-medium text-white">{elapsed}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-${cols} gap-2 w-full max-w-xs aspect-square mx-auto`}>
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleCard(card.id)}
              className="aspect-square rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: isFlipped ? 'white' : SURFACE_2,
                border: `1px ${isFlipped ? 'solid transparent' : 'solid rgba(255,255,255,0.15)'}`,
                color: isFlipped ? CHARCOAL : 'transparent',
              }}
            >
              {isFlipped ? card.symbol : <span className="text-white/20">?</span>}
            </button>
          );
        })}
      </div>

      {gameWon && (
        <div className="flex items-center justify-center gap-2 px-2 py-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs font-bold text-dine-gold">You matched all pairs in {moves} moves!</span>
        </div>
      )}

      <button
        onClick={restart}
        className="w-full py-2 rounded border border-white/10 bg-white/5 text-[0.65rem] font-medium text-white/80 uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
      >
        <RotateCcw size="14" strokeWidth="1.5" /> New Game
      </button>
    </div>
  );
}

/* ============================================
   GAME 4: SNAKE
   ============================================ */

function Snake() {
  const [snake, setSnake] = useState<[number, number][]>([[5, 5], [5, 4], [5, 3]]);
  const [food, setFood] = useState<[number, number]>([10, 10]);
  const [direction, setDirection] = useState<[number, number]>([0, 1]);
  const [nextDirection, setNextDirection] = useState<[number, number]>([0, 1]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(150);
  const timerRef = useRef<number | null>(null);
  const gridSize = 16;

  const placeFood = useCallback((): [number, number] => {
    let pos: [number, number];
    do {
      pos = [Math.floor(Math.random() * gridSize), Math.floor(Math.random() * gridSize)];
    } while (snake.some(s => s[0] === pos[0] && s[1] === pos[1]));
    return pos;
  }, [snake]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSnake([[5, 5], [5, 4], [5, 3]]);
    setFood(placeFood());
    setDirection([0, 1]);
    setNextDirection([0, 1]);
    setScore(0);
    setGameOver(false);
    setSpeed(150);
    timerRef.current = window.setInterval(tick, 150);
  }, [placeFood]);

  useEffect(() => {
    startGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const tick = useCallback(() => {
    if (gameOver) return;
    setDirection(nextDirection);
    const [dx, dy] = direction;
    const head = snake[0];
    const newHead: [number, number] = [(head[0] + dx + gridSize) % gridSize, (head[1] + dy + gridSize) % gridSize];

    if (snake.some(s => s[0] === newHead[0] && s[1] === newHead[1])) {
      setGameOver(true);
      return;
    }

    const newSnake = [newHead, ...snake];
    if (newHead[0] === food[0] && newHead[1] === food[1]) {
      setScore(s => s + 1);
      setFood(placeFood());
    } else {
      newSnake.pop();
    }
    setSnake(newSnake);
  }, [snake, food, direction, gameOver, gridSize, placeFood, score]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!gameOver) timerRef.current = window.setInterval(tick, speed);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tick, speed, gameOver]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    const [cx, cy] = nextDirection;
    switch (e.key) {
      case 'ArrowUp': if (cy === 0) setNextDirection([0, -1]); break;
      case 'ArrowDown': if (cy === 0) setNextDirection([0, 1]); break;
      case 'ArrowLeft': if (cx === 0) setNextDirection([-1, 0]); break;
      case 'ArrowRight': if (cx === 0) setNextDirection([1, 0]); break;
    }
  }, [nextDirection, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const touchStart = useRef({ x: 0, y: 0 });
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (gameOver) return;
    const [cx, cy] = nextDirection;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && cx === 0) setNextDirection([1, 0]);
      if (dx < 0 && cx === 0) setNextDirection([-1, 0]);
    } else {
      if (dy > 0 && cy === 0) setNextDirection([0, 1]);
      if (dy < 0 && cy === 0) setNextDirection([0, -1]);
    }
  }, [nextDirection, gameOver]);

  const restart = useCallback(() => {
    startGame();
  }, [startGame]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="text-xs text-white/40 uppercase tracking-wider">Snake</span>
          <div className="flex gap-3">
            <div className="flex flex-col">
              <span className="text-[0.55rem] text-white/50 uppercase tracking-wider">Score</span>
              <span className="text-sm font-medium text-white">{score}</span>
            </div>
          </div>
        </div>
        {gameOver && (
          <span className="text-xs font-bold text-dine-gold">Game Over</span>
        )}
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex items-center justify-center"
      >
        <div className="grid grid-cols-${gridSize} gap-[1px] p-[1px] bg-[#bbada0] rounded-lg" style={{ width: 'min(300px, 90vw)', aspectRatio: 1 }}>
          {Array.from({ length: gridSize * gridSize }, (_, i) => {
            const r = Math.floor(i / gridSize);
            const c = i % gridSize;
            const isSnake = snake.some(s => s[0] === r && s[1] === c);
            const isFood = food[0] === r && food[1] === c;
            return (
              <div
                key={i}
                className="aspect-square"
                style={{
                  backgroundColor: isFood ? '#ef4444' : isSnake ? '#10b981' : 'transparent',
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="text-[0.55rem] text-white/40 text-center">
        Use arrow keys or swipe to move
      </div>

      <button
        onClick={restart}
        className="w-full py-2 rounded border border-white/10 bg-white/5 text-[0.65rem] font-medium text-white/80 uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
      >
        <RotateCcw size="14" strokeWidth="1.5" /> New Game
      </button>
    </div>
  );
}
