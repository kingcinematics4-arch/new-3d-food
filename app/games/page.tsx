'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Gamepad2, ArrowLeft, Trophy, Gauge, Blocks, Target, CarFront, Sparkles, ChevronRight, Cpu } from 'lucide-react';

const GOLD = '#B8A47A';

type GameDef = {
  id: string; title: string; subtitle: string; description: string; accent: string; accent2: string;
  icon: any; stat: string; bestKey: string; preview: 'runner'|'blocks'|'bubbles'|'racer';
};

const GAMES: GameDef[] = [
  { id: 'endless-runner', title: 'Neon Sprint', subtitle: '3D Endless Runner', description: 'Sprint down a glowing 3-lane track, jump barriers, slide under beams and chase missions at rising speed.', accent: '#D4AF6A', accent2: '#FF8A3D', icon: Gauge, stat: 'Reflex • Missions', bestKey: 'dine_runner_best_v2', preview: 'runner' },
  { id: 'block-blast', title: 'Block Forge', subtitle: '3D Puzzle', description: 'Place dimensional blocks on an 8×8 board, trigger line clears and stack combos with satisfying blasts.', accent: '#2A9D8F', accent2: '#57D6C7', icon: Blocks, stat: 'Strategy • Combos', bestKey: 'dine_block_best_v2', preview: 'blocks' },
  { id: 'bubble-shooter', title: 'Orbital Pop', subtitle: '3D Bubble Shooter', description: 'Aim glossy orbs, bank shots, match colors and collapse clusters across handcrafted levels.', accent: '#42A5F5', accent2: '#7C4DFF', icon: Target, stat: 'Aim • Levels', bestKey: 'dine_bubble_best_v2', preview: 'bubbles' },
  { id: 'traffic-racer', title: 'Midnight Apex', subtitle: '3D Traffic Racer', description: 'Thread through traffic on a perspective highway, steer at speed and survive escalating intensity.', accent: '#F59E0B', accent2: '#EF4444', icon: CarFront, stat: 'Speed • Distance', bestKey: 'dine_traffic_best_v1', preview: 'racer' },
];

