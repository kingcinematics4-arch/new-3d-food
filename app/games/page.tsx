'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Gamepad2, ArrowLeft, Trophy, Gauge, Blocks, Target, CarFront, Sparkles, ChevronRight } from 'lucide-react';

const GOLD = '#B8A47A';

const GAMES = [
  {
    id: 'endless-runner',
    title: 'Neon Sprint',
    subtitle: 'Endless Runner',
    description: 'Dash through three lanes, jump, slide, collect coins and chase missions as speed ramps up.',
    accent: 'from-amber-400/30 via-orange-500/10 to-transparent',
    icon: Gauge,
    stat: 'Reflex • Missions',
  },
  {
    id: 'block-blast',
    title: 'Block Blast',
    subtitle: 'Puzzle Challenge',
    description: 'Drag and place shapes, clear rows and columns, chain combos and survive the board.',
    accent: 'from-emerald-400/30 via-teal-500/10 to-transparent',
    icon: Blocks,
    stat: 'Strategy • Combos',
  },
  {
    id: 'bubble-shooter',
    title: 'Bubble Pop',
    subtitle: 'Aim & Match',
    description: 'Aim carefully, match colors, drop clusters and clear handcrafted levels with precision shots.',
    accent: 'from-sky-400/30 via-cyan-500/10 to-transparent',
    icon: Target,
    stat: 'Aim • Levels',
  },
  {
    id: 'traffic-racer',
    title: 'Midnight Racer',
    subtitle: 'Traffic Dodge',
    description: 'Weave through traffic, react fast, survive escalating speed and set a new distance record.',
    accent: 'from-rose-400/30 via-fuchsia-500/10 to-transparent',
    icon: CarFront,
    stat: 'Speed • Distance',
  },
] as const;

export default function GamesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug') || '';
  const table = searchParams.get('table') || '';
  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}${table ? `?table=${encodeURIComponent(table)}` : ''}` : '/menu';
  const qs = slug ? `?slug=${encodeURIComponent(slug)}${table ? `&table=${encodeURIComponent(table)}` : ''}` : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#070706] text-[#F3EFE7]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl border border-[rgba(184,164,122,0.45)] bg-gradient-to-br from-[rgba(184,164,122,0.25)] to-transparent flex items-center justify-center shadow-[0_0_30px_rgba(184,164,122,0.15)]">
              <Gamepad2 size={18} color={GOLD} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">DinePixel</p>
              <h1 className="text-lg font-semibold tracking-tight">Arcade Lounge</h1>
            </div>
          </div>
          <a href={menuHref} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors">
            <ArrowLeft size={14} />
            <span>Back to Menu</span>
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8 pb-28">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(184,164,122,0.18),transparent_55%),linear-gradient(180deg,#141311_0%,#0b0b0a_100%)] p-6 sm:p-8 mb-8">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[rgba(184,164,122,0.12)] blur-3xl" />
          <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(184,164,122,0.35)] bg-[rgba(184,164,122,0.08)] text-[11px] uppercase tracking-[0.2em] text-[rgba(243,239,231,0.8)] mb-4">
              <Sparkles size={12} color={GOLD} />
              <span>Play While You Wait</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-3">Premium mini arcade, <span className="text-[#D9CBAB]">built for your table</span></h2>
            <p className="text-sm sm:text-base text-white/55 max-w-2xl leading-relaxed">Four fully playable games with smooth canvas loops, responsive touch controls, local high scores, sound effects and progressive challenge. Pick a game and start instantly.</p>
            <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"><Trophy size={12} color={GOLD}/> Best scores saved</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">No login required</span>
              {table && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Table {table}</span>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.id}
                onClick={() => router.push(`/games/${game.id}${qs}`)}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#121210] text-left p-5 sm:p-6 hover:border-[rgba(184,164,122,0.45)] hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgba(184,164,122,0.5)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_35%)]" />
                <div className="relative flex flex-col h-full min-h-[220px]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl border border-white/15 bg-black/30 backdrop-blur flex items-center justify-center shadow-inner">
                      <Icon size={26} color={GOLD} strokeWidth={1.6} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 px-2.5 py-1 rounded-full border border-white/10 bg-black/20">{game.stat}</span>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(184,164,122,0.9)] mb-1">{game.subtitle}</p>
                  <h3 className="text-2xl font-semibold tracking-tight mb-2">{game.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-5 flex-1">{game.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(184,164,122,0.14)] border border-[rgba(184,164,122,0.35)] text-sm font-medium text-[#F3EFE7] group-hover:bg-[rgba(184,164,122,0.22)] transition-colors">
                      Play <ChevronRight size={16} />
                    </span>
                    <span className="text-[11px] text-white/40">Best score saved</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/60 backdrop-blur px-6 py-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">DinePixel Arcade • Premium play, no bets, no rewards{slug ? ` • Table ${table || '—'}` : ''}</p>
      </footer>
    </div>
  );
}
