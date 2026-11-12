'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';
import { useGameQuality } from './useGameQuality';

type Props = { backHref: string };
const STORAGE = 'dine_runner_best_v2';
const MUTE_KEY = 'dine_runner_muted_v2';

export default function EndlessRunner({ backHref }: Props) {
  const { is3D, ready } = useGameQuality();
  if (!ready) return <div className="min-h-screen bg-[#050505]" />;
  return is3D ? <Runner3D backHref={backHref} /> : <RunnerFallback backHref={backHref} />;
}

function useBeep(muted: boolean) {
  const audioRef = useRef<AudioContext | null>(null);
  return (f = 440, d = 0.07, t: OscillatorType = 'sine', v = 0.05) => {
    if (muted) return;
    try { if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current; const o = ctx.createOscillator(); const g = ctx.createGain(); o.type=t; o.frequency.value=f; g.gain.value=v; o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+d); o.stop(ctx.currentTime+d);
    } catch {}
  };
}

function Runner3D({ backHref }: Props) {
  const s = useRef({ playing:false,paused:false,over:false,lane:1,target:1,playerY:0,vy:0,jumping:false,sliding:false,slideT:0,speed:9,distance:0,score:0,coins:0,best:0,level:1,obstacles:[] as {lane:number;z:number;type:'barrier'|'low'|'coin';taken?:boolean}[],spawnT:0,spawnEvery:1.0,stripes:Array.from({length:18},(_,i)=>i*-5),mission:{text:'Collect 10 coins',target:10,progress:0,reward:150,done:0} });
  const [ui,setUi]=useState({started:false,paused:false,over:false,score:0,best:0,dist:0,coins:0,level:1,muted:false,mission:'Collect 10 coins',mProg:0,mTarget:10});
  useEffect(()=>{try{s.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:s.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=useBeep(ui.muted);
  const newMission=(level:number,done:number)=>{const target=8+level*2+done*2; return {text:`Collect ${target} coins`,target,progress:0,reward:120+level*30,done};};
  const reset=(start=false)=>{const g=s.current; g.playing=start;g.paused=false;g.over=false;g.lane=1;g.target=1;g.playerY=0;g.vy=0;g.jumping=false;g.sliding=false;g.slideT=0;g.speed=9;g.distance=0;g.score=0;g.coins=0;g.level=1;g.obstacles=[];g.spawnT=0;g.spawnEvery=1.0;g.stripes=Array.from({length:18},(_,i)=>i*-5);g.mission=newMission(1,0); setUi(p=>({...p,started:start,paused:false,over:false,score:0,dist:0,coins:0,level:1,mission:g.mission.text,mProg:0,mTarget:g.mission.target})); if(start) beep(600,0.09,'triangle');};
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>{const g=s.current; if(!g.playing||g.over) return; g.paused=!g.paused; setUi(p=>({...p,paused:g.paused}));};
  const jump=()=>{const g=s.current; if(!g.playing||g.paused||g.over||g.jumping) return; g.jumping=true; g.vy=6.8; beep(520,0.07,'square',0.04);};
  const slide=()=>{const g=s.current; if(!g.playing||g.paused||g.over||g.sliding||g.jumping) return; g.sliding=true; g.slideT=0.55; beep(260,0.05,'sawtooth',0.03);};
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const g=s.current; if(e.key==='p'||e.key==='P'){togglePause();return;} if(!g.playing||g.paused||g.over) return; if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') g.target=Math.max(0,g.target-1); if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') g.target=Math.min(2,g.target+1); if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' '){e.preventDefault();jump();} if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){e.preventDefault();slide();}}; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey);},[ui.paused,ui.muted]);
  useEffect(()=>{let t:any=null; const onTs=(e:TouchEvent)=>{t={x:e.touches[0].clientX,y:e.touches[0].clientY};}; const onTe=(e:TouchEvent)=>{ if(!t) return; const dx=e.changedTouches[0].clientX-t.x, dy=e.changedTouches[0].clientY-t.y; t=null; const g=s.current; if(!g.playing||g.paused||g.over) return; if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>24) g.target=dx>0?Math.min(2,g.target+1):Math.max(0,g.target-1); else if(Math.abs(dy)>24){ if(dy<0) jump(); else slide(); } else { const w=window.innerWidth,x=e.changedTouches[0].clientX; if(x<w*0.33) g.target=Math.max(0,g.target-1); else if(x>w*0.66) g.target=Math.min(2,g.target+1); else jump(); } }; window.addEventListener('touchstart',onTs,{passive:true}); window.addEventListener('touchend',onTe,{passive:true}); return ()=>{window.removeEventListener('touchstart',onTs); window.removeEventListener('touchend',onTe);};},[]);
  return (
    <GameShell title="Neon Sprint" subtitle="3D Endless Runner" backHref={backHref} best={ui.best}
      stats={[{label:'Score',value:ui.score},{label:'Distance',value:`${ui.dist}m`},{label:'Coins',value:ui.coins},{label:'Best',value:ui.best}]}
      accent="#B8A47A" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>}
      instructions={['3 lanes: dodge left/right, jump barriers, slide under beams.','Collect coins, complete missions, speed rises over time.','Desktop: ← → move, ↑/Space jump, ↓ slide, P pause.','Mobile: swipe or tap zones to move/jump/slide.']}
      showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={()=>reset(true)} onRestart={()=>reset(true)} startLabel="Start Run"
      gameOverExtra={<div className="text-sm text-white/60 space-y-1"><div>Score {ui.score} • {ui.dist}m • {ui.coins} coins</div><div>Level {ui.level} • Missions cleared {s.current.mission.done}</div></div>}>
      <div className="mb-3 rounded-xl border border-[rgba(184,164,122,0.25)] bg-[rgba(184,164,122,0.08)] px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.18em] text-[rgba(243,239,231,0.6)]">Mission</div><div className="text-sm font-medium truncate">{ui.mission}</div></div>
        <div className="shrink-0 text-sm text-[#D9CBAB] font-semibold">{Math.min(ui.mProg,ui.mTarget)}/{ui.mTarget}</div>
      </div>
      <div className="relative h-[560px] sm:h-[620px] w-full">
        <Canvas shadows dpr={[1,1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}><RunnerScene s={s} setUi={setUi} beep={beep} STORAGE={STORAGE} /></Suspense>
        </Canvas>
        {ui.paused && ui.started && !ui.over && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p><p className="text-xs text-white/50 mt-1">Resume to keep running</p></div></div>}
      </div>
    </GameShell>
  );
}

