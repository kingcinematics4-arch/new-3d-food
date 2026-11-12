'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';
import { useGameQuality } from './useGameQuality';

type Props = { backHref: string };
const STORAGE = 'dine_block_best_v2';
const MUTE_KEY = 'dine_block_muted_v2';
const GRID = 8;
const COLORS = ['#E76F51','#2A9D8F','#E9C46A','#5E81AC','#B48EAD','#84A98C','#F4A261','#4CC9F0'];

type Cell = string | null;
type Shape = { cells: [number, number][]; color: string; id: number };
const PIECES: [number, number][][] = [
  [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]], [[0,0],[1,0],[2,0]], [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[1,0],[2,0],[0,1]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,2]], [[1,0],[0,1],[1,1],[2,1]],
  [[0,0],[1,0],[1,1],[2,1]], [[1,0],[2,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[2,1],[2,2]], [[0,0],[0,1],[0,2],[1,0],[2,0]],
];
function randPiece(id: number): Shape { const cells = PIECES[Math.floor(Math.random() * PIECES.length)].map(c => [c[0], c[1]] as [number, number]); return { cells, color: COLORS[Math.floor(Math.random() * COLORS.length)], id }; }

export default function BlockBlast({ backHref }: Props) {
  const { is3D, ready } = useGameQuality();
  if (!ready) return <div className="min-h-screen bg-[#050505]" />;
  return is3D ? <Block3D backHref={backHref} /> : <BlockFallback backHref={backHref} />;
}

function useBeep(muted: boolean) {
  const audioRef = useRef<AudioContext | null>(null);
  return (f = 440, d = 0.07, t: OscillatorType = 'sine', v = 0.05) => {
    if (muted) return;
    try { if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current; const o = ctx.createOscillator(); const ga = ctx.createGain(); o.type=t; o.frequency.value=f; ga.gain.value=v; o.connect(ga); ga.connect(ctx.destination);
      o.start(); ga.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+d); o.stop(ctx.currentTime+d);
    } catch {}
  };
}

function canPlace(shape: Shape, gx: number, gy: number, grid: Cell[][]) {
  for (const [cx, cy] of shape.cells) { const x=gx+cx,y=gy+cy; if(x<0||y<0||x>=GRID||y>=GRID) return false; if(grid[y][x]) return false; }
  return true;
}
function anyMove(grid: Cell[][], tray: (Shape|null)[]) { for(const s of tray){ if(!s) continue; for(let y=0;y<GRID;y++) for(let x=0;x<GRID;x++) if(canPlace(s,x,y,grid)) return true; } return false; }

