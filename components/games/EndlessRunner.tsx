'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';

type Props = { backHref: string };
const STORAGE = 'dine_runner_best_v2';
const MUTE_KEY = 'dine_runner_muted_v2';

export default function EndlessRunner({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const game = useRef({
    playing: false, paused: false, over: false,
    lane: 1, targetLane: 1, laneX: [0, 0, 0],
    playerY: 0, baseY: 0, vy: 0, jumping: false, sliding: false, slideT: 0,
    speed: 320, distance: 0, score: 0, coins: 0, best: 0, level: 1,
    obstacles: [] as { lane: number; y: number; type: 'barrier' | 'low' | 'coin'; w: number; h: number; taken?: boolean }[],
    spawnT: 0, spawnEvery: 1.0,
    mission: { text: 'Collect 10 coins', target: 10, progress: 0, reward: 150, done: 0 },
  });
  const [ui, setUi] = useState({ started: false, paused: false, over: false, score: 0, best: 0, dist: 0, coins: 0, level: 1, muted: false, mission: 'Collect 10 coins', mProg: 0, mTarget: 10 });

  useEffect(() => {
    try { game.current.best = parseInt(localStorage.getItem(STORAGE) || '0', 10) || 0; } catch {}
    try { setUi(p => ({ ...p, best: game.current.best, muted: localStorage.getItem(MUTE_KEY) === '1' })); } catch {}
  }, []);

  const beep = (f = 440, d = 0.07, t: OscillatorType = 'sine', v = 0.05) => {
    if (ui.muted) return;
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current; const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = t; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d); o.stop(ctx.currentTime + d);
    } catch {}
  };

  const newMission = (level: number, done: number) => {
    const target = 8 + level * 2 + done * 2;
    return { text: `Collect ${target} coins`, target, progress: 0, reward: 120 + level * 30, done };
  };

  const reset = (start = false) => {
    const g = game.current;
    g.playing = start; g.paused = false; g.over = false;
    g.lane = 1; g.targetLane = 1; g.vy = 0; g.jumping = false; g.sliding = false; g.slideT = 0;
    g.speed = 320; g.distance = 0; g.score = 0; g.coins = 0; g.level = 1;
    g.obstacles = []; g.spawnT = 0; g.spawnEvery = 1.0; g.mission = newMission(1, 0);
    setUi(p => ({ ...p, started: start, paused: false, over: false, score: 0, dist: 0, coins: 0, level: 1, mission: g.mission.text, mProg: 0, mTarget: g.mission.target }));
    if (start) beep(600, 0.09, 'triangle');
  };

  useEffect(() => { reset(false); }, []);
  const toggleMute = () => setUi(p => { const m = !p.muted; try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch {} return { ...p, muted: m }; });
  const togglePause = () => { const g = game.current; if (!g.playing || g.over) return; g.paused = !g.paused; setUi(p => ({ ...p, paused: g.paused })); };

  const jump = () => { const g = game.current; if (!g.playing || g.paused || g.over || g.jumping) return; g.jumping = true; g.vy = -720; beep(520, 0.07, 'square', 0.04); };
  const slide = () => { const g = game.current; if (!g.playing || g.paused || g.over || g.sliding || g.jumping) return; g.sliding = true; g.slideT = 0.55; beep(260, 0.05, 'sawtooth', 0.03); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = game.current;
      if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
      if (!g.playing || g.paused || g.over) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') g.targetLane = Math.max(0, g.targetLane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') g.targetLane = Math.min(2, g.targetLane + 1);
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') { e.preventDefault(); jump(); }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); slide(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui.muted, ui.paused]);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width; const roadW = Math.min(360, w - 24); const left = (w - roadW) / 2; const laneW = roadW / 3;
      game.current.laneX = [left + laneW * 0.5, left + laneW * 1.5, left + laneW * 2.5];
      game.current.baseY = rect.height - 90; if (!game.current.jumping) game.current.playerY = game.current.baseY;
    };
    resize(); window.addEventListener('resize', resize);

    let last = performance.now(); let stripes = Array.from({ length: 12 }, (_, i) => i * 70);
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const rect = canvas.getBoundingClientRect(); const w = rect.width, h = rect.height;
      const g = game.current; const roadW = Math.min(360, w - 24); const left = (w - roadW) / 2; const laneW = roadW / 3;

      if (g.playing && !g.paused && !g.over) {
        g.distance += g.speed * dt * 0.06;
        g.score = Math.floor(g.distance) + g.coins * 10 + g.mission.done * 150;
        g.level = 1 + Math.floor(g.distance / 350);
        g.speed = 320 + (g.level - 1) * 28;
        g.spawnEvery = Math.max(0.45, 1.0 - (g.level - 1) * 0.05);
        g.spawnT += dt;
        if (g.spawnT >= g.spawnEvery) {
          g.spawnT = 0;
          const lane = Math.floor(Math.random() * 3);
          const roll = Math.random();
          if (roll < 0.45) g.obstacles.push({ lane, y: -60, type: 'barrier', w: laneW * 0.55, h: 46 });
          else if (roll < 0.7) g.obstacles.push({ lane, y: -60, type: 'low', w: laneW * 0.6, h: 34 });
          else g.obstacles.push({ lane, y: -40, type: 'coin', w: 22, h: 22 });
          if (Math.random() < 0.35) g.obstacles.push({ lane: (lane + 1 + Math.floor(Math.random()*2)) % 3, y: -140, type: 'coin', w: 22, h: 22 });
        }
        stripes = stripes.map(sy => { let ny = sy + g.speed * dt; if (ny > h) ny -= h + 70; return ny; });
        g.obstacles.forEach(o => o.y += g.speed * dt);
        g.obstacles = g.obstacles.filter(o => o.y < h + 80);

        if (Math.abs(g.laneX[g.targetLane] - g.laneX[g.lane]) < 1) g.lane = g.targetLane;
        if (g.jumping) { g.vy += 1700 * dt; g.playerY += g.vy * dt; if (g.playerY >= g.baseY) { g.playerY = g.baseY; g.vy = 0; g.jumping = false; } } else g.playerY = g.baseY;
        if (g.sliding) { g.slideT -= dt; if (g.slideT <= 0) g.sliding = false; }

        const px = g.laneX[g.targetLane]; const py = g.playerY; const pr = g.sliding ? 16 : 20; const ph = g.sliding ? 22 : 40;
        for (const o of g.obstacles) {
          const ox = g.laneX[o.lane]; const oy = o.y;
          if (o.type === 'coin') {
            if (!o.taken && Math.abs(px - ox) < pr + 12 && Math.abs(py - (oy)) < ph/2 + 12) {
              o.taken = true; g.coins += 1; g.mission.progress += 1; beep(880, 0.05, 'triangle', 0.04);
              if (g.mission.progress >= g.mission.target) { g.score += g.mission.reward; g.mission = newMission(g.level, g.mission.done + 1); beep(660, 0.12, 'sine', 0.06); }
            }
          } else {
            const oh = o.h; const collideY = Math.abs((py - ph/2) - oy) < (ph/2 + oh/2 - 4);
            const collideX = Math.abs(px - ox) < (pr + o.w/2 - 6);
            if (collideX && collideY) {
              const canJumpOver = o.type === 'barrier' && g.jumping && g.vy < 200;
              const canSlideUnder = o.type === 'low' && g.sliding;
              if (!canJumpOver && !canSlideUnder) {
                g.over = true; g.playing = false;
                const best = Math.max(g.best, g.score); g.best = best; try { localStorage.setItem(STORAGE, String(best)); } catch {}
                setUi(p => ({ ...p, over: true, started: false, score: g.score, best, dist: Math.floor(g.distance), coins: g.coins, level: g.level }));
                beep(110, 0.3, 'sawtooth', 0.08);
              }
            }
          }
        }
        g.obstacles = g.obstacles.filter(o => !(o.type === 'coin' && o.taken));
        setUi(p => ({ ...p, score: g.score, dist: Math.floor(g.distance), coins: g.coins, level: g.level, mission: g.mission.text, mProg: g.mission.progress, mTarget: g.mission.target }));
      }

      // draw
      ctx.clearRect(0,0,w,h);
      const bg = ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#17140f'); bg.addColorStop(1,'#090908'); ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#1a1814'; ctx.fillRect(left, 0, roadW, h);
      ctx.strokeStyle = 'rgba(184,164,122,0.45)'; ctx.lineWidth = 2; ctx.strokeRect(left+1, 0, roadW-2, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([18,18]);
      for (let i=1;i<3;i++){ ctx.beginPath(); ctx.moveTo(left+laneW*i,0); ctx.lineTo(left+laneW*i,h); ctx.stroke(); }
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(243,239,231,0.22)';
      stripes.forEach(sy => { for(let i=1;i<3;i++) ctx.fillRect(left+laneW*i-2, sy, 4, 26); });

      // obstacles
      g.obstacles.forEach(o => {
        const x = g.laneX[o.lane];
        if (o.type === 'coin') {
          ctx.beginPath(); ctx.arc(x, o.y, 11, 0, Math.PI*2); ctx.fillStyle = '#d8c28f'; ctx.fill();
          ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#7a6537'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¢', x, o.y+0.5);
        } else if (o.type === 'barrier') {
          const bx = x - o.w/2, by = o.y - o.h/2; roundRect(ctx,bx,by,o.w,o.h,8); ctx.fillStyle = '#8c2f2f'; ctx.fill();
          ctx.fillStyle = '#d9b15f'; for(let i=0;i<4;i++) ctx.fillRect(bx+6+i*(o.w-12)/4, by+6, 6, o.h-12);
        } else {
          const bx = x - o.w/2, by = o.y - o.h/2; roundRect(ctx,bx,by,o.w,o.h,8); ctx.fillStyle = '#374151'; ctx.fill();
          ctx.fillStyle = '#60a5fa'; ctx.fillRect(bx+6, by+6, o.w-12, 6);
        }
      });

      // player
      const px = g.laneX[g.targetLane]; const py = g.playerY; const bodyH = g.sliding ? 22 : 40; const bodyW = g.sliding ? 34 : 26;
      ctx.save(); ctx.translate(px, py);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI*2); ctx.fill();
      // body
      roundRect(ctx, -bodyW/2, -bodyH, bodyW, bodyH, 8); const pg = ctx.createLinearGradient(0,-bodyH,0,0); pg.addColorStop(0,'#f3e7c3'); pg.addColorStop(1,'#b8a47a'); ctx.fillStyle = pg; ctx.fill();
      if (!g.sliding) { ctx.beginPath(); ctx.arc(0, -bodyH-10, 10, 0, Math.PI*2); ctx.fillStyle = '#f1e4c4'; ctx.fill(); }
      // legs animation cue
      ctx.strokeStyle = '#1c1914'; ctx.lineWidth = 3; const step = Math.sin(now/80) * 6;
      if (!g.jumping) { ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-10-step, 14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(10+step, 14); ctx.stroke(); }
      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    let tStart: {x:number;y:number}|null = null;
    const onTs = (e: TouchEvent) => { tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTe = (e: TouchEvent) => {
      if (!tStart) return; const dx = e.changedTouches[0].clientX - tStart.x; const dy = e.changedTouches[0].clientY - tStart.y; tStart = null;
      const g = game.current; if (!g.playing || g.paused || g.over) return;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) g.targetLane = dx > 0 ? Math.min(2, g.targetLane + 1) : Math.max(0, g.targetLane - 1);
      else if (Math.abs(dy) > 24) { if (dy < 0) jump(); else slide(); }
      else { const rect = canvas.getBoundingClientRect(); const x = e.changedTouches[0].clientX - rect.left; if (x < rect.width*0.33) g.targetLane = Math.max(0,g.targetLane-1); else if (x > rect.width*0.66) g.targetLane = Math.min(2,g.targetLane+1); else jump(); }
    };
    canvas.addEventListener('touchstart', onTs, { passive: true });
    canvas.addEventListener('touchend', onTe, { passive: true });

    return () => { window.removeEventListener('resize', resize); canvas.removeEventListener('touchstart', onTs); canvas.removeEventListener('touchend', onTe); cancelAnimationFrame(rafRef.current); };
  }, [ui.muted]);

  return (
    <GameShell
      title="Neon Sprint"
      subtitle="Endless Runner"
      backHref={backHref}
      best={ui.best}
      stats={[{ label: 'Score', value: ui.score }, { label: 'Distance', value: `${ui.dist}m` }, { label: 'Coins', value: ui.coins }, { label: 'Best', value: ui.best }]}
      accent="#B8A47A"
      onPauseToggle={togglePause}
      paused={ui.paused}
      running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>}
      instructions={['Three lanes: move left/right to dodge.', 'Jump over barriers, slide under low beams.', 'Collect coins, complete missions, survive as speed rises.', 'Desktop: ← → move, ↑/Space jump, ↓ slide, P pause.', 'Mobile: swipe to move/jump/slide or tap zones.']}
      showStart={!ui.started && !ui.over}
      showGameOver={ui.over}
      onStart={() => reset(true)}
      onRestart={() => reset(true)}
      startLabel="Start Run"
      gameOverExtra={<div className="text-sm text-white/60 space-y-1"><div>Score {ui.score} • {ui.dist}m • {ui.coins} coins</div><div>Level {ui.level} • Missions cleared: {game.current.mission.done}</div></div>}
    >
      <div className="mb-3 rounded-xl border border-[rgba(184,164,122,0.25)] bg-[rgba(184,164,122,0.08)] px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.18em] text-[rgba(243,239,231,0.6)]">Mission</div><div className="text-sm font-medium truncate">{ui.mission}</div></div>
        <div className="shrink-0 text-sm text-[#D9CBAB] font-semibold">{Math.min(ui.mProg, ui.mTarget)}/{ui.mTarget}</div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[520px] sm:h-[560px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{ touchAction: 'none' }} />
        {ui.paused && ui.started && !ui.over && (
          <div className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-sm flex items-center justify-center">
            <div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center">
              <p className="text-lg font-semibold">Paused</p>
              <p className="text-xs text-white/50 mt-1">Resume to keep running</p>
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
