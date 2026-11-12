'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';
import { useGameQuality } from './useGameQuality';

type Props = { backHref: string };
const STORAGE = 'dine_traffic_best_v1';
const MUTE_KEY = 'dine_traffic_muted_v1';

export default function TrafficRacer({ backHref }: Props) {
  const { is3D, ready } = useGameQuality();
  if (!ready) return <div className="min-h-screen bg-[#050505]" />;
  return is3D ? <Traffic3D backHref={backHref} /> : <TrafficFallback backHref={backHref} />;
}

function useBeep(muted: boolean) {
  const audioRef = useRef<AudioContext | null>(null);
  return (f = 440, d = 0.08, t: OscillatorType = 'sine', v = 0.06) => {
    if (muted) return;
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current; const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = t; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d); o.stop(ctx.currentTime + d);
    } catch {}
  };
}

function Traffic3D({ backHref }: Props) {
  const s = useRef({ playing:false, paused:false, over:false, lane:1, target:1, speed:10, distance:0, score:0, best:0, level:1, cars:[] as {lane:number; z:number; color:string}[], spawnT:0, spawnEvery:1.1, stripes: Array.from({length:16},(_,i)=>i*-6) });
  const [ui, setUi] = useState({ started:false, paused:false, over:false, score:0, best:0, dist:0, level:1, muted:false });
  const [fx, setFx] = useState(0);
  useEffect(()=>{ try{s.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:s.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{} },[]);
  const beep = useBeep(ui.muted);
  const reset = (start=false) => { const g=s.current; g.playing=start; g.paused=false; g.over=false; g.lane=1; g.target=1; g.speed=10; g.distance=0; g.score=0; g.level=1; g.cars=[]; g.spawnT=0; g.spawnEvery=1.1; g.stripes=Array.from({length:16},(_,i)=>i*-6); setUi(p=>({...p,started:start,paused:false,over:false,score:0,dist:0,level:1})); if(start) beep(520,0.1,'triangle'); };
  const toggleMute = () => setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause = () => { const g=s.current; if(!g.playing||g.over) return; g.paused=!g.paused; setUi(p=>({...p,paused:g.paused})); };
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ const g=s.current; if(e.key==='p'||e.key==='P'){togglePause();return;} if(!g.playing||g.paused||g.over) return; if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') g.target=Math.max(0,g.target-1); if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') g.target=Math.min(2,g.target+1); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[ui.paused,ui.muted]);
  useEffect(()=>{
    let tx:number|null=null; const onTs=(e:TouchEvent)=>{tx=e.touches[0].clientX;}; const onTe=(e:TouchEvent)=>{ if(tx==null) return; const dx=e.changedTouches[0].clientX-tx; tx=null; const g=s.current; if(!g.playing||g.paused||g.over) return; if(Math.abs(dx)>24) g.target = dx>0?Math.min(2,g.target+1):Math.max(0,g.target-1); else { const w=window.innerWidth; const x=e.changedTouches[0].clientX; g.target = x<w/2?Math.max(0,g.target-1):Math.min(2,g.target+1);} };
    window.addEventListener('touchstart',onTs,{passive:true}); window.addEventListener('touchend',onTe,{passive:true}); return ()=>{window.removeEventListener('touchstart',onTs); window.removeEventListener('touchend',onTe);};
  },[]);

  const start = () => reset(true);
  return (
    <GameShell title="Midnight Apex" subtitle="3D Traffic Racer" backHref={backHref} best={ui.best}
      stats={[{label:'Score',value:ui.score},{label:'Distance',value:`${ui.dist}m`},{label:'Level',value:ui.level},{label:'Best',value:ui.best}]}
      accent="#F59E0B" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>}
      instructions={['Steer across 3 lanes on a perspective highway.','Avoid traffic — collisions end the run.','Speed and traffic intensity ramp with distance.','Desktop: ← → or A/D. Mobile: tap or swipe. P to pause.']}
      showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={start} onRestart={start} startLabel="Start Race"
      gameOverExtra={<div className="text-sm text-white/60">Distance {ui.dist}m • Level {ui.level}</div>}>
      <div className="relative h-[560px] sm:h-[620px] w-full">
        <Canvas shadows dpr={[1,1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}>
            <TrafficScene s={s} setUi={setUi} fx={fx} setFx={setFx} beep={beep} STORAGE={STORAGE} />
          </Suspense>
        </Canvas>
        {ui.paused && ui.started && !ui.over && <Overlay text="Paused" sub="Resume to keep driving" />}
      </div>
    </GameShell>
  );
}

