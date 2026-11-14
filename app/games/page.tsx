'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gamepad2, ArrowLeft, Trophy, Gauge, Blocks, Target, CarFront, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/nav/BottomNav';

const GOLD = '#B8A47A';

type GameDef = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  accent2: string;
  icon: any;
  stat: string;
  bestKey: string;
};

const GAMES: GameDef[] = [
  { id: 'endless-runner', title: 'Neon Sprint', subtitle: '3D Endless Runner', description: 'Sprint down a glowing 3-lane track, jump barriers, slide under beams.', accent: '#D4AF6A', accent2: '#FF8A3D', icon: Gauge, stat: 'Reflex • Missions', bestKey: 'dine_runner_best_v2' },
  { id: 'block-blast', title: 'Block Forge', subtitle: '3D Puzzle', description: 'Place dimensional blocks on an 8×8 board, trigger line clears and stack combos.', accent: '#2A9D8F', accent2: '#57D6C7', icon: Blocks, stat: 'Strategy • Combos', bestKey: 'dine_block_best_v2' },
  { id: 'bubble-shooter', title: 'Orbital Pop', subtitle: '3D Bubble Shooter', description: 'Aim glossy orbs, bank shots, match colors and collapse clusters.', accent: '#42A5F5', accent2: '#7C4DFF', icon: Target, stat: 'Aim • Levels', bestKey: 'dine_bubble_best_v2' },
  { id: 'traffic-racer', title: 'Midnight Apex', subtitle: '3D Traffic Racer', description: 'Thread through traffic on a perspective highway, steer at speed.', accent: '#F59E0B', accent2: '#EF4444', icon: CarFront, stat: 'Speed • Distance', bestKey: 'dine_traffic_best_v1' },
];

function GameThumbnail({ accent, accent2, type }: { accent: string; accent2: string; type: 'runner' | 'blocks' | 'bubbles' | 'racer' }) {
  return (
    <div
      className="w-full aspect-[4/3] rounded-t-xl"
      style={{
        background: `linear-gradient(135deg, ${accent}22 0%, ${accent2}22 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.15 }}>
        {type === 'runner' && (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )}
        {type === 'blocks' && (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        )}
        {type === 'bubbles' && (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="8" cy="9" r="2" />
            <circle cx="16" cy="9" r="2" />
            <circle cx="12" cy="16" r="2" />
          </svg>
        )}
        {type === 'racer' && (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-.1-2.5.5C12.6 10.1 11 10.9 11 10.9s-3 2-3 2H5c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: 'linear-gradient(to top, rgba(11,11,10,0.9), transparent)' }} />
    </div>
  );
}

export default function GamesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug') || '';
  const table = searchParams.get('table') || '';
  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}${table ? `?table=${encodeURIComponent(table)}` : ''}` : '/';
  const qs = slug ? `?slug=${encodeURIComponent(slug)}${table ? `&table=${encodeURIComponent(table)}` : ''}` : '';
  const [bests, setBests] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState('Games');

  useEffect(() => {
    const b: Record<string, number> = {};
    GAMES.forEach(g => { try { b[g.id] = parseInt(localStorage.getItem(g.bestKey) || '0', 10) || 0; } catch { b[g.id] = 0; } });
    setBests(b);
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-[#F3EFE7] pb-28 sm:pb-24 lg:pl-64" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'radial-gradient(1000px 500px at 10% -10%, rgba(184,164,122,0.16), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(66,165,245,0.08), transparent 55%), #050505' }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 rounded-xl border border-[rgba(184,164,122,0.45)] bg-gradient-to-br from-[rgba(184,164,122,0.28)] to-transparent flex items-center justify-center">
              <Gamepad2 size={16} color={GOLD} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">DinePixel</p>
              <h1 className="text-base font-semibold tracking-tight">Games</h1>
            </div>
          </div>
          <Link href={menuHref} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium transition-colors">
            <ArrowLeft size={12} /><span>Menu</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 pb-6 lg:max-w-5xl">
        <section className="grid grid-cols-2 gap-3" aria-label="Games">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const best = bests[game.id] || 0;
            const previewType = game.id === 'endless-runner' ? 'runner' : game.id === 'block-blast' ? 'blocks' : game.id === 'bubble-shooter' ? 'bubbles' : 'racer';
            return (
              <button
                key={game.id}
                onClick={() => router.push(`/games/${game.id}${qs}`)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12110f] text-left hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(184,164,122,0.45)]"
              >
                <GameThumbnail accent={game.accent} accent2={game.accent2} type={previewType} />
                <div className="p-3 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-tight" style={{ background: `${game.accent}22`, border: `1px solid ${game.accent}44`, color: game.accent }}>
                      <Icon size={10} color={game.accent} /> {game.subtitle}
                    </span>
                    {best > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ background: 'rgba(184,164,122,0.15)', border: '1px solid rgba(184,164,122,0.3)', color: GOLD }}>
                        <Trophy size={9} color={GOLD} /> {best}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mb-1 text-white">{game.title}</h3>
                  <p className="text-[11px] text-white/55 leading-snug mb-2 line-clamp-2 flex-1">{game.description}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors w-full justify-center" style={{ background: `${game.accent}22`, border: `1px solid ${game.accent}44`, color: '#F3EFE7' }}>
                    Play <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/60 backdrop-blur px-4 py-3 text-center">
        <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">DinePixel Games • Premium play{slug ? ` • Table ${table}` : ''}</p>
      </footer>

      <BottomNav
        variant="bottom"
        activeTab={activeTab}
        cartCount={0}
        menuSlug={slug || null}
        tableNumber={table || null}
        onTabChange={setActiveTab}
      />
      <BottomNav
        variant="sidebar"
        activeTab={activeTab}
        cartCount={0}
        menuSlug={slug || null}
        tableNumber={table || null}
        onTabChange={setActiveTab}
      />
    </div>
  );
}