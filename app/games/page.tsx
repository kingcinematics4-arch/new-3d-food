'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Gamepad2, Sparkles, LayoutGrid, Zap } from 'lucide-react';

const games = [
  {
    title: 'Taste Memory',
    description: 'Match dishes to remember flavors and win a discount on your next order.',
    icon: Sparkles,
    category: 'Memory',
  },
  {
    title: 'Chef’s Challenge',
    description: 'Guess the mystery ingredient and unlock a complimentary dessert.',
    icon: Zap,
    category: 'Trivia',
  },
  {
    title: 'Table Quest',
    description: 'Explore the menu in 3D and discover hidden chef specials.',
    icon: LayoutGrid,
    category: 'Adventure',
  },
];

export default function GamesPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || null;
  const table = searchParams.get('table') || null;

  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}` : '/menu';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0B0A', color: '#F3EFE7', fontFamily: "'Inter', system-ui, sans-serif" }}>
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
          <Link href={menuHref} className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">
            Back to Menu
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white mb-2">Play While You Wait</h2>
          <p className="text-xs text-white/50">Light games to enjoy while your order is being prepared.</p>
        </div>

        <div className="grid gap-4">
          {games.map((game) => (
            <section key={game.title} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4 hover:bg-white/10 transition-colors group cursor-pointer">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-colors">
                <game.icon size="18" strokeWidth="1.5" stroke="#B8A47A" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[0.55rem] font-bold tracking-wider uppercase text-white/40">{game.category}</span>
                </div>
                <h3 className="text-sm font-medium text-white leading-snug">{game.title}</h3>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">{game.description}</p>
              </div>
              <Link href="#" className="px-3 py-1.5 rounded border border-white/10 bg-white/5 text-[0.65rem] font-medium text-white/80 hover:bg-white/10 transition-colors whitespace-nowrap">
                Play
              </Link>
            </section>
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
