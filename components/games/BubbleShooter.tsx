'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';
import { useGameQuality } from './useGameQuality';

type Props = { backHref: string };
const STORAGE = 'dine_bubble_best_v2';
const MUTE_KEY = 'dine_bubble_muted_v2';
const COLORS = ['#EF5350','#42A5F5','#66BB6A','#FFCA28','#AB47BC','#26C6DA'];
const COLS = 11;

type Bubble = { x:number;y:number;z:number;color:string;row:number;col:number;alive:boolean;popping?:number;dropVy?:number } | null;

export default function BubbleShooter({ backHref }: Props) {
  const { is3D, ready } = useGameQuality();
  if (!ready) return <div className="min-h-screen bg-[#050505]" />;
  return is3D ? <Bubble3D backHref={backHref} /> : <BubbleFallback backHref={backHref} />;
}

function useBeep(muted:boolean){ const a=useRef<AudioContext|null>(null); return (f=440,d=0.07,t:OscillatorType='sine',v=0.05)=>{ if(muted) return; try{ if(!a.current) a.current=new (window.AudioContext||(window as any).webkitAudioContext)(); const ctx=a.current,o=ctx.createOscillator(),g=ctx.createGain(); o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+d); o.stop(ctx.currentTime+d);}catch{} }; }

function Bubble3D({ backHref }: Props) {
  const g = useRef({ started:false,paused:false,over:false,won:false, grid:[] as Bubble[][], r:0.32, stepY:0.56, shooter:{x:0,y:-4.2,angle:Math.PI/2}, current:COLORS[0], next:COLORS[1], projectile:null as {x:number;y:number;z:number;vx:number;vy:number;color:string,trail:{x:number;y:number}[]} | null, score:0,best:0,level:1,shots:0,target:0,cleared:0 });
  const [ui,setUi]=useState({started:false,paused:false,over:false,won:false,score:0,best:0,level:1,shotsLeft:0,target:0,muted:false});
  useEffect(()=>{try{g.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:g.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=useBeep(ui.muted);

  const gridPos=(row:number,col:number)=>{ const s=g.current; const offset = row%2 ? s.r : 0; const w = COLS*s.r*2; const ox = -w/2 + s.r + offset; return { x: ox + col*s.r*2, y: 4.2 - row*s.stepY, z:0 }; };
  const colorsInGrid=()=>{ const set=new Set<string>(); for(const row of g.current.grid) for(const b of row) if(b&&b.alive&&!b.dropVy) set.add(b.color); return [...set]; };
  const pickColor=()=>{ const c=colorsInGrid(); const pool=c.length?c:COLORS; return pool[Math.floor(Math.random()*pool.length)]; };
  const buildLevel=(level:number)=>{ const s=g.current; const rows=12; s.grid=Array.from({length:rows+8},(_,row)=>Array.from({length:COLS-(row%2?1:0)},()=>null as Bubble)); const filled=Math.min(6+level,10);
    for(let row=0;row<filled;row++){ for(let col=0;col<s.grid[row].length;col++){ if(Math.random()<0.07 && row>1) continue; const p=gridPos(row,col); s.grid[row][col]={...p,color:COLORS[Math.floor(Math.random()*COLORS.length)],row,col,alive:true}; } }
    s.level=level; s.shots=40+Math.max(0,6-level)*3; s.target=Math.max(12,filled*4-level); s.cleared=0; s.over=false; s.won=false; s.projectile=null; s.current=pickColor(); s.next=pickColor(); };
  const reset=(start=false,level=1)=>{ const s=g.current; s.started=start; s.paused=false; if(level===1) s.score=0; buildLevel(level); setUi(p=>({...p,started:start,paused:false,over:false,won:false,score:s.score,level:s.level,shotsLeft:s.shots,target:s.target})); if(start) beep(520,0.08,'triangle'); };
  useEffect(()=>{ reset(false,1); },[]);
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>{ const s=g.current; if(!s.started||s.over||s.won) return; s.paused=!s.paused; setUi(p=>({...p,paused:s.paused})); };

  const neighbors=(row:number,col:number)=>{ const odd=row%2!==0; const deltas=odd?[[ -1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]:[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]; const res:{row:number;col:number}[]=[]; for(const [dr,dc] of deltas){ const nr=row+dr,nc=col+dc; if(nr>=0&&nr<g.current.grid.length&&nc>=0&&nc<g.current.grid[nr].length) res.push({row:nr,col:nc}); } return res; };
  const clusterAt=(row:number,col:number,color:string)=>{ const s=g.current, key=(r:number,c:number)=>`${r},${c}`, seen=new Set<string>(), q=[{row,col}]; seen.add(key(row,col)); const out:{row:number;col:number}[]=[]; while(q.length){ const cur=q.shift()!; out.push(cur); for(const n of neighbors(cur.row,cur.col)){ const k=key(n.row,n.col); const b=s.grid[n.row]?.[n.col]; if(!b||!b.alive||b.dropVy||b.color!==color||seen.has(k)) continue; seen.add(k); q.push(n);} } return out; };
  const removeFloating=()=>{ const s=g.current, connected=new Set<string>(), key=(r:number,c:number)=>`${r},${c}`, q:{row:number;col:number}[]=[]; for(let c=0;c<s.grid[0].length;c++){ const b=s.grid[0][c]; if(b&&b.alive&&!b.dropVy){ q.push({row:0,col:c}); connected.add(key(0,c)); } } while(q.length){ const cur=q.shift()!; for(const n of neighbors(cur.row,cur.col)){ const k=key(n.row,n.col); const b=s.grid[n.row]?.[n.col]; if(connected.has(k)||!b||!b.alive||b.dropVy) continue; connected.add(k); q.push(n);} } let dropped=0; for(let r=0;r<s.grid.length;r++) for(let c=0;c<s.grid[r].length;c++){ const b=s.grid[r][c]; if(b&&b.alive&&!b.dropVy && !connected.has(key(r,c))){ b.dropVy=0.1; b.alive=false; dropped++; } } return dropped; };

  const placeProjectile=()=>{ const s=g.current; if(!s.projectile) return; const p=s.projectile; // nearest empty cell
    let best={row:0,col:0,dist:Infinity}; for(let row=0;row<s.grid.length;row++) for(let col=0;col<s.grid[row].length;col++){ const gp=gridPos(row,col); const d=(gp.x-p.x)**2+(gp.y-p.y)**2; if(d<best.dist) best={row,col,dist:d}; }
    let {row,col}=best; row=Math.max(0,Math.min(s.grid.length-1,row)); col=Math.max(0,Math.min(s.grid[row].length-1,col));
    if(s.grid[row][col] && s.grid[row][col]!.alive){ // bfs to find empty
      let found=false; const q=[{row,col}], seen=new Set([`${row},${col}`]); while(q.length&&!found){ const cur=q.shift()!; for(const n of neighbors(cur.row,cur.col)){ const k=`${n.row},${n.col}`; if(seen.has(k)) continue; seen.add(k); const b=s.grid[n.row][n.col]; if(!b||!b.alive){ row=n.row; col=n.col; found=true; break;} q.push(n);} } }
    const pos=gridPos(row,col); s.grid[row][col]={...pos,color:p.color,row,col,alive:true}; s.projectile=null; beep(300,0.04,'square',0.04);
    const cluster=clusterAt(row,col,p.color); let gained=0; if(cluster.length>=3){ for(const c of cluster){ const b=s.grid[c.row][c.col]; if(b){ b.popping=0.001; b.alive=false; } } gained+=cluster.length*10; const drop=removeFloating(); gained+=drop*15; s.cleared+=cluster.length+drop; beep(720,0.09,'triangle',0.06); }
    s.score+=gained; s.shots-=1; s.current=s.next; s.next=pickColor();
    const dangerY = s.shooter.y + 0.9; let hitBottom=false; for(const rowArr of s.grid) for(const b of rowArr) if(b&&b.alive && b.y <= dangerY) hitBottom=true;
    const anyLeft = s.grid.some(r=>r.some(b=>b&&b.alive));
    if(!anyLeft || s.cleared >= s.target){ s.won=true; s.started=false; s.score += s.shots*5 + 100; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,won:true,started:false,score:s.score,best,shotsLeft:s.shots})); beep(660,0.18,'sine',0.07); return; }
    if(hitBottom || s.shots<=0){ s.over=true; s.started=false; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,over:true,started:false,score:s.score,best,shotsLeft:s.shots})); beep(120,0.25,'sawtooth',0.07); return; }
    setUi(p=>({...p,score:s.score,shotsLeft:s.shots,best:Math.max(p.best,s.score)}));
  };

  const aimRef = useRef(0);
  return (
    <GameShell title="Orbital Pop" subtitle="3D Bubble Shooter" backHref={backHref} best={ui.best}
      stats={[{label:'Score',value:ui.score},{label:'Level',value:ui.level},{label:'Shots',value:ui.shotsLeft},{label:'Best',value:ui.best}]}
      accent="#42A5F5" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over && !ui.won}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>}
      instructions={['Aim and shoot to attach glossy orbs to the cluster.','Match 3+ of the same color to pop; floating clusters drop for bonus.','Clear the target before shots run out and before orbs cross the danger line.','Desktop: move to aim, click to shoot. Mobile: drag to aim, tap to shoot.']}
      showStart={!ui.started && !ui.over && !ui.won} showGameOver={ui.over} onStart={()=>reset(true,1)} onRestart={()=>reset(true,1)} startLabel="Start Level 1" gameOverTitle="Level Failed"
      gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Level {ui.level} • Target {ui.target}</div>}>