function TrafficScene({ s, setUi, fx, setFx, beep, STORAGE }: any) {
  const player = useRef<THREE.Group>(null);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  useFrame((_, dt) => {
    const g = s.current; if (dt>0.05) dt=0.05;
    if (g.playing && !g.paused && !g.over) {
      g.distance += g.speed * dt * 4; g.score = Math.floor(g.distance); g.level = 1 + Math.floor(g.distance/500);
      g.speed = 10 + (g.level-1)*1.2; g.spawnEvery = Math.max(0.45, 1.1 - (g.level-1)*0.07); g.spawnT += dt;
      if (g.spawnT >= g.spawnEvery) { g.spawnT=0; const lane=Math.floor(Math.random()*3); if(!g.cars.some((c:any)=>c.lane===lane && c.z>-12)) g.cars.push({lane,z:-70-Math.random()*20,color:['#ef4444','#3b82f6','#10b981','#a855f7','#f97316'][Math.floor(Math.random()*5)]}); }
      g.stripes = g.stripes.map((z:number)=>{ let nz=z+g.speed*dt; if(nz>8) nz-=96; return nz; });
      g.cars.forEach((c:any)=> c.z += g.speed*dt*0.92); g.cars = g.cars.filter((c:any)=>c.z<10);
      g.lane += (g.target-g.lane)*Math.min(1, dt*10);
      const px = (g.lane-1)*2.2; const pz = 2;
      for (const c of g.cars) { const cx=(c.lane-1)*2.2; if (Math.abs(px-cx)<1.2 && Math.abs(pz-c.z)<2.2) { g.over=true; g.playing=false; const best=Math.max(g.best,g.score); g.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi((p:any)=>({...p,over:true,started:false,score:g.score,best,dist:Math.floor(g.distance),level:g.level})); setFx(Date.now()); beep(120,0.25,'sawtooth',0.08); } }
      if(!g.over) setUi((p:any)=>(p.score!==g.score||p.level!==g.level?{...p,score:g.score,dist:Math.floor(g.distance),level:g.level}:p));
    }
    if (player.current) { player.current.position.x = (s.current.lane-1)*2.2; player.current.rotation.z = -(s.current.target-s.current.lane)*0.08; }
    if (cam.current) { cam.current.position.x += (((s.current.lane-1)*0.6) - cam.current.position.x)*0.05; cam.current.lookAt(0,0,-8); }
  });
  const lanes = [-2.2,0,2.2];
  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault position={[0,4.2,8]} fov={55} />
      <color attach="background" args={['#050608']} />
      <fog attach="fog" args={['#050608', 18, 70]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6,10,4]} intensity={1.4} castShadow shadow-mapSize={[1024,1024]} />
      <pointLight position={[0,2,-6]} intensity={2} color="#ffb35c" distance={20} />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,-30]} receiveShadow>
        <planeGeometry args={[10,120]} />
        <meshStandardMaterial color="#171717" roughness={0.85} metalness={0.05} />
      </mesh>
      {[-3.4,3.4].map((x,i)=>(<mesh key={i} position={[x,0.05,-30]}><boxGeometry args={[0.12,0.1,120]} /><meshStandardMaterial color="#B8A47A" emissive="#B8A47A" emissiveIntensity={0.6} /></mesh>))}
      {s.current.stripes.map((z:number,i:number)=> lanes.slice(0,2).map((_,li)=>(<mesh key={i+'-'+li} position={[-1.1+li*2.2,0.02,z]}><boxGeometry args={[0.12,0.02,2.2]} /><meshStandardMaterial color="#e8e2d3" emissive="#fff2d0" emissiveIntensity={0.2} /></mesh>)))}
      <group ref={player} position={[0,0.35,2]}>
        <Car color="#E8D7A8" accent="#B8A47A" player />
      </group>
      {s.current.cars.map((c:any,i:number)=>(<group key={i} position={[(c.lane-1)*2.2,0.35,c.z]}><Car color={c.color} /></group>))}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#050608']} />
        <mesh scale={20}><sphereGeometry args={[1,16,16]} /><meshBasicMaterial color="#0a0c10" side={THREE.BackSide} /></mesh>
      </Environment>
      {s.current.over && fx ? <Burst /> : null}
    </>
  );
}
function Car({ color, accent, player }: { color: string; accent?: string; player?: boolean }) {
  return (
    <group castShadow>
      <mesh castShadow position={[0,0.25,0]}><boxGeometry args={[1.1,0.45,2.1]} /><meshStandardMaterial color={color} metalness={0.55} roughness={0.25} /></mesh>
      <mesh castShadow position={[0,0.55,-0.1]}><boxGeometry args={[0.85,0.35,1.0]} /><meshStandardMaterial color={player? (accent||'#222'):'#111827'} metalness={0.2} roughness={0.1} transparent opacity={0.9} /></mesh>
      <mesh position={[0.38,0.12,0.7]}><boxGeometry args={[0.18,0.25,0.4]} /><meshStandardMaterial color="#111" roughness={0.9} /></mesh>
      <mesh position={[-0.38,0.12,0.7]}><boxGeometry args={[0.18,0.25,0.4]} /><meshStandardMaterial color="#111" roughness={0.9} /></mesh>
      <mesh position={[0.38,0.12,-0.7]}><boxGeometry args={[0.18,0.25,0.4]} /><meshStandardMaterial color="#111" roughness={0.9} /></mesh>
      <mesh position={[-0.38,0.12,-0.7]}><boxGeometry args={[0.18,0.25,0.4]} /><meshStandardMaterial color="#111" roughness={0.9} /></mesh>
      <mesh position={[0,0.32,1.06]}><boxGeometry args={[0.8,0.08,0.04]} /><meshStandardMaterial color="#fff7cc" emissive="#ffe9a8" emissiveIntensity={1.2} /></mesh>
      <mesh position={[0,0.32,-1.06]}><boxGeometry args={[0.8,0.08,0.04]} /><meshStandardMaterial color="#ff4d4d" emissive="#ff2222" emissiveIntensity={0.8} /></mesh>
    </group>
  );
}
function Burst() { return <pointLight position={[0,1,2]} intensity={6} color="#ff7744" distance={10} />; }
function Overlay({text,sub}:{text:string;sub:string}){ return <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">{text}</p><p className="text-xs text-white/50 mt-1">{sub}</p></div></div>; }

// Fallback 2D (keeps prior playable implementation)
function TrafficFallback({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const rafRef=useRef(0); const audioRef=useRef<AudioContext|null>(null);
  const state=useRef({playing:false,paused:false,over:false,lane:1,targetLane:1,laneX:[0,0,0],playerY:0,speed:240,distance:0,score:0,best:0,level:1,cars:[] as any[],stripes:[] as any[],spawnT:0,spawnEvery:1.1});
  const [ui,setUi]=useState({started:false,paused:false,over:false,score:0,best:0,dist:0,level:1,muted:false});
  useEffect(()=>{try{state.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:state.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=(f=440,d=0.08,t:OscillatorType='sine',v=0.06)=>{ if(ui.muted) return; try{ if(!audioRef.current) audioRef.current=new (window.AudioContext||(window as any).webkitAudioContext)(); const ctx=audioRef.current,o=ctx.createOscillator(),g=ctx.createGain(); o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+d);o.stop(ctx.currentTime+d);}catch{} };
  const reset=(start=false)=>{const s=state.current; s.playing=start;s.paused=false;s.over=false;s.lane=1;s.targetLane=1;s.speed=240;s.distance=0;s.score=0;s.level=1;s.cars=[];s.spawnT=0;s.spawnEvery=1.1;s.stripes=Array.from({length:10},(_,i)=>({y:i*80-80})); setUi(p=>({...p,started:start,paused:false,over:false,score:0,dist:0,level:1})); if(start) beep(520,0.1,'triangle');};
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>{const s=state.current; if(!s.playing||s.over) return; s.paused=!s.paused; setUi(p=>({...p,paused:s.paused}));};
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const s=state.current; if(e.key==='p'||e.key==='P'){togglePause();return;} if(!s.playing||s.paused||s.over) return; if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') s.targetLane=Math.max(0,s.targetLane-1); if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') s.targetLane=Math.min(2,s.targetLane+1);}; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey);},[ui.paused,ui.muted]);
  useEffect(()=>{const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!; const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2); const rect=canvas.getBoundingClientRect(); canvas.width=Math.floor(rect.width*dpr); canvas.height=Math.floor(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); const w=rect.width; const roadW=Math.min(360,w-24); const left=(w-roadW)/2; const laneW=roadW/3; state.current.laneX=[left+laneW*0.5,left+laneW*1.5,left+laneW*2.5]; state.current.playerY=rect.height-110;}; resize(); window.addEventListener('resize',resize); let last=performance.now(); const loop=(now:number)=>{const dt=Math.min(0.033,(now-last)/1000); last=now; const w=canvas.getBoundingClientRect().width,h=canvas.getBoundingClientRect().height; const s=state.current; const roadW=Math.min(360,w-24), left=(w-roadW)/2, laneW=roadW/3; if(s.playing&&!s.paused&&!s.over){ s.distance+=s.speed*dt*0.1; s.score=Math.floor(s.distance); s.level=1+Math.floor(s.distance/400); s.speed=240+(s.level-1)*22; s.spawnEvery=Math.max(0.45,1.1-(s.level-1)*0.06); s.spawnT+=dt; if(s.spawnT>=s.spawnEvery){s.spawnT=0; const lane=Math.floor(Math.random()*3); if(!s.cars.some((c:any)=>c.lane===lane&&c.y<140)) s.cars.push({lane,y:-120,h:70+Math.random()*30,w:laneW*0.55,color:['#ef4444','#3b82f6','#10b981','#f59e0b','#a855f7'][Math.floor(Math.random()*5)]}); } s.stripes.forEach((st:any)=>{st.y+=s.speed*dt; if(st.y>h) st.y-=h+80;}); s.cars.forEach((c:any)=>c.y+=s.speed*dt*0.95); s.cars=s.cars.filter((c:any)=>c.y<h+120); if(Math.abs(s.laneX[s.targetLane]-s.laneX[s.lane])<0.5) s.lane=s.targetLane; const px=s.laneX[s.targetLane],py=s.playerY,pw=laneW*0.55,ph=74; for(const c of s.cars){ const cx=s.laneX[c.lane]; if(Math.abs(px-cx)<(pw+c.w)*0.45 && Math.abs(py-c.y)<(ph+c.h)*0.45){ s.over=true; s.playing=false; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best));}catch{} setUi(p=>({...p,over:true,started:false,best,score:s.score,dist:Math.floor(s.distance),level:s.level})); beep(120,0.25,'sawtooth',0.08); break; } } if(!s.over) setUi(p=>p.score!==s.score||p.level!==s.level?{...p,score:s.score,dist:Math.floor(s.distance),level:s.level}:p);} ctx.clearRect(0,0,w,h); const bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#15130f'); bg.addColorStop(1,'#080807'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h); ctx.fillStyle='#1b1916'; ctx.fillRect(left,0,roadW,h); ctx.strokeStyle='rgba(184,164,122,0.5)'; ctx.strokeRect(left+1,0,roadW-2,h); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.setLineDash([18,16]); for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(left+laneW*i,0);ctx.lineTo(left+laneW*i,h);ctx.stroke();} ctx.setLineDash([]); ctx.fillStyle='rgba(243,239,231,0.25)'; s.stripes.forEach((st:any)=>{for(let i=1;i<3;i++) ctx.fillRect(left+laneW*i-2,st.y,4,28);}); s.cars.forEach((c:any)=>{const x=s.laneX[c.lane]-c.w/2; rr(ctx,x,c.y-c.h/2,c.w,c.h,10); ctx.fillStyle=c.color; ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.25)'; rr(ctx,x+6,c.y-c.h/2+8,c.w-12,14,6); ctx.fill();}); const px=s.laneX[s.targetLane]-laneW*0.275, py=s.playerY-37, pw=laneW*0.55, ph=74; rr(ctx,px,py,pw,ph,12); const cg=ctx.createLinearGradient(px,py,px,py+ph); cg.addColorStop(0,'#e8d7a8'); cg.addColorStop(1,'#B8A47A'); ctx.fillStyle=cg; ctx.fill(); rafRef.current=requestAnimationFrame(loop); }; rafRef.current=requestAnimationFrame(loop); let touchX:number|null=null; const onTs=(e:TouchEvent)=>{touchX=e.touches[0].clientX;}; const onTe=(e:TouchEvent)=>{ if(touchX==null) return; const dx=e.changedTouches[0].clientX-touchX; touchX=null; const s=state.current; if(!s.playing||s.paused||s.over) return; if(Math.abs(dx)>24) s.targetLane=dx>0?Math.min(2,s.targetLane+1):Math.max(0,s.targetLane-1); else { const rect=canvas.getBoundingClientRect(); const x=e.changedTouches[0].clientX-rect.left; s.targetLane=x<rect.width/2?Math.max(0,s.targetLane-1):Math.min(2,s.targetLane+1);} }; canvas.addEventListener('touchstart',onTs,{passive:true}); canvas.addEventListener('touchend',onTe,{passive:true}); return ()=>{window.removeEventListener('resize',resize); canvas.removeEventListener('touchstart',onTs); canvas.removeEventListener('touchend',onTe); cancelAnimationFrame(rafRef.current);}; },[ui.muted]);
  return (
    <GameShell title="Midnight Apex" subtitle="Traffic Racer (Performance Mode)" backHref={backHref} best={ui.best} stats={[{label:'Score',value:ui.score},{label:'Distance',value:`${ui.dist}m`},{label:'Level',value:ui.level},{label:'Best',value:ui.best}]} accent="#f59e0b" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over} rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>} instructions={['Steer left/right to change lanes.','Avoid traffic vehicles — collisions end the run.','Speed and traffic intensity increase with distance.','Desktop: ← → or A/D. Mobile: tap or swipe.']} showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={()=>reset(true)} onRestart={()=>reset(true)} startLabel="Start Race" gameOverExtra={<div className="text-sm text-white/60">Distance {ui.dist}m • Level {ui.level}</div>}>
      <div className="relative"><canvas ref={canvasRef} className="w-full h-[520px] sm:h-[560px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{touchAction:'none'}}/>{ui.paused && ui.started && !ui.over && <Overlay text="Paused" sub="Resume to keep driving"/>}</div>
    </GameShell>
  );
}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){const R=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+R,y);ctx.arcTo(x+w,y,x+w,y+h,R);ctx.arcTo(x+w,y+h,x,y+h,R);ctx.arcTo(x,y+h,x,y,R);ctx.arcTo(x,y,x+w,y,R);ctx.closePath();}
