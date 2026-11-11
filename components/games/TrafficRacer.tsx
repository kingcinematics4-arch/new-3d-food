'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';

type Props = { backHref: string };
const GOLD = '#B8A47A';
const STORAGE = 'dine_traffic_best_v1';
const MUTE_KEY = 'dine_traffic_muted_v1';

export default function TrafficRacer({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const state = useRef({
    playing: false, paused: false, over: false,
    lane: 1, targetLane: 1, laneX: [0, 0, 0], playerY: 0,
    speed: 240, distance: 0, score: 0, best: 0, level: 1,
    cars: [] as { lane: number; y: number; h: number; w: number; color: string }[],
    stripes: [] as { y: number }[],
    spawnT: 0, spawnEvery: 1.1,
  });
  const input = useRef({ left: false, right: false });
  const [ui, setUi] = useState({ started: false, paused: false, over: false, score: 0, best: 0, dist: 0, level: 1, muted: false, speed: 1 });

  useEffect(() => {
    try { state.current.best = parseInt(localStorage.getItem(STORAGE) || '0', 10) || 0; } catch {}
    try { setUi((p) => ({ ...p, best: state.current.best, muted: localStorage.getItem(MUTE_KEY) === '1' })); } catch {}
  }, []);

  const beep = (f = 440, d = 0.08, t: OscillatorType = 'sine', v = 0.06) => {
    if (ui.muted) return;
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = t; o.frequency.value = f; g.gain.value = v;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
      o.stop(ctx.currentTime + d);
    } catch {}
  };

  const reset = (start = false) => {
    const s = state.current;
    s.playing = start; s.paused = false; s.over = false;
    s.lane = 1; s.targetLane = 1; s.speed = 240; s.distance = 0; s.score = 0; s.level = 1;
    s.cars = []; s.spawnT = 0; s.spawnEvery = 1.1;
    s.stripes = Array.from({ length: 10 }, (_, i) => ({ y: i * 80 - 80 }));
    setUi((p) => ({ ...p, started: start, paused: false, over: false, score: 0, dist: 0, level: 1, speed: 1 }));
    if (start) beep(520, 0.1, 'triangle', 0.05);
  };

  useEffect(() => { reset(false); }, []);
  const toggleMute = () => setUi((p) => { const m = !p.muted; try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch {} return { ...p, muted: m }; });
  const togglePause = () => { const s = state.current; if (!s.playing || s.over) return; s.paused = !s.paused; setUi((p) => ({ ...p, paused: s.paused })); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = state.current;
      if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
      if (!s.playing || s.paused || s.over) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.targetLane = Math.max(0, s.targetLane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.targetLane = Math.min(2, s.targetLane + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui.paused, ui.muted]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width; const roadW = Math.min(360, w - 24); const left = (w - roadW) / 2; const laneW = roadW / 3;
      state.current.laneX = [left + laneW * 0.5, left + laneW * 1.5, left + laneW * 2.5];
      state.current.playerY = rect.height - 110;
    };
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const w = canvas.getBoundingClientRect().width; const h = canvas.getBoundingClientRect().height;
      const s = state.current;
      const roadW = Math.min(360, w - 24); const left = (w - roadW) / 2; const laneW = roadW / 3;

      if (s.playing && !s.paused && !s.over) {
        s.distance += s.speed * dt * 0.1;
        s.score = Math.floor(s.distance);
        s.level = 1 + Math.floor(s.distance / 400);
        s.speed = 240 + (s.level - 1) * 22;
        s.spawnEvery = Math.max(0.45, 1.1 - (s.level - 1) * 0.06);
        s.spawnT += dt;
        if (s.spawnT >= s.spawnEvery) {
          s.spawnT = 0;
          const lane = Math.floor(Math.random() * 3);
          const conflict = s.cars.some(c => c.lane === lane && c.y < 140);
          if (!conflict) s.cars.push({ lane, y: -120, h: 70 + Math.random() * 30, w: laneW * 0.55, color: ['#ef4444','#3b82f6','#10b981','#f59e0b','#a855f7'][Math.floor(Math.random()*5)] });
        }
        s.stripes.forEach(st => { st.y += s.speed * dt; if (st.y > h) st.y -= h + 80; });
        s.cars.forEach(c => c.y += s.speed * dt * 0.95);
        s.cars = s.cars.filter(c => c.y < h + 120);

        const targetX = s.laneX[s.targetLane];
        const curX = s.laneX[s.lane];
        const dx = targetX - curX;
        if (Math.abs(dx) < 0.5) s.lane = s.targetLane;

        const px = s.laneX[s.targetLane]; const py = s.playerY; const pw = laneW * 0.55; const ph = 74;
        for (const c of s.cars) {
          const cx = s.laneX[c.lane];
          if (Math.abs(px - cx) < (pw + c.w) * 0.45 && Math.abs(py - c.y) < (ph + c.h) * 0.45) {
            s.over = true; s.playing = false;
            const best = Math.max(s.best, s.score); s.best = best;
            try { localStorage.setItem(STORAGE, String(best)); } catch {}
            setUi((p) => ({ ...p, over: true, started: false, best, score: s.score, dist: Math.floor(s.distance), level: s.level }));
            beep(120, 0.25, 'sawtooth', 0.08);
            break;
          }
        }
        if (!s.over) setUi((p) => (p.score !== s.score || p.level !== s.level ? { ...p, score: s.score, dist: Math.floor(s.distance), level: s.level, speed: +(s.speed/240).toFixed(1) } : p));
      }

      // draw
      ctx.clearRect(0,0,w,h);
      const bg = ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#15130f'); bg.addColorStop(1,'#080807'); ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#1b1916'; ctx.fillRect(left, 0, roadW, h);
      ctx.strokeStyle = 'rgba(184,164,122,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(left+1, 0, roadW-2, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.setLineDash([18,16]);
      for (let i=1;i<3;i++){ ctx.beginPath(); ctx.moveTo(left + laneW*i, 0); ctx.lineTo(left + laneW*i, h); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(243,239,231,0.25)';
      s.stripes.forEach(st => { for(let i=1;i<3;i++) ctx.fillRect(left + laneW*i - 2, st.y, 4, 28); });

      // cars
      s.cars.forEach(c => {
        const x = s.laneX[c.lane] - c.w/2;
        roundRect(ctx, x, c.y - c.h/2, c.w, c.h, 10); ctx.fillStyle = c.color; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; roundRect(ctx, x+6, c.y - c.h/2 + 8, c.w-12, 14, 6); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x+4, c.y + c.h/2 - 10, c.w-8, 6);
      });

      // player
      const px = s.laneX[s.targetLane] - (laneW*0.55)/2; const py = s.playerY - 37; const pw = laneW*0.55; const ph = 74;
      roundRect(ctx, px, py, pw, ph, 12); const carG = ctx.createLinearGradient(px,py,px,py+ph); carG.addColorStop(0,'#e8d7a8'); carG.addColorStop(1,GOLD); ctx.fillStyle = carG; ctx.fill();
      ctx.fillStyle = 'rgba(10,10,10,0.55)'; roundRect(ctx, px+7, py+10, pw-14, 18, 6); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(px+6, py+ph-8, 10, 4); ctx.fillRect(px+pw-16, py+ph-8, 10, 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; roundRect(ctx, px, py, pw, ph, 12); ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    let touchX: number | null = null;
    const onTouchStart = (e: TouchEvent) => { touchX = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX; touchX = null;
      const s = state.current; if (!s.playing || s.paused || s.over) return;
      if (Math.abs(dx) > 24) s.targetLane = dx > 0 ? Math.min(2, s.targetLane + 1) : Math.max(0, s.targetLane - 1);
      else { // tap sides
        const rect = canvas.getBoundingClientRect();
        const x = e.changedTouches[0].clientX - rect.left;
        s.targetLane = x < rect.width/2 ? Math.max(0, s.targetLane - 1) : Math.min(2, s.targetLane + 1);
      }
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(rafRef.current);
    };
  }, [ui.muted]);

  const start = () => { reset(true); };

  return (
    <GameShell
      title="Midnight Racer"
      subtitle="Traffic Racer"
      backHref={backHref}
      best={ui.best}
      stats={[{ label: 'Score', value: ui.score }, { label: 'Distance', value: `${ui.dist}m` }, { label: 'Speed', value: `x${(1 + (ui.level-1)*0.1).toFixed(1)}` }, { label: 'Level', value: ui.level }]}
      accent="#f59e0b"
      onPauseToggle={togglePause}
      paused={ui.paused}
      running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>}
      instructions={['Steer left/right to change lanes.', 'Avoid traffic vehicles — collisions end the run.', 'Speed and traffic intensity increase with distance.', 'Desktop: ← → or A/D. Mobile: tap or swipe left/right.', 'Press P to pause/resume.']}
      showStart={!ui.started && !ui.over}
      showGameOver={ui.over}
      onStart={start}
      onRestart={start}
      startLabel="Start Race"
      gameOverExtra={<div className="text-sm text-white/60">Distance: {ui.dist}m • Level {ui.level}</div>}
    >
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[520px] sm:h-[560px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{ touchAction: 'none' }} />
        {ui.paused && ui.started && !ui.over && (
          <div className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-sm flex items-center justify-center">
            <div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center">
              <p className="text-lg font-semibold">Paused</p>
              <p className="text-xs text-white/50 mt-1">Press Resume or P to continue</p>
            </div>
          </div>
        )}
        {!ui.started && !ui.over && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3 sm:hidden pointer-events-none">
            <span className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-[11px] text-white/70">Tap left / right to steer</span>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}