function Preview({ type, accent, accent2 }: { type: GameDef['preview']; accent: string; accent2: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d'); if (!ctx) return;
    let raf = 0; let t = 0;
    const draw = () => {
      t += 0.016; const w = c.width = c.clientWidth * 2; const h = c.height = c.clientHeight * 2; ctx.setTransform(2,0,0,2,0,0);
      const cw = c.clientWidth, ch = c.clientHeight;
      const bg = ctx.createLinearGradient(0,0,0,ch); bg.addColorStop(0,'#12110e'); bg.addColorStop(1,'#060606'); ctx.fillStyle = bg; ctx.fillRect(0,0,cw,ch);
      if (type === 'runner') {
        ctx.strokeStyle = accent + '55'; ctx.lineWidth = 2;
        for (let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(cw*0.2+i*cw*0.3, ch*0.2); ctx.lineTo(cw*0.35+i*cw*0.15, ch); ctx.stroke(); }
        for (let i=0;i<6;i++){ const y=( (t*120+i*40)% (ch*0.9))+ch*0.1; ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(cw*0.48, y, 4, 18); ctx.fillRect(cw*0.52, y, 4, 18);}        
        ctx.fillStyle = accent; roundRect(ctx,cw*0.48-10,ch*0.62-Math.abs(Math.sin(t*3))*10,20,28,6); ctx.fill();
        ctx.fillStyle = accent2; roundRect(ctx,cw*0.34-12,ch*0.35,24,18,5); ctx.fill(); ctx.fillStyle='#d8c28f'; ctx.beginPath(); ctx.arc(cw*0.64,ch*0.45,8,0,Math.PI*2); ctx.fill();
      } else if (type === 'blocks') {
        const s=18, ox=cw/2-s*2, oy=ch*0.28; ctx.strokeStyle='rgba(255,255,255,0.08)';
        for(let y=0;y<4;y++) for(let x=0;x<4;x++){ ctx.strokeRect(ox+x*s,oy+y*s,s,s); }
        const blocks=[{x:0,y:2,c:accent},{x:1,y:2,c:accent},{x:2,y:2,c:accent},{x:1,y:1,c:accent2},{x:2,y:0,c:'#5E81AC'}];
        blocks.forEach((b,i)=>{ const dy=Math.sin(t*2+i)*2; roundRect(ctx,ox+b.x*s+2,oy+b.y*s+2-dy,s-4,s-4,5); ctx.fillStyle=b.c; ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(ox+b.x*s+4,oy+b.y*s+4-dy,s-10,4); });
        ctx.globalAlpha=0.4+Math.sin(t*3)*0.2; ctx.fillStyle=accent; ctx.fillRect(ox,oy+2*s,s*4,s); ctx.globalAlpha=1;
      } else if (type === 'bubbles') {
        for(let r=0;r<4;r++) for(let c0=0;c0<5;c0++){ const x=cw*0.28+c0*22+(r%2?11:0); const y=ch*0.22+r*19; const col=[accent,accent2,'#66BB6A','#FFCA28'][(r+c0)%4]; bubble(ctx,x,y,9,col);}        
        const ax=cw*0.5, ay=ch*0.88; const ang=-Math.PI/2 + Math.sin(t*1.4)*0.5; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+Math.cos(ang)*40,ay+Math.sin(ang)*40); ctx.stroke();
        bubble(ctx,ax+Math.cos(ang)*55,ay+Math.sin(ang)*55,9,'#EF5350');
      } else {
        ctx.fillStyle='#1a1814'; ctx.beginPath(); ctx.moveTo(cw*0.2,0); ctx.lineTo(cw*0.8,0); ctx.lineTo(cw*0.95,ch); ctx.lineTo(cw*0.05,ch); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([10,12]); ctx.beginPath(); ctx.moveTo(cw*0.4,0); ctx.lineTo(cw*0.38,ch); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cw*0.6,0); ctx.lineTo(cw*0.62,ch); ctx.stroke(); ctx.setLineDash([]);
        for(let i=0;i<4;i++){ const y=((t*180+i*70)%(ch+40))-20; ctx.fillStyle='rgba(243,239,231,0.2)'; ctx.fillRect(cw*0.49,y,3,14); }
        car(ctx,cw*0.5, ch*0.78, 26, 44, accent);
        car(ctx,cw*0.34, ((t*120)% (ch+80))-40, 22, 38, '#3b82f6');
        car(ctx,cw*0.66, ((t*150+50)% (ch+80))-40, 22, 38, accent2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [type, accent, accent2]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
function roundRect(ctx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}
function bubble(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,r*0.2,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(0.25,color);g.addColorStop(1,'#111');ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
function car(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){roundRect(ctx,x-w/2,y-h/2,w,h,6);ctx.fillStyle=color;ctx.fill();ctx.fillStyle='rgba(0,0,0,0.35)';roundRect(ctx,x-w/2+4,y-h/2+8,w-8,h*0.28,4);ctx.fill();}

export default function GamesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug') || '';
  const table = searchParams.get('table') || '';
  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}${table ? `?table=${encodeURIComponent(table)}` : ''}` : '/';
  const qs = slug ? `?slug=${encodeURIComponent(slug)}${table ? `&table=${encodeURIComponent(table)}` : ''}` : '';
  const [bests, setBests] = useState<Record<string, number>>({});
  useEffect(() => {
    const b: Record<string, number> = {};
    GAMES.forEach(g => { try { b[g.id] = parseInt(localStorage.getItem(g.bestKey) || '0', 10) || 0; } catch { b[g.id] = 0; } });
    setBests(b);
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-[#F3EFE7]" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'radial-gradient(1000px 500px at 10% -10%, rgba(184,164,122,0.16), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(66,165,245,0.08), transparent 55%), #050505' }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl border border-[rgba(184,164,122,0.45)] bg-gradient-to-br from-[rgba(184,164,122,0.28)] to-transparent flex items-center justify-center shadow-[0_0_30px_rgba(184,164,122,0.18),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <Gamepad2 size={18} color={GOLD} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">DinePixel</p>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Arcade Lounge</h1>
            </div>
          </div>
          <Link href={menuHref} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium transition-colors">
            <ArrowLeft size={14} /><span>Back to Menu</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 pb-28">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(184,164,122,0.22),transparent_45%),radial-gradient(ellipse_at_90%_20%,rgba(66,165,245,0.12),transparent_40%),linear-gradient(180deg,#151311_0%,#090908_100%)] p-6 sm:p-8 mb-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(184,164,122,0.35)] bg-[rgba(184,164,122,0.1)] text-[11px] uppercase tracking-[0.2em] text-[rgba(243,239,231,0.85)] mb-4">
              <Sparkles size={12} color={GOLD} /><span>Play While You Wait</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-3">Immersive mini arcade, <span className="text-[#E7D6AE]">crafted for your table</span></h2>
            <p className="text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed">Four fully playable games with real-time 3D visuals, responsive controls, sound, progression and saved high scores. Optimised for mobile with automatic quality fallback.</p>
            <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"><Trophy size={12} color={GOLD}/> Local best scores</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"><Cpu size={12}/> WebGL 3D + smart fallback</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">No login required</span>
              {table && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Table {table}</span>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {GAMES.map((game) => {
            const Icon = game.icon; const best = bests[game.id] || 0;
            return (
              <button key={game.id} onClick={() => router.push(`/games/${game.id}${qs}`)} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f0e0c] text-left hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgba(184,164,122,0.45)] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                <div className="relative h-44 sm:h-48 overflow-hidden border-b border-white/10">
                  <Preview type={game.preview} accent={game.accent} accent2={game.accent2} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e0c] via-[#0f0e0c]/20 to-transparent" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-black/35 backdrop-blur text-[10px] uppercase tracking-[0.18em] text-white/75">
                    <Icon size={13} color={game.accent} /> {game.subtitle}
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full border border-white/15 bg-black/35 backdrop-blur text-[11px] text-white/80 inline-flex items-center gap-1.5"><Trophy size={12} color={GOLD}/> {best}</div>
                </div>
                <div className="relative p-5 sm:p-6">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: game.accent }} />
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: game.accent }}>{game.stat}</p>
                  <h3 className="text-2xl font-semibold tracking-tight mb-2">{game.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-5">{game.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors" style={{ background: `${game.accent}22`, borderColor: `${game.accent}55`, color: '#F3EFE7' }}>
                      Play Now <ChevronRight size={16} />
                    </span>
                    <span className="text-[11px] text-white/40">Pause • Sound • Restart</span>
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