<div className="relative h-[600px] sm:h-[640px] w-full" style={{touchAction:'none'}}>
        <Canvas shadows dpr={[1,1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}>
            <BubbleScene g={g} setUi={setUi} placeProjectile={placeProjectile} beep={beep} />
          </Suspense>
        </Canvas>
        {ui.paused && ui.started && !ui.over && !ui.won && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p></div></div>}
        {ui.won && <div className="absolute inset-0 z-20 rounded-2xl bg-black/65 backdrop-blur-md flex items-center justify-center p-5"><div className="max-w-sm w-full text-center rounded-2xl border border-white/10 bg-black/40 p-6"><p className="text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">Level {ui.level} clear</p><h2 className="text-3xl font-light tracking-tight mb-2 text-[#7dd3fc]">Great Shot!</h2><div className="text-sm text-white/65 mb-5">Score {ui.score} • Bonus applied</div><div className="flex gap-2 justify-center"><button onClick={()=>reset(true,g.current.level+1)} className="px-6 py-3 rounded-xl font-semibold text-black bg-[#7dd3fc]">Next Level</button><a href={backHref} className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-medium">Arcade</a></div></div></div>}
      </div>
    </GameShell>
  );
}

function BubbleScene({ g, setUi, placeProjectile, beep }: any) {
  const group=useRef<THREE.Group>(null);
  // Full-screen invisible plane so the player can aim by dragging ANYWHERE on
  // the canvas, not just the tiny shooter mesh. Pointer capture keeps the
  // events flowing while the finger moves off the mesh.
  const aimPlane = useRef<THREE.Mesh>(null);
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const raycaster = new THREE.Raycaster();
  const aimPlaneNormal = new THREE.Vector3(0,0,1);
  const aimTarget = new THREE.Vector3();

  const aimFromEvent = (e:any) => {
    const s = g.current;
    if (!s.started || s.paused || s.over || s.won || s.projectile) return;
    // Use the canvas element's own bounding rect so the coordinates are
    // relative to the rendered game area. The previous code divided raw
    // clientX/clientY by window dimensions, which only works when the canvas
    // fills the whole window and breaks on scaled/padded layouts and mobile.
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ndcX = (x / rect.width) * 2 - 1;
    const ndcY = -((y / rect.height) * 2 - 1);
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera.current!);
    const plane = new THREE.Plane(aimPlaneNormal, 0);
    raycaster.ray.intersectPlane(plane, aimTarget);
    // aimTarget is in world space; shooter sits at (s.shooter.x, s.shooter.y, 0)
    const ang = Math.atan2(aimTarget.y - s.shooter.y, aimTarget.x - s.shooter.x);
    s.shooter.angle = ang;
  };

  const onDown = (e:any) => {
    if (!g.current.started || g.current.paused || g.current.over || g.current.won || g.current.projectile) return;
    e.stopPropagation();
    aimFromEvent(e);
    g.current.shooting = true;
    // Keep pointermove/pointerup firing while the finger leaves the mesh.
    try { (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId); } catch {}
  };
  const onMove = (e:any) => {
    if (!g.current.shooting) return;
    e.stopPropagation();
    aimFromEvent(e);
  };
  const onUp = (e:any) => {
    if (!g.current.shooting) return;
    e.stopPropagation();
    g.current.shooting = false;
    try { (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {}
    const s = g.current;
    if (s.projectile) return;
    const speed = 10;
    s.projectile = {
      x: s.shooter.x + Math.cos(s.shooter.angle) * 0.5,
      y: s.shooter.y + Math.sin(s.shooter.angle) * 0.5,
      z: 0,
      vx: Math.cos(s.shooter.angle) * speed,
      vy: Math.sin(s.shooter.angle) * speed,
      color: s.current,
      trail: []
    };
    beep(480, 0.05, 'square', 0.04);
  };

  useFrame((_, dt) => {
    const s=g.current; if(dt>0.05) dt=0.05;
    if(s.started && !s.paused && !s.over && !s.won && s.projectile){
      const p=s.projectile; p.x+=p.vx*dt; p.y+=p.vy*dt; p.trail.push({x:p.x,y:p.y}); if(p.trail.length>10) p.trail.shift();
      const bound = COLS*s.r - 0.2; if(p.x < -bound){ p.x=-bound; p.vx*=-1; } if(p.x > bound){ p.x=bound; p.vx*=-1; }
      if(p.y > 4.4){ placeProjectile(); }
      else {
        let hit=false; for(let row=0;row<s.grid.length&&!hit;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(!b||!b.alive) continue; const dx=b.x-p.x, dy=b.y-p.y; if(dx*dx+dy*dy < (s.r*1.85)**2){ hit=true; break; } }
        if(hit) placeProjectile();
      }
    }
    // animate pops/falls
    for(const row of s.grid) for(const b of row){ if(!b) continue; if(b.popping){ b.popping += dt; } if(b.dropVy!==undefined){ b.dropVy += 18*dt; b.y -= b.dropVy*dt; } }
  });
const s=g.current;
  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault position={[0,0,9.5]} fov={50} />
      <color attach="background" args={['#060814']} /><fog attach="fog" args={['#060814', 10, 22]} />
      <ambientLight intensity={0.45} /><directionalLight position={[4,6,6]} intensity={1.2} castShadow /><pointLight position={[-4,2,4]} intensity={1} color="#7fd3ff" />
      <mesh position={[0,4.7,-0.5]}><boxGeometry args={[COLS*s.r*2+1.2,0.4,1]} /><meshStandardMaterial color="#B8A47A" metalness={0.5} roughness={0.3} emissive="#6b5630" emissiveIntensity={0.2} /></mesh>
      <mesh position={[0,-3.2,0]}><boxGeometry args={[COLS*s.r*2+1.2,0.05,0.2]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} transparent opacity={0.6} /></mesh>
      {/* Full-screen aiming plane — captures pointer events anywhere on screen so
          the shooter follows the finger continuously while dragging. */}
      <mesh ref={aimPlane} position={[0,0,0]} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        <planeGeometry args={[14,14]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {s.grid.flatMap((row:any)=>row).map((b:any,i:number)=> b && (b.alive || b.popping || b.dropVy!==undefined) && (b.dropVy===undefined || b.y>-8) ? (
        <mesh key={i} position={[b.x,b.y,b.z]} scale={b.popping? Math.max(0,1-b.popping*3):1}>
          <sphereGeometry args={[s.r,24,24]} />
          <meshPhysicalMaterial color={b.color} metalness={0.05} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} transmission={0.05} thickness={0.5} emissive={b.color} emissiveIntensity={0.08} />
        </mesh>
      ) : null)}
      {s.projectile && <>
        {s.projectile.trail.map((t:any,i:number)=>(<mesh key={i} position={[t.x,t.y,0]} scale={0.3 + (i/s.projectile.trail.length)*0.5}><sphereGeometry args={[s.r*0.5,12,12]} /><meshStandardMaterial color={s.projectile.color} transparent opacity={i/s.projectile.trail.length*0.4} emissive={s.projectile.color} emissiveIntensity={0.4} /></mesh>))}
        <mesh position={[s.projectile.x,s.projectile.y,0]}><sphereGeometry args={[s.r,24,24]} /><meshPhysicalMaterial color={s.projectile.color} metalness={0.05} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} emissive={s.projectile.color} emissiveIntensity={0.12} /></mesh>
      </>}
      {/* shooter */}
      <group position={[s.shooter.x,s.shooter.y,0]} rotation={[0,0,s.shooter.angle - Math.PI/2]}>
        <mesh position={[0,0.45,0]} castShadow><cylinderGeometry args={[0.09,0.14,0.7,16]} /><meshStandardMaterial color="#B8A47A" metalness={0.6} roughness={0.25} /></mesh>
        <mesh position={[0,-0.05,0]}><sphereGeometry args={[0.42,24,24]} /><meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.6} /></mesh>
      </group>
      {!s.projectile && <mesh position={[s.shooter.x,s.shooter.y,0]}><sphereGeometry args={[s.r,24,24]} /><meshPhysicalMaterial color={s.current} metalness={0.05} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} emissive={s.current} emissiveIntensity={0.1} /></mesh>}
      {/* aim line */}
      {s.started && !s.projectile && !s.over && !s.won && <mesh position={[s.shooter.x + Math.cos(s.shooter.angle)*1.2, s.shooter.y + Math.sin(s.shooter.angle)*1.2, 0]} rotation={[0,0,s.shooter.angle]}><boxGeometry args={[1.2,0.03,0.03]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.25} /></mesh>}
      {/* next */}
      <mesh position={[COLS*s.r-0.2, s.shooter.y, 0]}><sphereGeometry args={[s.r*0.8,20,20]} /><meshPhysicalMaterial color={s.next} metalness={0.05} roughness={0.1} clearcoat={1} /></mesh>
      <Environment resolution={64} frames={1}><color attach="background" args={['#060814']} /><mesh scale={20}><sphereGeometry args={[1,16,16]} /><meshBasicMaterial color="#070a16" side={THREE.BackSide} /></mesh></Environment>
    </>
  );
}