function RunnerScene({ s, setUi, beep, STORAGE }: any) {
  const player = useRef<THREE.Group>(null);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  useFrame((_, dt) => {
    const g=s.current; if(dt>0.05) dt=0.05;
    if(g.playing && !g.paused && !g.over){
      g.distance += g.speed*dt*4; g.level = 1+Math.floor(g.distance/450); g.speed = 9 + (g.level-1)*0.9; g.spawnEvery = Math.max(0.45, 1.0 - (g.level-1)*0.05); g.spawnT += dt;
      if(g.spawnT>=g.spawnEvery){ g.spawnT=0; const lane=Math.floor(Math.random()*3); const r=Math.random(); if(r<0.45) g.obstacles.push({lane,z:-70,type:'barrier'}); else if(r<0.7) g.obstacles.push({lane,z:-70,type:'low'}); else g.obstacles.push({lane,z:-60,type:'coin'}); if(Math.random()<0.4) g.obstacles.push({lane:(lane+1+Math.floor(Math.random()*2))%3,z:-78,type:'coin'}); }
      g.stripes = g.stripes.map((z:number)=>{ let nz=z+g.speed*dt; if(nz>8) nz-=90; return nz; });
      g.obstacles.forEach((o:any)=> o.z += g.speed*dt); g.obstacles = g.obstacles.filter((o:any)=> o.z < 8);
      g.lane += (g.target-g.lane)*Math.min(1, dt*12);
      if(g.jumping){ g.vy -= 18*dt; g.playerY += g.vy*dt; if(g.playerY<=0){g.playerY=0;g.vy=0;g.jumping=false;} } else g.playerY=0;
      if(g.sliding){ g.slideT -= dt; if(g.slideT<=0) g.sliding=false; }
      const px=(g.lane-1)*2.2, pz=1.8, py=g.playerY; const ph = g.sliding?0.7:1.3;
      for(const o of g.obstacles){
        const ox=(o.lane-1)*2.2;
        if(o.type==='coin'){
          if(!o.taken && Math.abs(px-ox)<0.7 && Math.abs(pz-o.z)<0.8 && py < 1.4){ o.taken=true; g.coins++; g.mission.progress++; beep(880,0.05,'triangle',0.04); if(g.mission.progress>=g.mission.target){ g.score += g.mission.reward; g.mission = {text:`Collect ${g.mission.target+2+g.level} coins`, target:g.mission.target+2+g.level, progress:0, reward:120+g.level*30, done:g.mission.done+1}; beep(660,0.12,'sine',0.06);} }
        } else {
          if(Math.abs(px-ox)<0.9 && Math.abs(pz-o.z)<0.9){
            const canJump = o.type==='barrier' && g.jumping && py>0.45;
            const canSlide = o.type==='low' && g.sliding;
            const heightHit = o.type==='low' ? (py < 1.0) : (py < 1.2);
            if(heightHit && !canJump && !canSlide){ g.over=true; g.playing=false; g.score = Math.floor(g.distance)+g.coins*10+g.mission.done*150; const best=Math.max(g.best,g.score); g.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi((p:any)=>({...p,over:true,started:false,score:g.score,best,dist:Math.floor(g.distance),coins:g.coins,level:g.level,mission:g.mission.text,mProg:g.mission.progress,mTarget:g.mission.target})); beep(110,0.3,'sawtooth',0.08); }
          }
        }
      }
      g.obstacles = g.obstacles.filter((o:any)=> !(o.type==='coin' && o.taken));
      g.score = Math.floor(g.distance)+g.coins*10+g.mission.done*150;
      if(!g.over) setUi((p:any)=>({...p,score:g.score,dist:Math.floor(g.distance),coins:g.coins,level:g.level,mission:g.mission.text,mProg:g.mission.progress,mTarget:g.mission.target,best:Math.max(p.best,g.score)}));
    }
    if(player.current){ player.current.position.x = (s.current.lane-1)*2.2; player.current.position.y = 0.65 + s.current.playerY; player.current.rotation.z = -(s.current.target-s.current.lane)*0.1; const sc = s.current.sliding?0.55:1; player.current.scale.y += (sc-player.current.scale.y)*0.25; player.current.scale.x += ((s.current.sliding?1.2:1)-player.current.scale.x)*0.25; }
    if(cam.current){ cam.current.position.x += (((s.current.lane-1)*0.5)-cam.current.position.x)*0.06; cam.current.lookAt(0,0.7,-6); }
  });
  const lanes=[-2.2,0,2.2];
  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault position={[0,3.8,7.5]} fov={58} />
      <color attach="background" args={['#06070a']} /><fog attach="fog" args={['#06070a', 15, 65]} />
      <ambientLight intensity={0.35} /><directionalLight position={[5,10,4]} intensity={1.3} castShadow shadow-mapSize={[1024,1024]} /><pointLight position={[0,3,-10]} intensity={2.2} color="#8fd3ff" distance={30} />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,-30]} receiveShadow><planeGeometry args={[9.5,120]} /><meshStandardMaterial color="#151515" roughness={0.8} metalness={0.1} /></mesh>
      {[-3.2,3.2].map((x,i)=>(<mesh key={i} position={[x,0.25,-30]}><boxGeometry args={[0.2,0.5,120]} /><meshStandardMaterial color="#B8A47A" emissive="#B8A47A" emissiveIntensity={0.5} roughness={0.4} metalness={0.6} /></mesh>))}
      {s.current.stripes.map((z:number,i:number)=> lanes.slice(0,2).map((_,li)=>(<mesh key={i+'-'+li} position={[-1.1+li*2.2,0.01,z]}><boxGeometry args={[0.1,0.02,2]} /><meshStandardMaterial color="#f3efe7" emissive="#fff6de" emissiveIntensity={0.15} /></mesh>)))}
      <group ref={player} position={[0,0.65,1.8]}>
        <mesh castShadow position={[0,0.2,0]}><capsuleGeometry args={[0.28,0.6,4,8]} /><meshStandardMaterial color="#E8D7A8" metalness={0.25} roughness={0.35} /></mesh>
        <mesh castShadow position={[0,0.85,0]}><sphereGeometry args={[0.24,16,16]} /><meshStandardMaterial color="#f3e8cd" roughness={0.4} /></mesh>
        <mesh position={[0,-0.25,0]}><boxGeometry args={[0.55,0.15,0.4]} /><meshStandardMaterial color="#1f2937" /></mesh>
      </group>
      {s.current.obstacles.map((o:any,i:number)=> (
        <group key={i} position={[(o.lane-1)*2.2, o.type==='coin'?0.8:(o.type==='low'?1.15:0.45), o.z]}>
          {o.type==='coin' ? <mesh castShadow rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.28,0.28,0.08,24]} /><meshStandardMaterial color="#E7C56B" metalness={0.85} roughness={0.15} emissive="#8a6b1f" emissiveIntensity={0.25} /></mesh>
          : o.type==='low' ? <mesh castShadow><boxGeometry args={[1.6,0.35,0.6]} /><meshStandardMaterial color="#334155" metalness={0.3} roughness={0.5} emissive="#60a5fa" emissiveIntensity={0.2} /></mesh>
          : <mesh castShadow><boxGeometry args={[1.4,0.9,0.7]} /><meshStandardMaterial color="#7f1d1d" metalness={0.2} roughness={0.6} emissive="#f59e0b" emissiveIntensity={0.15} /></mesh>}
        </group>
      ))}
      <Environment resolution={64} frames={1}><color attach="background" args={['#06070a']} /><mesh scale={20}><sphereGeometry args={[1,16,16]} /><meshBasicMaterial color="#090b10" side={THREE.BackSide} /></mesh></Environment>
    </>
  );
}

