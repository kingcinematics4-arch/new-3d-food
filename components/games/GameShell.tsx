'use client';

import React from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';

type Stat = { label: string; value: React.ReactNode };

export function GameShell({
  title,
  subtitle,
  backHref,
  best,
  stats,
  accent = '#B8A47A',
  onPauseToggle,
  paused,
  running,
  rightSlot,
  instructions,
  children,
  showStart,
  showGameOver,
  onStart,
  onRestart,
  startLabel = 'Start Playing',
  gameOverTitle = 'Game Over',
  gameOverExtra,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  best: number;
  stats: Stat[];
  accent?: string;
  onPauseToggle?: () => void;
  paused?: boolean;
  running?: boolean;
  rightSlot?: React.ReactNode;
  instructions: string[];
  children: React.ReactNode;
  showStart: boolean;
  showGameOver: boolean;
  onStart: () => void;
  onRestart: () => void;
  startLabel?: string;
  gameOverTitle?: string;
  gameOverExtra?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#070706] text-[#F3EFE7]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a href={backHref} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors shrink-0">
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Arcade</span>
            </a>
            <div className="min-w-0">
              {subtitle && <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 truncate">{subtitle}</p>}
              <h1 className="text-sm sm:text-base font-semibold tracking-tight truncate">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {running && onPauseToggle && (
              <button onClick={onPauseToggle} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium">
                {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Resume' : 'Pause'}
              </button>
            )}
            {rightSlot}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-5 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-0.5">{s.label}</div>
              <div className="text-lg font-semibold" style={{ color: s.label.toLowerCase().includes('best') ? accent : '#F3EFE7' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="relative">
          {children}

          {showStart && (
            <div className="absolute inset-0 z-20 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center p-5">
              <div className="max-w-md w-full text-center">
                <p className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: accent }}>Ready to play</p>
                <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-3">{title}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-4">Best Score <span style={{ color: accent }} className="font-semibold">{best}</span></div>
                <ul className="text-sm text-white/65 space-y-1.5 mb-6 text-left max-w-sm mx-auto">
                  {instructions.map((t, i) => <li key={i} className="flex gap-2"><span style={{ color: accent }}>•</span><span>{t}</span></li>)}
                </ul>
                <button onClick={onStart} className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold tracking-wide text-black transition-transform hover:scale-[1.01] active:scale-[0.99]" style={{ background: accent }}>
                  {startLabel}
                </button>
              </div>
            </div>
          )}

          {showGameOver && (
            <div className="absolute inset-0 z-20 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-center p-5">
              <div className="max-w-sm w-full text-center">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">{gameOverTitle}</p>
                <h2 className="text-3xl font-light tracking-tight mb-2" style={{ color: accent }}>Run Complete</h2>
                <div className="mb-5">{gameOverExtra}</div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button onClick={onRestart} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-black" style={{ background: accent }}>
                    <RotateCcw size={16} /> Play Again
                  </button>
                  <a href={backHref} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-medium">Arcade</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