function Block3D({ backHref }: Props) {
  const g = useRef({ grid: Array.from({length:GRID},()=>Array<Cell>(GRID).fill(null)), tray:[randPiece(1),randPiece(2),randPiece(3)] as (Shape|null)[], score:0,best:0,combo:0,level:1,clears:0,placed:0,over:false,started:false,msg:'',msgT:0, fx:[] as {x:number;y:number;c:string;t:number}[], placedAnim:[] as {x:number;y:number;c:string;t:number}[] });
  const [ui,setUi]=useState({started:false,paused:false,over:false,score:0,best:0,combo:0,level:1,muted:false,piecesLeft:3,msg:''});
  const [drag,setDrag]=useState<{idx:number,overX:number,overY:number,valid:boolean}|null>(null);
  useEffect(()=>{try{g.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:g.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=useBeep(ui.muted);
  const refillIfNeeded = () => { if(g.current.tray.every(s=>!s)){ let id=Date.now(); g.current.tray=[randPiece(id++),randPiece(id++),randPiece(id++)]; g.current.level = 1+Math.floor(g.current.placed/12);} };
  const reset=(start=false)=>{const s=g.current; s.grid=Array.from({length:GRID},()=>Array<Cell>(GRID).fill(null)); let id=1; s.tray=[randPiece(id++),randPiece(id++),randPiece(id++)]; s.score=0;s.combo=0;s.level=1;s.clears=0;s.placed=0;s.over=false;s.started=start;s.msg='';s.msgT=0;s.fx=[];s.placedAnim=[]; setUi(p=>({...p,started:start,paused:false,over:false,score:0,combo:0,level:1,piecesLeft:3,msg:''})); setDrag(null); if(start) beep(520,0.08,'triangle'); };
  useEffect(()=>{reset(false);},[]);
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>setUi(p=>{ if(!p.started||p.over) return p; return {...p,paused:!p.paused}; });

  const placeShape = (idx:number,gx:number,gy:number) => {
    const s=g.current; const shape=s.tray[idx]; if(!shape||s.over||!s.started||ui.paused) return false; if(!canPlace(shape,gx,gy,s.grid)) return false;
    for(const [cx,cy] of shape.cells){ s.grid[gy+cy][gx+cx]=shape.color; s.placedAnim.push({x:gx+cx,y:gy+cy,c:shape.color,t:0}); }
    s.tray[idx]=null; s.placed++; s.score += shape.cells.length*5; beep(420,0.05,'square',0.04);
    const fullRows:number[]=[]; const fullCols:number[]=[];
    for(let y=0;y<GRID;y++) if(s.grid[y].every(Boolean)) fullRows.push(y);
    for(let x=0;x<GRID;x++) if(s.grid.every(r=>r[x])) fullCols.push(x);
    const cleared = fullRows.length+fullCols.length;
    if(cleared>0){
      const cellsFx: {x:number;y:number;c:string;t:number}[]=[];
      for(const y of fullRows) for(let x=0;x<GRID;x++){ if(s.grid[y][x]) cellsFx.push({x,y,c:s.grid[y][x] as string,t:0}); }
      for(const x of fullCols) for(let y=0;y<GRID;y++){ if(s.grid[y][x] && !cellsFx.find(f=>f.x===x&&f.y===y)) cellsFx.push({x,y,c:s.grid[y][x] as string,t:0}); }
      s.fx.push(...cellsFx);
      for(const y of fullRows) for(let x=0;x<GRID;x++) s.grid[y][x]=null;
      for(const x of fullCols) for(let y=0;y<GRID;y++) s.grid[y][x]=null;
      s.combo++; s.clears+=cleared; const gain=cleared*100 + (cleared>1?cleared*40:0) + (s.combo-1)*25; s.score+=gain; s.msg=cleared>1?`Combo x${s.combo} +${gain}`:`Clear +${gain}`; s.msgT=1.4; beep(760,0.1,'triangle',0.06);
    } else s.combo=0;
    refillIfNeeded();
    const piecesLeft=s.tray.filter(Boolean).length;
    if(!anyMove(s.grid,s.tray)){ s.over=true; const best=Math.max(s.best,s.score); s.best=best; try{localStorage.setItem(STORAGE,String(best))}catch{} setUi(p=>({...p,over:true,started:false,score:s.score,best,combo:s.combo,level:s.level,piecesLeft,msg:''})); beep(120,0.25,'sawtooth',0.07); return true; }
    setUi(p=>({...p,score:s.score,combo:s.combo,level:s.level,best:Math.max(p.best,s.score),piecesLeft,msg:s.msg}));
    return true;
  };

  useEffect(()=>{ const id=setInterval(()=>{ const s=g.current; if(s.msgT>0){ s.msgT-=0.1; if(s.msgT<=0){s.msg=''; setUi(p=>({...p,msg:''}));} } else if(ui.msg) setUi(p=>p.msg?{...p,msg:''}:p); },100); return ()=>clearInterval(id); },[ui.msg]);

  return (
    <GameShell title="Block Forge" subtitle="3D Puzzle" backHref={backHref} best={ui.best}
      stats={[{label:'Score',value:ui.score},{label:'Combo',value:ui.combo},{label:'Level',value:ui.level},{label:'Best',value:ui.best}]}
      accent="#2A9D8F" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>}
      instructions={['Drag blocks from the tray onto the 8×8 board.','Fill full rows or columns to clear them and build combos.','A new set appears when all 3 are placed. No rotation.','Game ends when no piece fits. Plan ahead as levels rise.']}
      showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={()=>reset(true)} onRestart={()=>reset(true)} startLabel="Start Puzzle"
      gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Clears {g.current.clears} • Max combo {ui.combo}</div>}>
      <div className="relative h-[640px] sm:h-[680px] w-full" style={{touchAction:'none'}}>
        {ui.msg && <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/50 border border-[rgba(42,157,143,0.5)] text-sm text-[#7fe3d6] backdrop-blur">{ui.msg}</div>}
        <Canvas shadows dpr={[1,1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}>
            <BlockScene g={g} drag={drag} setDrag={setDrag} placeShape={placeShape} canPlace={canPlace} paused={ui.paused} />
          </Suspense>
        </Canvas>
        {ui.paused && ui.started && !ui.over && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p><p className="text-xs text-white/50 mt-1">Resume to place blocks</p></div></div>}
        <TrayUI tray={g.current.tray} dragIdx={drag?.idx ?? null} onPick={(i)=>{ if(!g.current.started||g.current.over||ui.paused) return; setDrag({idx:i,overX:-1,overY:-1,valid:false}); }} />
      </div>
    </GameShell>
  );
}

function BlockScene({ g, drag, setDrag, placeShape, canPlace, paused }: any) {
  const [hover, setHover] = useState<{x:number;y:number}|null>(null);
  const camera = useRef<THREE.PerspectiveCamera>(null);
  useFrame((_, dt) => {
    if (dt>0.05) dt=0.05;
    // The camera is placed above/front of the board but never aimed at it,
    // so the grid renders upside-down and the background covers the board.
    if (camera.current) camera.current.lookAt(0, 0, 0);
    g.current.fx = g.current.fx.filter((f:any)=> (f.t+=dt) < 0.45);
    g.current.placedAnim = g.current.placedAnim.filter((f:any)=> (f.t+=dt) < 0.25);
  });
  const cellToWorld = (x:number,y:number) => [(x - (GRID-1)/2)*0.62, 0.16, (y - (GRID-1)/2)*0.62] as [number,number,number];
  const shape = drag ? g.current.tray[drag.idx] : null;
  const valid = shape && hover ? canPlace(shape, hover.x, hover.y, g.current.grid) : false;

  const onBoardMove = (e:any) => { if(!drag || paused) return; e.stopPropagation(); const p=e.point; const gx=Math.round(p.x/0.62 + (GRID-1)/2); const gy=Math.round(p.z/0.62 + (GRID-1)/2); setHover({x:gx,y:gy}); setDrag((d:any)=> d?{...d,overX:gx,overY:gy,valid: shape?canPlace(shape,gx,gy,g.current.grid):false}:d); };
  const onBoardClick = (e:any) => { if(!drag || paused) return; e.stopPropagation(); const p=e.point; const gx=Math.round(p.x/0.62 + (GRID-1)/2); const gy=Math.round(p.z/0.62 + (GRID-1)/2); if(placeShape(drag.idx,gx,gy)) { setDrag(null); setHover(null); } };

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault position={[0,7.2,6.8]} fov={45} />
      <color attach="background" args={['#050605']} /><fog attach="fog" args={['#050605', 10, 22]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4,8,6]} intensity={1.3} castShadow shadow-mapSize={[1024,1024]} />
      <pointLight position={[-4,4,-3]} intensity={0.8} color="#7fd7ff" />
      <Environment resolution={64} frames={1}><color attach="background" args={['#050605']} /><mesh scale={20}><sphereGeometry args={[1,16,16]} /><meshBasicMaterial color="#0a0c0b" side={THREE.BackSide} /></mesh></Environment>

<group position={[0,0,0]}>
        <RoundedBox args={[GRID*0.62+0.5,0.25,GRID*0.62+0.5]} radius={0.08} smoothness={4} receiveShadow position={[0,-0.05,0]}>
          <meshStandardMaterial color="#1a1916" metalness={0.2} roughness={0.7} />
        </RoundedBox>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.081,0]} onPointerMove={onBoardMove} onPointerDown={onBoardClick}>
          <planeGeometry args={[GRID*0.62, GRID*0.62]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Horizontal grid lines (run along X, spaced along Z) */}
        {Array.from({length:GRID+1}).map((_,i)=>(
          <mesh key={'hz'+i} position={[0, 0.13, (i-GRID/2)*0.62]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[GRID*0.62+0.5, 0.025]} />
            <meshStandardMaterial color="#B8A47A" emissive="#B8A47A" emissiveIntensity={0.6} metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
        {/* Vertical grid lines (run along Z, spaced along X) */}
        {Array.from({length:GRID+1}).map((_,i)=>(
          <mesh key={'vt'+i} position={[(i-GRID/2)*0.62, 0.13, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[0.025, GRID*0.62+0.5]} />
            <meshStandardMaterial color="#B8A47A" emissive="#B8A47A" emissiveIntensity={0.6} metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
        {Array.from({length:GRID}).map((_,y)=>Array.from({length:GRID}).map((__,x)=>{
          const c=g.current.grid[y][x];
          const anim = g.current.placedAnim.find((a:any)=>a.x===x&&a.y===y);
          const sc = anim ? 0.6 + (anim.t/0.25)*0.4 : 1;
          return (
            <group key={x+'-'+y} position={cellToWorld(x,y)}>
              <mesh position={[0,-0.12,0]} receiveShadow><boxGeometry args={[0.56,0.06,0.56]} /><meshStandardMaterial color={c? '#222':'#12110f'} metalness={0.1} roughness={0.9} /></mesh>
              {c && <RoundedBox args={[0.52,0.38,0.52]} radius={0.08} smoothness={4} castShadow receiveShadow scale={[sc,sc,sc]} position={[0,0.08,0]}><meshStandardMaterial color={c} metalness={0.25} roughness={0.35} emissive={c} emissiveIntensity={0.08} /></RoundedBox>}
            </group>
          );
        }))}
        {g.current.fx.map((f:any,i:number)=>{
          const p = f.t/0.45; const [wx,wy,wz]=cellToWorld(f.x,f.y); return <RoundedBox key={i} args={[0.52,0.38,0.52]} radius={0.08} smoothness={2} position={[wx,0.2 + p*0.4,wz]} scale={[1+p*0.4,1-p,1+p*0.4]}><meshStandardMaterial color={f.c} transparent opacity={1-p} emissive={f.c} emissiveIntensity={0.6} /></RoundedBox>;
        })}
        {shape && hover && shape.cells.map(([cx,cy]:any,i:number)=>{
          const gx=hover.x+cx, gy=hover.y+cy; if(gx<0||gy<0||gx>=GRID||gy>=GRID) return null; const [wx,wy,wz]=cellToWorld(gx,gy); return <RoundedBox key={i} args={[0.52,0.38,0.52]} radius={0.08} smoothness={2} position={[wx,0.22,wz]}><meshStandardMaterial color={valid?shape.color:'#ef4444'} transparent opacity={0.45} emissive={valid?shape.color:'#ef4444'} emissiveIntensity={0.35} /></RoundedBox>;
        })}
      </group>
    </>
  );
}

function TrayUI({ tray, dragIdx, onPick }: { tray:(Shape|null)[]; dragIdx:number|null; onPick:(i:number)=>void }) {
  return (
    <div className="absolute left-0 right-0 bottom-0 p-3 sm:p-4 pointer-events-none">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md px-3 py-3 flex gap-2 justify-center pointer-events-auto">
        {tray.map((s,i)=>{
          if(!s) return <div key={i} className="flex-1 h-20 rounded-xl border border-white/5 bg-white/[0.02]" />;
          const xs=s.cells.map(c=>c[0]), ys=s.cells.map(c=>c[1]); const w=Math.max(...xs)+1,h=Math.max(...ys)+1; const cell=14;
          return (
            <button key={i} onClick={()=>onPick(i)} className={`flex-1 h-20 rounded-xl border transition-all flex items-center justify-center ${dragIdx===i?'border-[rgba(42,157,143,0.8)] bg-[rgba(42,157,143,0.12)] scale-[1.02]':'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
              <div style={{position:'relative', width:w*cell, height:h*cell}}>
                {s.cells.map(([cx,cy],k)=>(<span key={k} style={{position:'absolute',left:cx*cell,top:cy*cell,width:cell-2,height:cell-2,borderRadius:4,background:s.color,boxShadow:'inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px rgba(0,0,0,0.35)'}} />))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-center text-[11px] text-white/45 mt-2">Tap a piece, then tap a board cell to place</div>
    </div>
  );
}

// ---- 2D fallback (playable, drag-drop preserved) ----
function BlockFallback({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const rafRef=useRef(0); const audioRef=useRef<AudioContext|null>(null);
  const dragRef=useRef<{idx:number;x:number;y:number}|null>(null); const hoverRef=useRef<{gx:number;gy:number;valid:boolean}|null>(null);
  const g=useRef({grid:Array.from({length:GRID},()=>Array<Cell>(GRID).fill(null)),tray:[randPiece(1),randPiece(2),randPiece(3)] as (Shape|null)[],score:0,best:0,combo:0,level:1,clears:0,placed:0,over:false,started:false,msg:'',msgT:0});
  const [ui,setUi]=useState({started:false,paused:false,over:false,score:0,best:0,combo:0,level:1,muted:false,piecesLeft:3});
  useEffect(()=>{try{g.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0;}catch{} try{setUi(p=>({...p,best:g.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'}));}catch{}},[]);
  const beep=(f=440,d=0.07,t:OscillatorType='sine',v=0.05)=>{ if(ui.muted) return; try{ if(!audioRef.current) audioRef.current=new (window.AudioContext||(window as any).webkitAudioContext)(); const ctx=audioRef.current,o=ctx.createOscillator(),ga=ctx.createGain(); o.type=t;o.frequency.value=f;ga.gain.value=v;o.connect(ga);ga.connect(ctx.destination);o.start();ga.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+d);o.stop(ctx.currentTime+d);}catch{} };
  const refillIfNeeded=()=>{ if(g.current.tray.every(s=>!s)){ let id=Date.now(); g.current.tray=[randPiece(id++),randPiece(id++),randPiece(id++)]; g.current.level=1+Math.floor(g.current.placed/12);} };
  const reset=(start=false)=>{const s=g.current; s.grid=Array.from({length:GRID},()=>Array<Cell>(GRID).fill(null)); let id=1; s.tray=[randPiece(id++),randPiece(id++),randPiece(id++)]; s.score=0;s.combo=0;s.level=1;s.clears=0;s.placed=0;s.over=false;s.started=start;s.msg='';s.msgT=0; setUi(p=>({...p,started:start,paused:false,over:false,score:0,combo:0,level:1,piecesLeft:3})); if(start) beep(520,0.08,'triangle');};
  useEffect(()=>{reset(false);},[]);
  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>setUi(p=>{ if(!p.started||p.over) return p; return {...p,paused:!p.paused}; });
  const placeShape = (idx: number, gx: number, gy: number) => {
    const s = g.current;
    const shape = s.tray[idx];
    if (!shape || s.over || !s.started || ui.paused) return false;
    if (!canPlace(shape, gx, gy, s.grid)) return false;
    for (const [cx, cy] of shape.cells) s.grid[gy + cy][gx + cx] = shape.color;
    s.tray[idx] = null;
    s.placed++;
    s.score += shape.cells.length * 5;
    beep(420, 0.05, 'square', 0.04);
    const fullRows: number[] = [];
    const fullCols: number[] = [];
    for (let y = 0; y < GRID; y++) if (s.grid[y].every(Boolean)) fullRows.push(y);
    for (let x = 0; x < GRID; x++) if (s.grid.every((r) => r[x])) fullCols.push(x);
    const cleared = fullRows.length + fullCols.length;
    if (cleared > 0) {
      for (const y of fullRows) for (let x = 0; x < GRID; x++) s.grid[y][x] = null;
      for (const x of fullCols) for (let y = 0; y < GRID; y++) s.grid[y][x] = null;
      s.combo++;
      s.clears += cleared;
      const gain = cleared * 100 + (cleared > 1 ? cleared * 40 : 0) + (s.combo - 1) * 25;
      s.score += gain;
      s.msg = cleared > 1 ? `Combo x${s.combo} +${gain}` : `Clear +${gain}`;
      s.msgT = 1.2;
      beep(760, 0.1, 'triangle', 0.06);
    } else {
      s.combo = 0;
    }
    refillIfNeeded();
    const piecesLeft = s.tray.filter(Boolean).length;
    if (!anyMove(s.grid, s.tray)) {
      s.over = true;
      const best = Math.max(s.best, s.score);
      s.best = best;
      try { localStorage.setItem(STORAGE, String(best)); } catch {}
      setUi((p) => ({ ...p, over: true, started: false, score: s.score, best, combo: s.combo, level: s.level, piecesLeft }));
      beep(120, 0.25, 'sawtooth', 0.07);
      return true;
    }
    setUi((p) => ({ ...p, score: s.score, combo: s.combo, level: s.level, best: Math.max(p.best, s.score), piecesLeft }));
    return true;
  };
  useEffect(()=>{const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!; const layout={boardX:0,boardY:0,cell:40,trayY:0,traySlots:[] as any[],w:0,h:0}; const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2); const rect=canvas.getBoundingClientRect(); canvas.width=Math.floor(rect.width*dpr); canvas.height=Math.floor(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); layout.w=rect.width; layout.h=rect.height; const maxBoard=Math.min(rect.width-24,360); layout.cell=Math.floor(maxBoard/GRID); const bpx=layout.cell*GRID; layout.boardX=Math.floor((rect.width-bpx)/2); layout.boardY=16; layout.trayY=layout.boardY+bpx+18; const slotW=Math.floor((rect.width-32)/3); layout.traySlots=[0,1,2].map(i=>({x:16+i*slotW,y:layout.trayY,w:slotW-8,h:rect.height-layout.trayY-12}));}; resize(); window.addEventListener('resize',resize); const drawShape=(shape:Shape,ox:number,oy:number,cell:number,alpha=1,ghost=false)=>{ ctx.globalAlpha=alpha; for(const [cx,cy] of shape.cells){ const x=ox+cx*cell,y=oy+cy*cell; rr(ctx,x+2,y+2,cell-4,cell-4,8); ctx.fillStyle=ghost?'rgba(184,164,122,0.35)':shape.color; ctx.fill(); if(!ghost){ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.stroke();} } ctx.globalAlpha=1; }; let last=performance.now(); const loop=(now:number)=>{ const dt=Math.min(0.033,(now-last)/1000); last=now; const s=g.current; if(s.msgT>0) s.msgT-=dt; if(s.msgT<=0) s.msg=''; ctx.clearRect(0,0,layout.w,layout.h); const bg=ctx.createLinearGradient(0,0,0,layout.h); bg.addColorStop(0,'#15130f'); bg.addColorStop(1,'#090908'); ctx.fillStyle=bg; ctx.fillRect(0,0,layout.w,layout.h); const bpx=layout.cell*GRID; rr(ctx,layout.boardX-6,layout.boardY-6,bpx+12,bpx+12,16); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill(); for(let y=0;y<GRID;y++) for(let x=0;x<GRID;x++){ const px=layout.boardX+x*layout.cell,py=layout.boardY+y*layout.cell; rr(ctx,px+3,py+3,layout.cell-6,layout.cell-6,8); const cell=s.grid[y][x]; ctx.fillStyle=cell?cell:'rgba(255,255,255,0.04)'; ctx.fill(); } const hover=hoverRef.current, drag=dragRef.current; if(hover&&drag&&s.tray[drag.idx]) drawShape(s.tray[drag.idx]!, layout.boardX+hover.gx*layout.cell, layout.boardY+hover.gy*layout.cell, layout.cell,1,true); ctx.fillStyle='rgba(255,255,255,0.03)'; rr(ctx,10,layout.trayY-8,layout.w-20,layout.h-layout.trayY,14); ctx.fill(); layout.traySlots.forEach((slot:any,i:number)=>{ const shape=s.tray[i]; if(!shape|| (drag&&drag.idx===i)) return; const xs=shape.cells.map(c=>c[0]),ys=shape.cells.map(c=>c[1]); const sw=Math.max(...xs)+1,sh=Math.max(...ys)+1; const cell=Math.min(26,Math.floor(Math.min((slot.w-16)/Math.max(1,sw),(slot.h-20)/Math.max(1,sh)))); const ox=slot.x+Math.floor((slot.w-sw*cell)/2), oy=slot.y+Math.floor((slot.h-sh*cell)/2); drawShape(shape,ox,oy,cell,1,false); }); if(drag&&s.tray[drag.idx]) drawShape(s.tray[drag.idx]!, drag.x-layout.cell*0.8, drag.y-layout.cell*1.4, layout.cell,0.95,false); if(s.msg){ ctx.fillStyle='rgba(0,0,0,0.45)'; rr(ctx,layout.boardX+20,layout.boardY+10,bpx-40,34,10); ctx.fill(); ctx.fillStyle='#D9CBAB'; ctx.font='600 14px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText(s.msg,layout.boardX+bpx/2,layout.boardY+32);} rafRef.current=requestAnimationFrame(loop); }; rafRef.current=requestAnimationFrame(loop); const toBoard=(x:number,y:number)=>({gx:Math.floor((x-layout.boardX)/layout.cell),gy:Math.floor((y-layout.boardY)/layout.cell)}); const pickTray=(x:number,y:number)=>{ for(let i=0;i<3;i++){ const slot=layout.traySlots[i]; if(x>=slot.x&&x<=slot.x+slot.w&&y>=slot.y&&y<=slot.y+slot.h&&g.current.tray[i]) return i; } return -1; }; const getPos=(e:PointerEvent)=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }; const onDown=(e:PointerEvent)=>{ if(!g.current.started||g.current.over||ui.paused) return; const p=getPos(e); const idx=pickTray(p.x,p.y); if(idx<0) return; dragRef.current={idx,x:p.x,y:p.y}; hoverRef.current=null; canvas.setPointerCapture(e.pointerId); }; const onMove=(e:PointerEvent)=>{ if(!dragRef.current||ui.paused) return; const p=getPos(e); dragRef.current.x=p.x; dragRef.current.y=p.y; const {gx,gy}=toBoard(p.x-layout.cell*0.3,p.y-layout.cell*0.9); const shape=g.current.tray[dragRef.current.idx]; if(shape) hoverRef.current={gx,gy,valid:canPlace(shape,gx,gy,g.current.grid)}; else hoverRef.current=null; }; const onUp=(e:PointerEvent)=>{ if(!dragRef.current) return; const d=dragRef.current; dragRef.current=null; const h=hoverRef.current; hoverRef.current=null; try{canvas.releasePointerCapture(e.pointerId);}catch{} if(h&&h.valid) placeShape(d.idx,h.gx,h.gy); }; canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerup',onUp); canvas.addEventListener('pointercancel',onUp); return ()=>{ window.removeEventListener('resize',resize); canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerup',onUp); canvas.removeEventListener('pointercancel',onUp); cancelAnimationFrame(rafRef.current); }; },[ui.muted,ui.paused]);
  return <GameShell title="Block Forge" subtitle="Puzzle Challenge (Performance Mode)" backHref={backHref} best={ui.best} stats={[{label:'Score',value:ui.score},{label:'Combo',value:ui.combo},{label:'Level',value:ui.level},{label:'Best',value:ui.best}]} accent="#2A9D8F" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over} rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>} instructions={['Drag blocks from tray to the 8×8 board.','Complete rows/columns to clear and combo.','3 blocks per set, no rotation. Game ends when no move fits.']} showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={()=>reset(true)} onRestart={()=>reset(true)} startLabel="Start Puzzle" gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Clears {g.current.clears} • Max combo {ui.combo}</div>}><div className="relative"><canvas ref={canvasRef} className="w-full h-[620px] sm:h-[640px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{touchAction:'none'}}/>{ui.paused && ui.started && !ui.over && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p></div></div>}</div></GameShell>;
}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){const R=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+R,y);ctx.arcTo(x+w,y,x+w,y+h,R);ctx.arcTo(x+w,y+h,x,y+h,R);ctx.arcTo(x,y+h,x,y,R);ctx.arcTo(x,y,x+w,y,R);ctx.closePath();}
