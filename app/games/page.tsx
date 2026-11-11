'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Gamepad2, ArrowLeft, Sparkles, Zap, LayoutGrid, Zap as Bolt } from 'lucide-react';

const GAMES = [
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Two-player Xs and Os. First to three in a row wins.',
    icon: Zap,
    color: 'bg-dine-gold/10 text-dine-gold border-dine-gold/20',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Slide tiles to combine matching numbers. Reach 2048.',
    icon: LayoutGrid,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards and find matching pairs. Track your moves.',
    icon: Sparkles,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Guide the snake to eat food. Avoid walls and yourself.',
    icon: Bolt,
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
];

const GOLD = '#B8A47A';
const CHARCOAL = '#0B0B0A';
const SURFACE = '#171613';
const MUTED = '#6B675F';
const CREAM = '#F3EFE7';

export default function GamesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug') || null;
  const table = searchParams.get('table') || null;

  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}` : '/menu';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CHARCOAL, color: CREAM, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Gamepad2 size="16" strokeWidth="1.5" stroke="white" />
            </div>
            <div>
              <span className="text-[0.65rem] font-bold tracking-widest uppercase text-white/40">Games</span>
              <h1 className="text-base font-bold tracking-tight text-white">Arcade</h1>
            </div>
          </div>
          <LinkBack href={menuHref} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white mb-2">Play While You Wait</h2>
          <p className="text-xs text-white/50">Light games to enjoy while your order is being prepared.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} onPlay={() => {
              const gameHref = slug
                ? `/games/${game.id}?slug=${encodeURIComponent(slug)}&table=${encodeURIComponent(table || '')}`
                : `/games/${game.id}`;
              router.push(gameHref);
            }} />
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/80 px-6 py-6 text-center">
        <p className="text-[0.55rem] text-white/40 tracking-wider uppercase">
          DinePixel Games &bull; For entertainment while you dine{slug ? ` &bull; Table ${table || '—'}` : ''}
        </p>
      </footer>
    </div>
  );
}

function LinkBack({ href }: { href: string }) {
  return (
    <a href={href} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">
      <ArrowLeft size="14" strokeWidth="1.5" stroke="white" />
      <span>Back to Menu</span>
    </a>
  );
}

function GameCard({ game, onPlay }: { game: (typeof GAMES)[number]; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:bg-white/5 hover:border-white/20 group"
      style={{
        background: hovered ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
        borderColor: hovered ? 'rgba(184, 164, 122, 0.4)' : 'rgba(255,255,255,0.1)',
      }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${game.color}`}>
        <game.icon size="20" strokeWidth="1.5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-white">{game.title}</h3>
        <p className="text-xs text-white/50 leading-snug">{game.description}</p>
      </div>
      <button
        onClick={onPlay}
        className="w-full py-2 rounded border border-white/10 bg-white/5 text-[0.65rem] font-medium text-white/80 uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
      >
        <span>Play</span>
        <span className="text-[0.5rem]">→</span>
      </button>
    </div>
  );
}
