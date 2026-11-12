'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pause, Play, RotateCcw, LogOut } from 'lucide-react';

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
  preview,
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
  preview?: React.ReactNode;
}) {
  const router = useRouter();
  const goBack = () => {
    router.push(backHref || '/games');
  };
  return (
    <div className="min-h-screen flex flex-col text-[#F3EFE7]" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'radial-gradient(1200px 600px at 20% -10%, rgba(184,164,122,0.12), transparent 60%), radial-gradient(900px 500px at 110% 0%, rgba(255,255,255,0.05), transparent 50%), #050505' }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={goBack} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] shrink-0">
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Menu</span>
            </button>
            <div className="min-w-0">
              {subtitle && <p className="text-[10px] uppercase tracking-[0.22em] text-white/40 truncate">{subtitle}</p>}
              <h1 className="text-sm sm:text-base font-semibold tracking-tight truncate">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {running && onPauseToggle && (
              <button onClick={onPauseToggle} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium transition-all">
                {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Resume' : 'Pause'}
              </button>
            )}
            {running && (
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] text-xs font-medium transition-all" title="Exit">
                <LogOut size={14} /> <span className="hidden sm:inline">Exit</span>
              </button>
            )}
            {rightSlot}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-0.5">{s.label}</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: s.label.toLowerCase().includes('best') ? accent : '#F3EFE7' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-black/20 shadow-[0_20px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 120px ${accent}22` }} />
          {children}

          {showStart && (
            <div className="absolute inset-0 z-20 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
              <div className="max-w-lg w-full grid sm:grid-cols-[1.1fr_1fr] gap-4 items-stretch">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <p className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: accent }}>Ready to play</p>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-2">{title}</h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-4">Best Score <span style={{ color: accent }} className="font-semibold">{best}</span></div>
                  <ul className="text-sm text-white/70 space-y-1.5 mb-5">
                    {instructions.map((t, i) => <li key={i} className="flex gap-2"><span style={{ color: accent }}>•</span><span>{t}</span></li>)}
                  </ul>
                  <button onClick={onStart} className="w-full px-6 py-3 rounded-xl font-semibold tracking-wide text-black transition-all hover:brightness-110 active:scale-[0.99] shadow-[0_8px_30px_rgba(0,0,0,0.35)]" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}cc)` }}>
                    {startLabel}
                  </button>
                </div>
                <div className="hidden sm:flex rounded-2xl border border-white/10 bg-black/30 overflow-hidden items-center justify-center min-h-[220px] relative">
                  <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 30% 20%, ${accent}55, transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 40%)` }} />
                  <div className="relative text-center px-4">
                    {preview || <div className="text-white/50 text-sm">Immersive 3D mode ready</div>}
                    <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/35">Auto quality • Smooth play</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showGameOver && (
            <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-md flex items-center justify-center p-5">
              <div className="max-w-sm w-full text-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">{gameOverTitle}</p>
                <h2 className="text-3xl font-light tracking-tight mb-2" style={{ color: accent }}>Session Ended</h2>
                <div className="mb-5 text-sm text-white/70">{gameOverExtra}</div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button onClick={onRestart} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-black" style={{ background: accent }}>
                    <RotateCcw size={16} /> Play Again
                  </button>
                  <button type="button" onClick={goBack} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-medium">Back to Menu</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
