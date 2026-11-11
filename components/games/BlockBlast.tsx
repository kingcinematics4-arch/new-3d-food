'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';

type Props = { backHref: string };
const STORAGE = 'dine_block_best_v2';
const MUTE_KEY = 'dine_block_muted_v2';
const GRID = 8;
const COLORS = ['#E76F51','#2A9D8F','#E9C46A','#5E81AC','#B48EAD','#84A98C','#F4A261','#4CC9F0'];

type Cell = string | null;
type Shape = { cells: [number, number][]; color: string; id: number };

const PIECES: [number, number][][] = [
  [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]], [[0,0],[1,0],[2,0]], [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[1,0],[2,0],[0,1]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,2]], [[1,0],[0,1],[1,1],[2,1]],
  [[0,0],[1,0],[1,1],[2,1]], [[1,0],[2,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[2,1],[2,2]], [[0,0],[0,1],[0,2],[1,0],[2,0]],
];

function randPiece(id: number): Shape {
  const cells = PIECES[Math.floor(Math.random() * PIECES.length)].map(c => [c[0], c[1]] as [number, number]);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { cells, color, id };
}

export default function BlockBlast({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const dragRef = useRef<{ idx: number; x: number; y: number } | null>(null);
  const hoverRef = useRef<{ gx: number; gy: number; valid: boolean } | null>(null);
  const g = useRef({
    grid: Array.from({ length: GRID }, () => Array<Cell>(GRID).fill(null)),
    tray: [randPiece(1), randPiece(2), randPiece(3)] as (Shape | null)[],
    score: 0, best: 0, combo: 0, level: 1, clears: 0, placed: 0,
    over: false, started: false, msg: '', msgT: 0,
  });
  const [ui, setUi] = useState({ started: false, paused: false, over: false, score: 0, best: 0, combo: 0, level: 1, muted: false, piecesLeft: 3 });

  useEffect(() => {
    try { g.current.best = parseInt(localStorage.getItem(STORAGE) || '0', 10) || 0; } catch {}
    try { setUi(p => ({ ...p, best: g.current.best, muted: localStorage.getItem(MUTE_KEY) === '1' })); } catch {}
  }, []);

  const beep = (f = 440, d = 0.07, t: OscillatorType = 'sine', v = 0.05) => {
    if (ui.muted) return;
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current; const o = ctx.createOscillator(); const ga = ctx.createGain();
      o.type = t; o.frequency.value = f; ga.gain.value = v; o.connect(ga); ga.connect(ctx.destination);
      o.start(); ga.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d); o.stop(ctx.currentTime + d);
    } catch {}
  };

  const canPlace = (shape: Shape, gx: number, gy: number, grid = g.current.grid) => {
    for (const [cx, cy] of shape.cells) {
      const x = gx + cx, y = gy + cy;
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false;
      if (grid[y][x]) return false;
    }
    return true;
  };

  const anyMove = (grid = g.current.grid, tray = g.current.tray) => {
    for (const s of tray) {
      if (!s) continue;
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (canPlace(s, x, y, grid)) return true;
    }
    return false;
  };

  const refillIfNeeded = () => {
    if (g.current.tray.every(s => !s)) {
      let id = Date.now();
      g.current.tray = [randPiece(id++), randPiece(id++), randPiece(id++)];
      g.current.level = 1 + Math.floor(g.current.placed / 12);
    }
  };

  const reset = (start = false) => {
    const s = g.current;
    s.grid = Array.from({ length: GRID }, () => Array<Cell>(GRID).fill(null));
    let id = 1; s.tray = [randPiece(id++), randPiece(id++), randPiece(id++)];
    s.score = 0; s.combo = 0; s.level = 1; s.clears = 0; s.placed = 0; s.over = false; s.started = start; s.msg = ''; s.msgT = 0;
    setUi(p => ({ ...p, started: start, paused: false, over: false, score: 0, combo: 0, level: 1, piecesLeft: 3 }));
    if (start) beep(520, 0.08, 'triangle');
  };
  useEffect(() => { reset(false); }, []);
  const toggleMute = () => setUi(p => { const m = !p.muted; try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch {} return { ...p, muted: m }; });
  const togglePause = () => setUi(p => { if (!p.started || p.over) return p; return { ...p, paused: !p.paused }; });

  const placeShape = (idx: number, gx: number, gy: number) => {
    const s = g.current; const shape = s.tray[idx]; if (!shape || s.over || !s.started) return false;
    if (!canPlace(shape, gx, gy)) return false;
    for (const [cx, cy] of shape.cells) s.grid[gy + cy][gx + cx] = shape.color;
    s.tray[idx] = null; s.placed += 1; s.score += shape.cells.length * 5; beep(420, 0.05, 'square', 0.04);

    const fullRows: number[] = []; const fullCols: number[] = [];
    for (let y = 0; y < GRID; y++) if (s.grid[y].every(Boolean)) fullRows.push(y);
    for (let x = 0; x < GRID; x++) if (s.grid.every(row => row[x])) fullCols.push(x);
    const cleared = fullRows.length + fullCols.length;
    if (cleared > 0) {
      for (const y of fullRows) for (let x = 0; x < GRID; x++) s.grid[y][x] = null;
      for (const x of fullCols) for (let y = 0; y < GRID; y++) s.grid[y][x] = null;
      s.combo += 1; s.clears += cleared;
      const gain = cleared * 100 + (cleared > 1 ? cleared * 40 : 0) + (s.combo - 1) * 25;
      s.score += gain; s.msg = cleared > 1 ? `Combo x${s.combo} +${gain}` : `Clear +${gain}`; s.msgT = 1.2; beep(760, 0.1, 'triangle', 0.06);
    } else { s.combo = 0; }

    refillIfNeeded();
    const piecesLeft = s.tray.filter(Boolean).length;
    if (!anyMove()) {
      s.over = true; const best = Math.max(s.best, s.score); s.best = best; try { localStorage.setItem(STORAGE, String(best)); } catch {}
      setUi(p => ({ ...p, over: true, started: false, score: s.score, best, combo: s.combo, level: s.level, piecesLeft }));
      beep(120, 0.25, 'sawtooth', 0.07);
      return true;
    }
    setUi(p => ({ ...p, score: s.score, combo: s.combo, level: s.level, best: Math.max(p.best, s.score), piecesLeft }));
    return true;
  };

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const layout = { boardX: 0, boardY: 0, cell: 40, trayY: 0, traySlots: [] as {x:number;y:number;w:number;h:number}[], w: 0, h: 0 };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout.w = rect.width; layout.h = rect.height;
      const maxBoard = Math.min(rect.width - 24, 360);
      layout.cell = Math.floor(maxBoard / GRID);
      const boardPx = layout.cell * GRID;
      layout.boardX = Math.floor((rect.width - boardPx) / 2);
      layout.boardY = 16;
      layout.trayY = layout.boardY + boardPx + 18;
      const slotW = Math.floor((rect.width - 32) / 3);
      layout.traySlots = [0,1,2].map(i => ({ x: 16 + i * slotW, y: layout.trayY, w: slotW - 8, h: rect.height - layout.trayY - 12 }));
    };
    resize(); window.addEventListener('resize', resize);

    const drawShape = (shape: Shape, ox: number, oy: number, cell: number, alpha = 1, ghost = false) => {
      ctx.globalAlpha = alpha;
      for (const [cx, cy] of shape.cells) {
        const x = ox + cx * cell, y = oy + cy * cell;
        roundRect(ctx, x+2, y+2, cell-4, cell-4, 8);
        ctx.fillStyle = ghost ? 'rgba(184,164,122,0.35)' : shape.color; ctx.fill();
        if (!ghost) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const s = g.current; if (s.msgT > 0) s.msgT -= dt; if (s.msgT <= 0) s.msg = '';
      ctx.clearRect(0,0,layout.w,layout.h);
      const bg = ctx.createLinearGradient(0,0,0,layout.h); bg.addColorStop(0,'#15130f'); bg.addColorStop(1,'#090908'); ctx.fillStyle = bg; ctx.fillRect(0,0,layout.w,layout.h);

      // board
      const bpx = layout.cell * GRID; roundRect(ctx, layout.boardX-6, layout.boardY-6, bpx+12, bpx+12, 16); ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fill();
      ctx.strokeStyle = 'rgba(184,164,122,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      for (let y=0;y<GRID;y++) for (let x=0;x<GRID;x++) {
        const px = layout.boardX + x*layout.cell, py = layout.boardY + y*layout.cell;
        roundRect(ctx, px+3, py+3, layout.cell-6, layout.cell-6, 8);
        const cell = s.grid[y][x]; ctx.fillStyle = cell ? cell : 'rgba(255,255,255,0.04)'; ctx.fill();
        if (cell) { ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.stroke(); }
      }
      // hover ghost
      const hover = hoverRef.current; const drag = dragRef.current;
      if (hover && drag && s.tray[drag.idx]) {
        drawShape(s.tray[drag.idx]!, layout.boardX + hover.gx*layout.cell, layout.boardY + hover.gy*layout.cell, layout.cell, 1, true);
        if (!hover.valid) { ctx.strokeStyle = 'rgba(239,68,68,0.7)'; ctx.lineWidth = 2; roundRect(ctx, layout.boardX + hover.gx*layout.cell, layout.boardY + hover.gy*layout.cell, layout.cell*4, layout.cell*4, 10); }
      }
      // tray
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; roundRect(ctx, 10, layout.trayY-8, layout.w-20, layout.h-layout.trayY, 14); ctx.fill();
      layout.traySlots.forEach((slot, i) => {
        const shape = s.tray[i]; if (!shape) return; if (drag && drag.idx === i) return;
        const xs = shape.cells.map(c=>c[0]); const ys = shape.cells.map(c=>c[1]);
        const sw = (Math.max(...xs)+1), sh = (Math.max(...ys)+1);
        const cell = Math.min(26, Math.floor(Math.min((slot.w-16)/Math.max(1,sw), (slot.h-20)/Math.max(1,sh))));
        const ox = slot.x + Math.floor((slot.w - sw*cell)/2); const oy = slot.y + Math.floor((slot.h - sh*cell)/2);
        drawShape(shape, ox, oy, cell, 1, false);
      });
      // dragged shape
      if (drag && s.tray[drag.idx]) {
        const shape = s.tray[drag.idx]!;
        drawShape(shape, drag.x - layout.cell*0.8, drag.y - layout.cell*1.4, layout.cell, 0.95, false);
      }
      if (s.msg) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(ctx, layout.boardX + 20, layout.boardY + 10, bpx-40, 34, 10); ctx.fill(); ctx.fillStyle = '#D9CBAB'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText(s.msg, layout.boardX + bpx/2, layout.boardY + 32); }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const toBoard = (x:number,y:number) => ({ gx: Math.floor((x - layout.boardX) / layout.cell), gy: Math.floor((y - layout.boardY) / layout.cell) });
    const pickTray = (x:number,y:number) => {
      for (let i=0;i<3;i++) { const slot = layout.traySlots[i]; if (x>=slot.x && x<=slot.x+slot.w && y>=slot.y && y<=slot.y+slot.h && g.current.tray[i]) return i; }
      return -1;
    };
    const getPos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onDown = (e: PointerEvent) => {
      if (!g.current.started || g.current.over || ui.paused) return; const p = getPos(e); const idx = pickTray(p.x,p.y); if (idx < 0) return;
      dragRef.current = { idx, x: p.x, y: p.y }; hoverRef.current = null; canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current || ui.paused) return; const p = getPos(e); dragRef.current.x = p.x; dragRef.current.y = p.y;
      const { gx, gy } = toBoard(p.x - layout.cell*0.3, p.y - layout.cell*0.9); const shape = g.current.tray[dragRef.current.idx];
      if (shape) hoverRef.current = { gx, gy, valid: canPlace(shape, gx, gy) }; else hoverRef.current = null;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragRef.current) return; const d = dragRef.current; dragRef.current = null;
      const h = hoverRef.current; hoverRef.current = null; try { canvas.releasePointerCapture(e.pointerId); } catch {}
      if (h && h.valid) placeShape(d.idx, h.gx, h.gy);
    };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    return () => { window.removeEventListener('resize', resize); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); cancelAnimationFrame(rafRef.current); };
  }, [ui.muted]);

  return (
    <GameShell
      title="Block Blast"
      subtitle="Puzzle Challenge"
      backHref={backHref}
      best={ui.best}
      stats={[{ label: 'Score', value: ui.score }, { label: 'Combo', value: ui.combo }, { label: 'Level', value: ui.level }, { label: 'Best', value: ui.best }]}
      accent="#2A9D8F"
      onPauseToggle={togglePause}
      paused={ui.paused}
      running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>}
      instructions={['Drag a block from the tray onto the 8×8 board.', 'Complete full rows or columns to clear them and score combos.', 'You get 3 blocks at a time; a new set appears when all are placed.', 'No rotation — plan placements carefully. Game ends when no block fits.']}
      showStart={!ui.started && !ui.over}
      showGameOver={ui.over}
      onStart={() => reset(true)}
      onRestart={() => reset(true)}
      startLabel="Start Puzzle"
      gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Clears {g.current.clears} • Max combo {ui.combo}</div>}
    >
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[620px] sm:h-[640px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{ touchAction: 'none' }} />
        {ui.paused && ui.started && !ui.over && (
          <div className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-sm flex items-center justify-center">
            <div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center">
              <p className="text-lg font-semibold">Paused</p>
              <p className="text-xs text-white/50 mt-1">Resume to continue placing blocks</p>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath(); ctx.moveTo(x+rr, y); ctx.arcTo(x+w, y, x+w, y+h, rr); ctx.arcTo(x+w, y+h, x, y+h, rr); ctx.arcTo(x, y+h, x, y, rr); ctx.arcTo(x, y, x+w, y, rr); ctx.closePath();
}