// ---- Fallback 2D (playable) ----
function BubbleFallback({ backHref }: Props) {
  const canvasRef=useRef<HTMLCanvasElement>(null); const rafRef=useRef(0); const audioRef=useRef<AudioContext|null>(null);
  const g=useRef({started:false,over:false,won:false,paused:false,grid:[] as any[][],rows:0,cols:11,r:16,ox:0,oy:40,stepY:0,shooter:{x:0,y:0,angle:-Math.PI/2},current:'#EF5350',next:'#42A5F5',projectile:null as any,score:0,best:0,level:1,shots:0,target:0,cleared:0});
  const [ui,setUi]=useState({started:false,paused:false,over:false,won:false,score:0,best:0,level:1,shotsLeft:0,target:0,muted:false});
  useEffect(()=>{try{g.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:g.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=(f=440,d=0.07,t:OscillatorType='sine',v=0.05)=>{ if(ui.muted) return; try{ if(!audioRef.current) audioRef.current=new (window.AudioContext||(window as any).webkitAudioContext)(); const ctx=audioRef.current,o=ctx.createOscillator(),ga=ctx.createGain(); o.type=t;o.frequency.value=f;ga.gain.value=v;o.connect(ga);ga.connect(ctx.destination); o.start(); ga.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+d); o.stop(ctx.currentTime+d);}catch{} };
  const gridPos=(row:number,col:number)=>{ const s=g.current; const offset=row%2?s.r:0; return {x:s.ox+offset+col*s.r*2,y:s.oy+row*s.stepY}; };
  const neighbors=(row:number,col:number)=>{ const odd=row%2!==0; const deltas=odd?[[ -1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]:[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]; const res:any[]=[]; for(const [dr,dc] of deltas){ const nr=row+dr,nc=col+dc; if(nr>=0&&nr<g.current.grid.length&&nc>=0&&nc<g.current.grid[nr].length) res.push({row:nr,col:nc}); } return res; };
  const colorsInGrid=()=>{ const set=new Set<string>(); for(const row of g.current.grid) for(const b of row) if(b) set.add(b.color); return [...set]; };
  const pickColor=()=>{ const c=colorsInGrid(); const pool=c.length?c:COLORS; return pool[Math.floor(Math.random()*pool.length)]; };
  const buildLevel=(level:number)=>{ const s=g.current; s.rows=12; s.cols=11; s.grid=Array.from({length:s.rows+8},(_,row)=>Array.from({length:s.cols-(row%2?1:0)},()=>null)); const filled=Math.min(6+level,10); for(let row=0;row<filled;row++) for(let col=0;col<s.grid[row].length;col++){ if(Math.random()<0.08&&row>1) continue; const p=gridPos(row,col); s.grid[row][col]={x:p.x,y:p.y,color:COLORS[Math.floor(Math.random()*COLORS.length)],row,col}; } s.level=level; s.shots=40+Math.max(0,6-level)*3; s.target=Math.max(12,filled*4-level); s.cleared=0; s.over=false; s.won=false; s.projectile=null; s.current=pickColor(); s.next=pickColor(); };
  const reset=(start=false,level=1)=>{ const s=g.current; s.started=start; s.paused=false; s.score=level===1?0:s.score; buildLevel(level); setUi(p=>({...p,started:start,paused:false,over:false,won:false,score:s.score,level:s.level,shotsLeft:s.shots,target:s.target})); if(start) beep(520,0.08,'triangle'); };
  useEffect(()=>{reset(false,1);},[]);
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>{ const s=g.current; if(!s.started||s.over||s.won) return; s.paused=!s.paused; setUi(p=>({...p,paused:s.paused})); };
  const clusterAt=(row:number,col:number,color:string)=>{ const s=g.current,key=(r:number,c:number)=>`${r},${c}`,seen=new Set<string>(),q=[{row,col}]; seen.add(key(row,col)); const out:any[]=[]; while(q.length){ const cur=q.shift()!; out.push(cur); for(const n of neighbors(cur.row,cur.col)){ const k=key(n.row,n.col); const b=s.grid[n.row]?.[n.col]; if(!b||b.color!==color||seen.has(k)) continue; seen.add(k); q.push(n);} } return out; };
  const removeFloating=()=>{ const s=g.current,connected=new Set<string>(),key=(r:number,c:number)=>`${r},${c}`,q:any[]=[]; for(let c=0;c<s.grid[0].length;c++){ if(s.grid[0][c]){ q.push({row:0,col:c}); connected.add(key(0,c)); } } while(q.length){ const cur=q.shift()!; for(const n of neighbors(cur.row,cur.col)){ const k=key(n.row,n.col); if(connected.has(k)||!s.grid[n.row]?.[n.col]) continue; connected.add(k); q.push(n);} } let dropped=0; for(let r=0;r<s.grid.length;r++) for(let c=0;c<s.grid[r].length;c++){ if(s.grid[r][c] && !connected.has(key(r,c))){ s.grid[r][c]=null; dropped++; } } return dropped; };
  const placeProjectile=()=>{ const s=g.current; if(!s.projectile) return; const p=s.projectile; let best={row:0,col:0,dist:Infinity}; for(let row=0;row<s.grid.length;row++){ const maxCol=s.cols-(row%2?1:0); for(let col=0;col<maxCol;col++){ const gp=gridPos(row,col); const d=(gp.x-p.x)**2+(gp.y-p.y)**2; if(d<best.dist) best={row,col,dist:d}; } } let {row,col}=best; row=Math.max(0,Math.min(s.grid.length-1,row)); col=Math.max(0,Math.min(s.grid[row].length-1,col)); if(s.grid[row][col]){ let found=false; const q=[{row,col}], seen=new Set([`${row},${col}`]); while(q.length&&!found){ const cur=q.shift()!; for(const n of neighbors(cur.row,cur.col)){ const k=`${n.row},${n.col}`; if(seen.has(k)) continue; seen.add(k); if(!s.grid[n.row][n.col]){ row=n.row; col=n.col; found=true; break;} q.push(n);} } } const pos=gridPos(row,col); s.grid[row][col]={x:pos.x,y:pos.y,color:p.color,row,col}; s.projectile=null; beep(300,0.04,'square',0.04); const cluster=clusterAt(row,col,p.color); let gained=0; if(cluster.length>=3){ for(const c of cluster) s.grid[c.row][c.col]=null; gained+=cluster.length*10; const drop=removeFloating(); gained+=drop*15; s.cleared+=cluster.length+drop; beep(720,0.09,'triangle',0.06);} s.score+=gained; s.shots-=1; s.current=s.next; s.next=pickColor(); const dangerY=s.shooter.y-50; let hitBottom=false; for(const rowArr of s.grid) for(const b of rowArr) if(b&&b.y>=dangerY) hitBottom=true; const anyLeft=s.grid.some(r=>r.some(Boolean)); if(!anyLeft||s.cleared>=s.target){ s.won=true; s.started=false; s.score+=s.shots*5+100; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,won:true,started:false,score:s.score,best,shotsLeft:s.shots})); beep(660,0.18,'sine',0.07); return; } if(hitBottom||s.shots<=0){ s.over=true; s.started=false; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,over:true,started:false,score:s.score,best,shotsLeft:s.shots})); beep(120,0.25,'sawtooth',0.07); return; } setUi(p=>({...p,score:s.score,shotsLeft:s.shots,best:Math.max(p.best,s.score)})); };
  useEffect(()=>{const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!; const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2); const rect=canvas.getBoundingClientRect(); canvas.width=Math.floor(rect.width*dpr); canvas.height=Math.floor(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); const s=g.current,w=rect.width,h=rect.height; s.r=Math.max(12,Math.min(18,Math.floor((w-24)/(s.cols*2)))); const gridW=s.cols*s.r*2; s.ox=Math.floor((w-gridW)/2+s.r); s.oy=36; s.stepY=Math.floor(s.r*1.75); s.shooter.x=w/2; s.shooter.y=h-48; for(let row=0;row<s.grid.length;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(b){ const p=gridPos(row,col); b.x=p.x; b.y=p.y; } } }; resize(); window.addEventListener('resize',resize); let last=performance.now(); const loop=(now:number)=>{ const dt=Math.min(0.033,(now-last)/1000); last=now; const s=g.current, rect=canvas.getBoundingClientRect(), w=rect.width,h=rect.height; if(s.started&&!s.paused&&!s.over&&!s.won&&s.projectile){ const p=s.projectile; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.x<s.ox-s.r+2){p.x=s.ox-s.r+2;p.vx*=-1;} if(p.x>w-(s.ox-s.r+2)){p.x=w-(s.ox-s.r+2);p.vx*=-1;} if(p.y<s.oy) placeProjectile(); else { let hit=false; for(let row=0;row<s.grid.length&&!hit;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(!b) continue; const dx=b.x-p.x,dy=b.y-p.y; if(dx*dx+dy*dy <= (s.r*1.85)**2){ hit=true; break;} } if(hit) placeProjectile(); } } ctx.clearRect(0,0,w,h); const bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#121725'); bg.addColorStop(1,'#08090d'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h); const cg=ctx.createLinearGradient(0,0,0,80); cg.addColorStop(0,'rgba(184,164,122,0.18)'); cg.addColorStop(1,'transparent'); ctx.fillStyle=cg; ctx.fillRect(0,0,w,80); ctx.strokeStyle='rgba(239,68,68,0.35)'; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.moveTo(10,s.shooter.y-50); ctx.lineTo(w-10,s.shooter.y-50); ctx.stroke(); ctx.setLineDash([]); for(let row=0;row<s.grid.length;row++) for(let col=0;col<s.grid[row].length;col++){ const b=s.grid[row][col]; if(!b) continue; drawBubble(ctx,b.x,b.y,s.r-1,b.color); } if(s.started&&!s.paused&&!s.over&&!s.won&&!s.projectile){ ctx.strokeStyle='rgba(243,239,231,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.shooter.x,s.shooter.y); ctx.lineTo(s.shooter.x+Math.cos(s.shooter.angle)*70,s.shooter.y+Math.sin(s.shooter.angle)*70); ctx.stroke(); } if(s.projectile) drawBubble(ctx,s.projectile.x,s.projectile.y,s.r-1,s.projectile.color); ctx.save(); ctx.translate(s.shooter.x,s.shooter.y); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(0,0,26,Math.PI,0); ctx.fill(); ctx.rotate(s.shooter.angle+Math.PI/2); ctx.fillStyle='#B8A47A'; ctx.fillRect(-8,-34,16,30); ctx.restore(); drawBubble(ctx,s.shooter.x,s.shooter.y,s.r,s.current); ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center'; ctx.fillText('NEXT',w-42,h-52); drawBubble(ctx,w-42,h-30,s.r-3,s.next); rafRef.current=requestAnimationFrame(loop); }; rafRef.current=requestAnimationFrame(loop); const setAim=(cx:number,cy:number)=>{ const rect=canvas.getBoundingClientRect();
 const x=cx-rect.left,y=cy-rect.top;
 let a=Math.atan2(y-g.current.shooter.y,x-g.current.shooter.x);
 if(a>-0.25) a=-0.25;
 if(a<-Math.PI+0.25) a=-Math.PI+0.25;
 g.current.shooter.angle=a;
 };
 const shoot=()=>{ const s=g.current;
 if(!s.started||s.paused||s.over||s.won||s.projectile) return;
 const speed=720;
 s.projectile={x:s.shooter.x+Math.cos(s.shooter.angle)*(s.r+8),y:s.shooter.y+Math.sin(s.shooter.angle)*(s.r+8),vx:Math.cos(s.shooter.angle)*speed,vy:Math.sin(s.shooter.angle)*speed,color:s.current};
 beep(480,0.05,'square',0.04);
 };
 // Drag to aim continuously; release to fire. The previous code shot on
 // pointerdown and never re-aimed while dragging, so the shooter looked stuck.
 let aiming=false;
 const onDown=(e:PointerEvent)=>{ if(!g.current.started||g.current.over||ui.paused) return; aiming=true; setAim(e.clientX,e.clientY); try{canvas.setPointerCapture(e.pointerId);}catch{} };
 const onMove=(e:PointerEvent)=>{ if(!aiming) return; setAim(e.clientX,e.clientY); };
 const onUp=(e:PointerEvent)=>{ if(!aiming) return; aiming=false; try{canvas.releasePointerCapture(e.pointerId);}catch{}; shoot(); };
 canvas.addEventListener('pointerdown',onDown);
 canvas.addEventListener('pointermove',onMove);
 canvas.addEventListener('pointerup',onUp);
 canvas.addEventListener('pointercancel',onUp);
 return ()=>{ window.removeEventListener('resize',resize);
 canvas.removeEventListener('pointerdown',onDown);
 canvas.removeEventListener('pointermove',onMove);
 canvas.removeEventListener('pointerup',onUp);
 canvas.removeEventListener('pointercancel',onUp);
 cancelAnimationFrame(rafRef.current);
 }; },[ui.muted]);
  const nextLevel=()=>reset(true,g.current.level+1);
  return <GameShell title="Orbital Pop" subtitle="Bubble Shooter (Performance Mode)" backHref={backHref} best={ui.best} stats={[{label:'Score',value:ui.score},{label:'Level',value:ui.level},{label:'Shots',value:ui.shotsLeft},{label:'Best',value:ui.best}]} accent="#42A5F5" onPauseToggle={togglePause} paused={ui.paused} running={ui.started&&!ui.over&&!ui.won} rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>} instructions={['Aim and shoot to match 3+ colors.','Clear targets before shots run out.','Desktop: move/click. Mobile: aim and tap.']} showStart={!ui.started&&!ui.over&&!ui.won} showGameOver={ui.over} onStart={()=>reset(true,1)} onRestart={()=>reset(true,1)} startLabel="Start Level 1" gameOverTitle="Level Failed" gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Level {ui.level}</div>}><div className="relative"><canvas ref={canvasRef} className="w-full h-[560px] sm:h-[600px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{touchAction:'none'}}/>{ui.paused&&ui.started&&!ui.over&&!ui.won && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p></div></div>}{ui.won && <div className="absolute inset-0 z-20 rounded-2xl bg-black/65 backdrop-blur-md flex items-center justify-center p-5"><div className="max-w-sm w-full text-center rounded-2xl border border-white/10 bg-black/40 p-6"><p className="text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">Level {ui.level} clear</p><h2 className="text-3xl font-light tracking-tight mb-2 text-[#7dd3fc]">Great Shot!</h2><div className="text-sm text-white/65 mb-5">Score {ui.score}</div><div className="flex gap-2 justify-center"><button onClick={nextLevel} className="px-6 py-3 rounded-xl font-semibold text-black bg-[#7dd3fc]">Next Level</button><a href={backHref} className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-medium">Arcade</a></div></div></div>}</div></GameShell>;
}
function drawBubble(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){ const grad=ctx.createRadialGradient(x-r*0.35,y-r*0.35,r*0.2,x,y,r); grad.addColorStop(0,'#fff'); grad.addColorStop(0.25,color); grad.addColorStop(1,shade(color,-30)); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.stroke(); }
function shade(hex:string,amt:number){ const c=hex.replace('#',''); const n=parseInt(c,16); let r=(n>>16)+amt,g=((n>>8)&0xff)+amt,b=(n&0xff)+amt; r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b)); return `rgb(${r},${g},${b})`; }