// Canvas fallback (keeps functional 2D game)
function RunnerFallback({ backHref }: Props) { /* reuse simpler 2D by reusing same as before? implement compact fallback */ 
  // To keep response manageable, fallback renders a note? No, must be playable. I'll include compact 2D.
  const canvasRef=useRef<HTMLCanvasElement>(null); const rafRef=useRef(0); const audioRef=useRef<AudioContext|null>(null);
  const g=useRef({playing:false,paused:false,over:false,lane:1,targetLane:1,laneX:[0,0,0],playerY:0,baseY:0,vy:0,jumping:false,sliding:false,slideT:0,speed:320,distance:0,score:0,coins:0,best:0,level:1,obstacles:[] as any[],spawnT:0,spawnEvery:1,mission:{text:'Collect 10 coins',target:10,progress:0,reward:150,done:0}});
  const [ui,setUi]=useState({started:false,paused:false,over:false,score:0,best:0,dist:0,coins:0,level:1,muted:false,mission:'Collect 10 coins',mProg:0,mTarget:10});
  useEffect(()=>{try{g.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:g.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=(f=440,d=0.07,t:OscillatorType='sine',v=0.05)=>{ if(ui.muted) return; try{ if(!audioRef.current) audioRef.current=new (window.AudioContext||(window as any).webkitAudioContext)(); const ctx=audioRef.current,o=ctx.createOscillator(),ga=ctx.createGain(); o.type=t;o.frequency.value=f;ga.gain.value=v;o.connect(ga);ga.connect(ctx.destination);o.start();ga.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+d);o.stop(ctx.currentTime+d);}catch{} };
  const newMission=(level:number,done:number)=>({text:`Collect ${8+level*2+done*2} coins`,target:8+level*2+done*2,progress:0,reward:120+level*30,done});
  const reset=(start=false)=>{const s=g.current; s.playing=start;s.paused=false;s.over=false;s.lane=1;s.targetLane=1;s.vy=0;s.jumping=false;s.sliding=false;s.slideT=0;s.speed=320;s.distance=0;s.score=0;s.coins=0;s.level=1;s.obstacles=[];s.spawnT=0;s.spawnEvery=1;s.mission=newMission(1,0); setUi(p=>({...p,started:start,paused:false,over:false,score:0,dist:0,coins:0,level:1,mission:s.mission.text,mProg:0,mTarget:s.mission.target})); if(start) beep(600,0.09,'triangle');};
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>{const s=g.current; if(!s.playing||s.over) return; s.paused=!s.paused; setUi(p=>({...p,paused:s.paused}));};
  const jump=()=>{const s=g.current; if(!s.playing||s.paused||s.over||s.jumping) return; s.jumping=true; s.vy=-720; beep(520,0.07,'square',0.04);};
  const slide=()=>{const s=g.current; if(!s.playing||s.paused||s.over||s.sliding||s.jumping) return; s.sliding=true; s.slideT=0.55; beep(260,0.05,'sawtooth',0.03);};
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const s=g.current; if(e.key==='p'||e.key==='P'){togglePause();return;} if(!s.playing||s.paused||s.over) return; if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') s.targetLane=Math.max(0,s.targetLane-1); if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') s.targetLane=Math.min(2,s.targetLane+1); if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' '){e.preventDefault();jump();} if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){e.preventDefault();slide();}}; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey);},[ui.paused,ui.muted]);
  useEffect(()=>{const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!; const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2); const rect=canvas.getBoundingClientRect(); canvas.width=Math.floor(rect.width*dpr); canvas.height=Math.floor(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); const w=rect.width, roadW=Math.min(360,w-24), left=(w-roadW)/2, laneW=roadW/3; g.current.laneX=[left+laneW*0.5,left+laneW*1.5,left+laneW*2.5]; g.current.baseY=rect.height-90; if(!g.current.jumping) g.current.playerY=g.current.baseY;}; resize(); window.addEventListener('resize',resize); let last=performance.now(), stripes=Array.from({length:12},(_,i)=>i*70); const loop=(now:number)=>{const dt=Math.min(0.033,(now-last)/1000); last=now; const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height; const s=g.current, roadW=Math.min(360,w-24), left=(w-roadW)/2, laneW=roadW/3; if(s.playing&&!s.paused&&!s.over){ s.distance+=s.speed*dt*0.06; s.score=Math.floor(s.distance)+s.coins*10+s.mission.done*150; s.level=1+Math.floor(s.distance/350); s.speed=320+(s.level-1)*28; s.spawnEvery=Math.max(0.45,1-(s.level-1)*0.05); s.spawnT+=dt; if(s.spawnT>=s.spawnEvery){s.spawnT=0; const lane=Math.floor(Math.random()*3); const roll=Math.random(); if(roll<0.45) s.obstacles.push({lane,y:-60,type:'barrier',w:laneW*0.55,h:46}); else if(roll<0.7) s.obstacles.push({lane,y:-60,type:'low',w:laneW*0.6,h:34}); else s.obstacles.push({lane,y:-40,type:'coin',w:22,h:22}); if(Math.random()<0.35) s.obstacles.push({lane:(lane+1+Math.floor(Math.random()*2))%3,y:-140,type:'coin',w:22,h:22}); } stripes=stripes.map(sy=>{let ny=sy+s.speed*dt; if(ny>h) ny-=h+70; return ny;}); s.obstacles.forEach((o:any)=>o.y+=s.speed*dt); s.obstacles=s.obstacles.filter((o:any)=>o.y<h+80); if(Math.abs(s.laneX[s.targetLane]-s.laneX[s.lane])<1) s.lane=s.targetLane; if(s.jumping){ s.vy+=1700*dt; s.playerY+=s.vy*dt; if(s.playerY>=s.baseY){s.playerY=s.baseY;s.vy=0;s.jumping=false;} } else s.playerY=s.baseY; if(s.sliding){s.slideT-=dt; if(s.slideT<=0) s.sliding=false;} const px=s.laneX[s.targetLane],py=s.playerY,pr=s.sliding?16:20,ph=s.sliding?22:40; for(const o of s.obstacles){const ox=s.laneX[o.lane]; if(o.type==='coin'){ if(!o.taken && Math.abs(px-ox)<pr+12 && Math.abs(py-o.y)<ph/2+12){o.taken=true;s.coins++;s.mission.progress++;beep(880,0.05,'triangle',0.04); if(s.mission.progress>=s.mission.target){s.score+=s.mission.reward; s.mission=newMission(s.level,s.mission.done+1); beep(660,0.12,'sine',0.06);} } } else { const collideY=Math.abs((py-ph/2)-o.y)<(ph/2+o.h/2-4), collideX=Math.abs(px-ox)<(pr+o.w/2-6); if(collideX&&collideY){ const canJump=o.type==='barrier'&&s.jumping&&s.vy<200; const canSlide=o.type==='low'&&s.sliding; if(!canJump&&!canSlide){ s.over=true; s.playing=false; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best));}catch{} setUi(p=>({...p,over:true,started:false,score:s.score,best,dist:Math.floor(s.distance),coins:s.coins,level:s.level})); beep(110,0.3,'sawtooth',0.08);} } } } s.obstacles=s.obstacles.filter((o:any)=>!(o.type==='coin'&&o.taken)); s.score=Math.floor(s.distance)+s.coins*10+s.mission.done*150; setUi(p=>({...p,score:s.score,dist:Math.floor(s.distance),coins:s.coins,level:s.level,mission:s.mission.text,mProg:s.mission.progress,mTarget:s.mission.target,best:Math.max(p.best,s.score)})); } ctx.clearRect(0,0,w,h); const bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#17140f'); bg.addColorStop(1,'#090908'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h); ctx.fillStyle='#1a1814'; ctx.fillRect(left,0,roadW,h); ctx.strokeStyle='rgba(184,164,122,0.45)'; ctx.strokeRect(left+1,0,roadW-2,h); ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([18,18]); for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(left+laneW*i,0);ctx.lineTo(left+laneW*i,h);ctx.stroke();} ctx.setLineDash([]); ctx.fillStyle='rgba(243,239,231,0.22)'; stripes.forEach(sy=>{for(let i=1;i<3;i++) ctx.fillRect(left+laneW*i-2,sy,4,26);}); s.obstacles.forEach((o:any)=>{const x=s.laneX[o.lane]; if(o.type==='coin'){ctx.beginPath();ctx.arc(x,o.y,11,0,Math.PI*2);ctx.fillStyle='#d8c28f';ctx.fill();} else {ctx.fillStyle=o.type==='barrier'?'#8c2f2f':'#374151'; ctx.fillRect(x-o.w/2,o.y-o.h/2,o.w,o.h);} }); const px=s.laneX[s.targetLane],py=s.playerY,bodyH=s.sliding?22:40,bodyW=s.sliding?34:26; ctx.fillStyle='#B8A47A'; ctx.fillRect(px-bodyW/2,py-bodyH,bodyW,bodyH); rafRef.current=requestAnimationFrame(loop); }; rafRef.current=requestAnimationFrame(loop); let t:any=null; const onTs=(e:TouchEvent)=>{t={x:e.touches[0].clientX,y:e.touches[0].clientY};}; const onTe=(e:TouchEvent)=>{ if(!t) return; const dx=e.changedTouches[0].clientX-t.x,dy=e.changedTouches[0].clientY-t.y; t=null; const s=g.current; if(!s.playing||s.paused||s.over) return; if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>24) s.targetLane=dx>0?Math.min(2,s.targetLane+1):Math.max(0,s.targetLane-1); else if(Math.abs(dy)>24){ if(dy<0) jump(); else slide(); } else { const rect=canvas.getBoundingClientRect(); const x=e.changedTouches[0].clientX-rect.left; if(x<rect.width*0.33) s.targetLane=Math.max(0,s.targetLane-1); else if(x>rect.width*0.66) s.targetLane=Math.min(2,s.targetLane+1); else jump(); } }; canvas.addEventListener('touchstart',onTs,{passive:true}); canvas.addEventListener('touchend',onTe,{passive:true}); return ()=>{window.removeEventListener('resize',resize); canvas.removeEventListener('touchstart',onTs); canvas.removeEventListener('touchend',onTe); cancelAnimationFrame(rafRef.current);}; },[ui.muted]);
  return <GameShell title="Neon Sprint" subtitle="Endless Runner (Performance Mode)" backHref={backHref} best={ui.best} stats={[{label:'Score',value:ui.score},{label:'Distance',value:`${ui.dist}m`},{label:'Coins',value:ui.coins},{label:'Best',value:ui.best}]} accent="#B8A47A" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over} rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>} instructions={['3 lanes: dodge, jump barriers, slide under beams.','Collect coins and complete missions.','Desktop: ← → ↑ ↓/Space, P pause. Mobile: swipe/tap.']} showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={()=>reset(true)} onRestart={()=>reset(true)} startLabel="Start Run" gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • {ui.dist}m • {ui.coins} coins</div>}><div className="mb-3 rounded-xl border border-[rgba(184,164,122,0.25)] bg-[rgba(184,164,122,0.08)] px-3 py-2 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.18em] text-[rgba(243,239,231,0.6)]">Mission</div><div className="text-sm font-medium truncate">{ui.mission}</div></div><div className="shrink-0 text-sm text-[#D9CBAB] font-semibold">{Math.min(ui.mProg,ui.mTarget)}/{ui.mTarget}</div></div><div className="relative"><canvas ref={canvasRef} className="w-full h-[520px] sm:h-[560px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{touchAction:'none'}}/>{ui.paused && ui.started && !ui.over && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p></div></div>}</div></GameShell>;
}
