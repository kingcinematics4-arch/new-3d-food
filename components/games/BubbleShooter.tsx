'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';

type Props = { backHref: string };
const STORAGE = 'dine_bubble_best_v2';
const MUTE_KEY = 'dine_bubble_muted_v2';
const COLORS = ['#EF5350','#42A5F5','#66BB6A','#FFCA28','#AB47BC','#26C6DA'];

type Bubble = { x:number; y:number; color:string; row:number; col:number } | null;

export default function BubbleShooter({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const g = useRef({
    started: false, over: false, won: false, paused: false,
    grid: [] as Bubble[][], rows: 0, cols: 11, r: 16,
    ox: 0, oy: 40, stepY: 0,
    shooter: { x: 0, y: 0, angle: -Math.PI/2 },
    current: '#EF5350', next: '#42A5F5',
    projectile: null as { x:number;y:number;vx:number;vy:number;color:string } | null,
    score: 0, best: 0, level: 1, shots: 0, target: 0, cleared: 0,
  });
  const [ui, setUi] = useState({ started:false, paused:false, over:false, won:false, score:0, best:0, level:1, shotsLeft:0, target:0, muted:false });

  useEffect(() => { try { g.current.best = parseInt(localStorage.getItem(STORAGE)||'0',10)||0; } catch {} try { setUi(p=>({...p,best:g.current.best, muted: localStorage.getItem(MUTE_KEY)==='1'})); } catch {} }, []);

  const beep = (f=440,d=0.07,t:OscillatorType='sine',v=0.05) => {
    if (ui.muted) return;
    try { if(!audioRef.current) audioRef.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const ctx=audioRef.current,o=ctx.createOscillator(),ga=ctx.createGain(); o.type=t;o.frequency.value=f;ga.gain.value=v;o.connect(ga);ga.connect(ctx.destination);
      o.start(); ga.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+d); o.stop(ctx.currentTime+d);
    } catch {}
  };

  const gridPos = (row:number,col:number) => {
    const s=g.current; const offset = row%2 ? s.r : 0; return { x: s.ox + offset + col*s.r*2, y: s.oy + row*s.stepY };
  };
  const nearestCell = (x:number,y:number) => {
    const s=g.current; let best={row:0,col:0,dist:Infinity};
    for(let row=0; row<s.rows+6; row++){
      const maxCol = s.cols - (row%2?1:0);
      for(let col=0; col<maxCol; col++){
        const p=gridPos(row,col); const d=(p.x-x)**2+(p.y-y)**2; if(d<best.dist) best={row,col,dist:d};
      }
    }
    return { row: best.row, col: best.col };
  };

  const colorsInGrid = () => {
    const set = new Set<string>();
    for (const row of g.current.grid) for (const b of row) if (b) set.add(b.color);
    return [...set];
  };
  const pickColor = () => { const c = colorsInGrid(); const pool = c.length ? c : COLORS; return pool[Math.floor(Math.random()*pool.length)]; };

  const buildLevel = (level:number) => {
    const s=g.current; s.rows = 12; s.cols = 11; s.grid = Array.from({length: s.rows+8}, (_,row)=> Array.from({length: s.cols - (row%2?1:0)}, ()=>null as Bubble));
    const filled = Math.min(6 + level, 10);
    for(let row=0; row<filled; row++){
      for(let col=0; col<s.grid[row].length; col++){
        if (Math.random() < 0.08 && row>1) continue;
        const p=gridPos(row,col); s.grid[row][col]={ x:p.x,y:p.y,color:COLORS[Math.floor(Math.random()*COLORS.length)],row,col };
      }
    }
    s.level=level; s.shots = 40 + Math.max(0, 6-level)*3; s.target = Math.max(12, filled * 4 - level); s.cleared = 0; s.over=false; s.won=false; s.projectile=null;
    s.current = pickColor(); s.next = pickColor();
  };

  const reset = (start=false, level=1) => {
    const s=g.current; s.started=start; s.paused=false; s.score = level===1?0:s.score; buildLevel(level);
    setUi(p=>({ ...p, started:start, paused:false, over:false, won:false, score:s.score, level:s.level, shotsLeft:s.shots, target:s.target }));
    if(start) beep(520,0.08,'triangle');
  };
  useEffect(()=>{ reset(false,1); },[]);
  const toggleMute = () => setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause = () => { const s=g.current; if(!s.started||s.over||s.won) return; s.paused=!s.paused; setUi(p=>({...p,paused:s.paused})); };

  const neighbors = (row:number,col:number) => {
    const odd = row%2!==0; const deltas = odd ? [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]] : [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
    const res: {row:number;col:number}[]=[];
    for(const [dr,dc] of deltas){ const nr=row+dr,nc=col+dc; if(nr>=0 && nr<g.current.grid.length && nc>=0 && nc<g.current.grid[nr].length) res.push({row:nr,col:nc}); }
    return res;
  };

  const clusterAt = (row:number,col:number,color:string) => {
    const s=g.current; const key=(r:number,c:number)=>`${r},${c}`; const seen=new Set<string>(); const q=[{row,col}]; seen.add(key(row,col)); const out:{row:number;col:number}[]=[];
    while(q.length){ const cur=q.shift()!; out.push(cur); for(const n of neighbors(cur.row,cur.col)){ const k=key(n.row,n.col); const b=s.grid[n.row]?.[n.col]; if(!b||b.color!==color||seen.has(k)) continue; seen.add(k); q.push(n); } }
    return out;
  };
  const removeFloating = () => {
    const s=g.current; const connected=new Set<string>(); const key=(r:number,c:number)=>`${r},${c}`; const q:{row:number;col:number}[]=[];
    for(let c=0;c<s.grid[0].length;c++){ if(s.grid[0][c]){ q.push({row:0,col:c}); connected.add(key(0,c)); } }
    while(q.length){ const cur=q.shift()!; for(const n of neighbors(cur.row,cur.col)){ const k=key(n.row,n.col); if(connected.has(k)||!s.grid[n.row]?.[n.col]) continue; connected.add(k); q.push(n);} }
    let dropped=0;
    for(let r=0;r<s.grid.length;r++) for(let c=0;c<s.grid[r].length;c++){ if(s.grid[r][c] && !connected.has(key(r,c))){ s.grid[r][c]=null; dropped++; } }
    return dropped;
  };

  const placeProjectile = () => {
    const s=g.current; if(!s.projectile) return; const p=s.projectile; const cell = nearestCell(p.x,p.y);
    let {row,col}=cell; row=Math.max(0, Math.min(s.grid.length-1,row)); col=Math.max(0, Math.min(s.grid[row].length-1,col));
    if(s.grid[row][col]){ // find nearest empty around
      let found=false; const q=[{row,col}]; const seen=new Set([`${row},${col}`]);
      while(q.length && !found){ const cur=q.shift()!; for(const n of neighbors(cur.row,cur.col)){ const k=`${n.row},${n.col}`; if(seen.has(k)) continue; seen.add(k); if(!s.grid[n.row][n.col]){ row=n.row; col=n.col; found=true; break; } q.push(n); } }
    }
    const pos=gridPos(row,col); s.grid[row][col]={x:pos.x,y:pos.y,color:p.color,row,col}; s.projectile=null; beep(300,0.04,'square',0.04);
    const cluster=clusterAt(row,col,p.color);
    let gained=0;
    if(cluster.length>=3){
      for(const c of cluster) s.grid[c.row][c.col]=null; gained += cluster.length*10; const drop=removeFloating(); gained += drop*15; s.cleared += cluster.length + drop; beep(720,0.09,'triangle',0.06);
    }
    s.score += gained; s.shots -= 1; s.current = s.next; s.next = pickColor();

    // lose if any bubble below danger line
    const dangerY = s.shooter.y - 50;
    let hitBottom=false; for(const rowArr of s.grid) for(const b of rowArr) if(b && b.y >= dangerY) hitBottom=true;
    const anyLeft = s.grid.some(r=>r.some(Boolean));
    if(!anyLeft || s.cleared >= s.target){ s.won=true; s.started=false; s.score += s.shots*5 + 100; beep(660,0.18,'sine',0.07); const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,won:true,started:false,score:s.score,best,shotsLeft:s.shots})); return; }
    if(hitBottom || s.shots<=0){ s.over=true; s.started=false; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,over:true,started:false,score:s.score,best,shotsLeft:s.shots})); beep(120,0.25,'sawtooth',0.07); return; }
    setUi(p=>({...p,score:s.score,shotsLeft:s.shots,best:Math.max(p.best,s.score)}));
  };

  useEffect(()=>{
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    const resize=()=>{
      const dpr=Math.min(window.devicePixelRatio||1,2); const rect=canvas.getBoundingClientRect();
      canvas.width=Math.floor(rect.width*dpr); canvas.height=Math.floor(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
      const s=g.current; const w=rect.width,h=rect.height; s.r = Math.max(12, Math.min(18, Math.floor((w-24)/(s.cols*2))));
      const gridW = s.cols*s.r*2; s.ox = Math.floor((w-gridW)/2 + s.r); s.oy = 36; s.stepY = Math.floor(s.r*1.75);
      s.shooter.x = w/2; s.shooter.y = h - 48;
      // reposition existing bubbles
      for(let row=0;row<s.grid.length;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(b){ const p=gridPos(row,col); b.x=p.x; b.y=p.y; b.row=row; b.col=col; } }
    };
    resize(); window.addEventListener('resize', resize);
    let last=performance.now();
    const loop=(now:number)=>{
      const dt=Math.min(0.033,(now-last)/1000); last=now; const s=g.current; const rect=canvas.getBoundingClientRect(); const w=rect.width,h=rect.height;
      if(s.started && !s.paused && !s.over && !s.won && s.projectile){
        const p=s.projectile; p.x += p.vx*dt; p.y += p.vy*dt;
        if(p.x < s.ox-s.r+2){ p.x = s.ox-s.r+2; p.vx *= -1; }
        if(p.x > w - (s.ox-s.r+2)){ p.x = w - (s.ox-s.r+2); p.vx *= -1; }
        if(p.y < s.oy){ placeProjectile(); }
        else {
          let hit=false;
          for(let row=0;row<s.grid.length && !hit;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(!b) continue; const dx=b.x-p.x, dy=b.y-p.y; if(dx*dx+dy*dy <= (s.r*1.85)**2){ hit=true; break; } }
          if(hit) placeProjectile();
        }
      }
      // draw
      ctx.clearRect(0,0,w,h); const bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#121725'); bg.addColorStop(1,'#08090d'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
      // ceiling glow
      const cg=ctx.createLinearGradient(0,0,0,80); cg.addColorStop(0,'rgba(184,164,122,0.18)'); cg.addColorStop(1,'transparent'); ctx.fillStyle=cg; ctx.fillRect(0,0,w,80);
      // danger line
      ctx.strokeStyle='rgba(239,68,68,0.35)'; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.moveTo(10,s.shooter.y-50); ctx.lineTo(w-10,s.shooter.y-50); ctx.stroke(); ctx.setLineDash([]);
      // bubbles
      for(let row=0;row<s.grid.length;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(!b) continue; drawBubble(ctx,b.x,b.y,s.r-1,b.color); }
      // aim guide
      if(s.started && !s.paused && !s.over && !s.won && !s.projectile){
        ctx.strokeStyle='rgba(243,239,231,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.shooter.x,s.shooter.y);
        const len=70; ctx.lineTo(s.shooter.x+Math.cos(s.shooter.angle)*len, s.shooter.y+Math.sin(s.shooter.angle)*len); ctx.stroke();
      }
      // projectile
      if(s.projectile) drawBubble(ctx,s.projectile.x,s.projectile.y,s.r-1,s.projectile.color);
      // shooter base
      ctx.save(); ctx.translate(s.shooter.x,s.shooter.y);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(0,0,26,Math.PI,0); ctx.fill();
      ctx.rotate(s.shooter.angle+Math.PI/2); roundRect(ctx,-8,-34,16,30,8); ctx.fillStyle='#B8A47A'; ctx.fill();
      ctx.restore();
      // current/next
      drawBubble(ctx,s.shooter.x,s.shooter.y, s.r, s.current);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center'; ctx.fillText('NEXT', w-42, h-52);
      drawBubble(ctx,w-42,h-30,s.r-3,s.next);

      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);

    const setAim = (clientX:number,clientY:number) => {
      const rect=canvas.getBoundingClientRect(); const x=clientX-rect.left, y=clientY-rect.top; const s=g.current;
      let a=Math.atan2(y-s.shooter.y,x-s.shooter.x); const min=-Math.PI+0.25, max=-0.25; if(a>max) a=max; if(a<min) a=min; s.shooter.angle=a;
    };
    const shoot = () => {
      const s=g.current; if(!s.started||s.paused||s.over||s.won||s.projectile) return; const speed=720;
      s.projectile={ x:s.shooter.x + Math.cos(s.shooter.angle)*(s.r+8), y:s.shooter.y + Math.sin(s.shooter.angle)*(s.r+8), vx:Math.cos(s.shooter.angle)*speed, vy:Math.sin(s.shooter.angle)*speed, color:s.current };
      beep(480,0.05,'square',0.04);
    };
    const onMove=(e:PointerEvent)=>{ if(g.current.started && !g.current.projectile) setAim(e.clientX,e.clientY); };
    const onDown=(e:PointerEvent)=>{ setAim(e.clientX,e.clientY); shoot(); };
    canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerdown',onDown);
    return ()=>{ window.removeEventListener('resize',resize); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerdown',onDown); cancelAnimationFrame(rafRef.current); };
  },[ui.muted]);

  const nextLevel = () => reset(true, g.current.level + 1);

  return (
    <GameShell
      title="Bubble Pop"
      subtitle="Bubble Shooter"
      backHref={backHref}
      best={ui.best}
      stats={[{ label:'Score', value: ui.score }, { label:'Level', value: ui.level }, { label:'Shots', value: ui.shotsLeft }, { label:'Best', value: ui.best }]}
      accent="#42A5F5"
      onPauseToggle={togglePause}
      paused={ui.paused}
      running={ui.started && !ui.over && !ui.won}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>}
      instructions={['Aim and shoot to attach bubbles to the cluster.', 'Match 3+ of the same color to pop them; floating clusters drop for bonus.', `Clear the target bubbles before shots run out. Don't let bubbles cross the danger line.`,'Desktop: move mouse to aim, click to shoot. Mobile: drag to aim, tap/release to shoot.']}
      showStart={!ui.started && !ui.over && !ui.won}
      showGameOver={ui.over}
      onStart={()=>reset(true,1)}
      onRestart={()=>reset(true,1)}
      startLabel="Start Level 1"
      gameOverTitle="Level Failed"
      gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Level {ui.level} • Target {ui.target}</div>}
    >
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[560px] sm:h-[600px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{ touchAction: 'none' }} />
        {ui.paused && ui.started && !ui.over && !ui.won && (
          <div className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p></div></div>
        )}
        {ui.won && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center p-5">
            <div className="max-w-sm w-full text-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">Level {ui.level} clear</p>
              <h2 className="text-3xl font-light tracking-tight mb-2 text-[#7dd3fc]">Great Shot!</h2>
              <div className="text-sm text-white/65 mb-5">Score {ui.score} • Bonus for remaining shots applied</div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button onClick={nextLevel} className="px-6 py-3 rounded-xl font-semibold text-black bg-[#7dd3fc]">Next Level</button>
                <a href={backHref} className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-medium">Arcade</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function drawBubble(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){
  const grad=ctx.createRadialGradient(x-r*0.35,y-r*0.35,r*0.2,x,y,r); grad.addColorStop(0,'#ffffff'); grad.addColorStop(0.25,color); grad.addColorStop(1,shade(color,-30));
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.stroke();
}
function shade(hex:string,amt:number){ const c=hex.replace('#',''); const n=parseInt(c,16); let r=(n>>16)+amt,g=((n>>8)&0xff)+amt,b=(n&0xff)+amt; r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b)); return `rgb(${r},${g},${b})`; }
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
