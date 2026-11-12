'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from './GameShell';

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

function canPlace(shape: Shape, gx: number, gy: number, grid: Cell[][]) {
  for (const [cx, cy] of shape.cells) { const x=gx+cx,y=gy+cy; if(x<0||y<0||x>=GRID||y>=GRID) return false; if(grid[y][x]) return false; }
  return true;
}
function anyMove(grid: Cell[][], tray: (Shape|null)[]) { for(const s of tray){ if(!s) continue; for(let y=0;y<GRID;y++) for(let x=0;x<GRID;x++) if(canPlace(s,x,y,grid)) return true; } return false; }

export default function BlockBlast({ backHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext|null>(null);
  const dragRef = useRef<{idx:number;x:number;y:number}|null>(null);
  const hoverRef = useRef<{gx:number;gy:number;valid:boolean}|null>(null);
  const g = useRef({ grid: Array.from({length:GRID},()=>Array<Cell>(GRID).fill(null)), tray:[randPiece(1),randPiece(2),randPiece(3)] as (Shape|null)[], score:0,best:0,combo:0,level:1,clears:0,placed:0,over:false,started:false,msg:'',msgT:0 });
  const [ui,setUi] = useState({ started:false,paused:false,over:false,score:0,best:0,combo:0,level:1,muted:false,piecesLeft:3 });
  const uiRef = useRef(ui);
  useEffect(() => { uiRef.current = ui; }, [ui]);

  useEffect(()=>{ try{ g.current.best=parseInt(localStorage.getItem(STORAGE)||'0',10)||0; }catch{} try{ setUi(p=>({...p,best:g.current.best,muted:localStorage.getItem(MUTE_KEY)==='1'})); }catch{} },[]);

  const beep=(f=440,d=0.07,t:OscillatorType='sine',v=0.05)=>{ if(uiRef.current.muted) return; try{ if(!audioRef.current) audioRef.current=new (window.AudioContext||(window as any).webkitAudioContext)(); const ctx=audioRef.current,o=ctx.createOscillator(),ga=ctx.createGain(); o.type=t;o.frequency.value=f;ga.gain.value=v;o.connect(ga);ga.connect(ctx.destination);o.start();ga.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+d);o.stop(ctx.currentTime+d);}catch{} };

  const refillIfNeeded=()=>{ if(g.current.tray.every(s=>!s)){ let id=Date.now(); g.current.tray=[randPiece(id++),randPiece(id++),randPiece(id++)]; g.current.level=1+Math.floor(g.current.placed/12);} };

  const reset=(start=false)=>{ const s=g.current; s.grid=Array.from({length:GRID},()=>Array<Cell>(GRID).fill(null)); let id=1; s.tray=[randPiece(id++),randPiece(id++),randPiece(id++)]; s.score=0;s.combo=0;s.level=1;s.clears=0;s.placed=0;s.over=false;s.started=start;s.msg='';s.msgT=0; dragRef.current=null; hoverRef.current=null; setUi(p=>({...p,started:start,paused:false,over:false,score:0,combo:0,level:1,piecesLeft:3})); if(start) beep(520,0.08,'triangle'); };

  useEffect(()=>{ reset(false); },[]);

  const toggleMute=()=>setUi(p=>{const m=!p.muted; try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{} return {...p,muted:m};});
  const togglePause=()=>setUi(p=>{ if(!p.started||p.over) return p; return {...p,paused:!p.paused}; });

  const pendingUi=useRef<Record<string,any>|null>(null);
  const flushScheduled=useRef(false);
  const flushUi=()=>{ flushScheduled.current=false; if(pendingUi.current){ setUi((p:any)=>({...p,...pendingUi.current})); pendingUi.current=null; } };
  const batchUi=(patch:any)=>{ pendingUi.current={...(pendingUi.current||{}),...patch}; if(!flushScheduled.current){ flushScheduled.current=true; requestAnimationFrame(flushUi); } };

  const placeShape = (idx: number, gx: number, gy: number) => {
    const s = g.current;
    const shape = s.tray[idx];
    if (!shape || s.over || !s.started || uiRef.current.paused) return false;
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
      batchUi({ over: true, started: false, score: s.score, best, combo: s.combo, level: s.level, piecesLeft });
      beep(120, 0.25, 'sawtooth', 0.07);
      return true;
    }
    batchUi({ score: s.score, combo: s.combo, level: s.level, best: Math.max(s.best, s.score), piecesLeft });
    return true;
  };

  useEffect(()=>{
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    let cw=0,ch=0,dpr=1;
    let bgGrad:CanvasGradient|null=null;
    const rebuildGrads=()=>{ bgGrad=ctx.createLinearGradient(0,0,0,ch); bgGrad.addColorStop(0,'#15130f'); bgGrad.addColorStop(1,'#090908'); };
    const layout={boardX:0,boardY:0,cell:40,trayY:0,traySlots:[] as {x:number;y:number;w:number;h:number}[],w:0,h:0};
    const resize=()=>{ dpr=Math.min(window.devicePixelRatio||1,2); const rect=canvas.getBoundingClientRect(); canvas.width=Math.floor(rect.width*dpr); canvas.height=Math.floor(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); cw=rect.width; ch=rect.height; layout.w=cw; layout.h=ch; const maxBoard=Math.min(cw-24,360); layout.cell=Math.floor(maxBoard/GRID); const bpx=layout.cell*GRID; layout.boardX=Math.floor((cw-bpx)/2); layout.boardY=16; layout.trayY=layout.boardY+bpx+18; const slotW=Math.floor((cw-32)/3); layout.traySlots=[0,1,2].map(i=>({x:16+i*slotW,y:layout.trayY,w:slotW-8,h:Math.max(72,ch-layout.trayY-12)})); rebuildGrads(); };
    resize(); window.addEventListener('resize',resize);

    const drawCell=(x:number,y:number,cell:number,color:string,alpha=1,ghost=false,valid=true)=>{
      ctx.globalAlpha=alpha;
      rr(ctx,x+2,y+2,cell-4,cell-4,8);
      if(ghost){
        ctx.fillStyle = valid ? 'rgba(42,157,143,0.35)' : 'rgba(239,68,68,0.35)';
        ctx.fill();
        ctx.strokeStyle = valid ? 'rgba(127,227,214,0.7)' : 'rgba(239,68,68,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        const gcol=ctx.createLinearGradient(x,y,x,y+cell); gcol.addColorStop(0,lighten(color,18)); gcol.addColorStop(1,color);
        ctx.fillStyle=gcol; ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(x+5,y+5,cell-10,Math.max(4,(cell-10)*0.22));
      }
      ctx.globalAlpha=1; ctx.lineWidth=1;
    };
    const drawShape=(shape:Shape,ox:number,oy:number,cell:number,alpha=1,ghost=false,valid=true)=>{ for(const [cx,cy] of shape.cells){ drawCell(ox+cx*cell,oy+cy*cell,cell,shape.color,alpha,ghost,valid); } };

    let last=performance.now();
    const loop=(now:number)=>{
      const dt=Math.min(0.033,(now-last)/1000); last=now; const s=g.current;
      if(s.msgT>0) s.msgT-=dt; if(s.msgT<=0) s.msg='';
      ctx.clearRect(0,0,cw,ch);
      ctx.fillStyle=bgGrad!; ctx.fillRect(0,0,cw,ch);
      const bpx=layout.cell*GRID;
      rr(ctx,layout.boardX-6,layout.boardY-6,bpx+12,bpx+12,16); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill();
      ctx.strokeStyle='rgba(184,164,122,0.18)'; ctx.lineWidth=1; ctx.stroke();

      // cells
      for(let y=0;y<GRID;y++) for(let x=0;x<GRID;x++){
        const px=layout.boardX+x*layout.cell,py=layout.boardY+y*layout.cell;
        rr(ctx,px+3,py+3,layout.cell-6,layout.cell-6,8);
        const cell=s.grid[y][x];
        if(cell){ drawCell(px,py,layout.cell,cell,1,false,true); }
        else { ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.stroke(); }
      }
      // grid lines
      ctx.strokeStyle='rgba(184,164,122,0.22)'; ctx.lineWidth=1;
      for(let i=0;i<=GRID;i++){ const gx=layout.boardX+i*layout.cell; ctx.beginPath(); ctx.moveTo(gx,layout.boardY); ctx.lineTo(gx,layout.boardY+bpx); ctx.stroke(); const gy=layout.boardY+i*layout.cell; ctx.beginPath(); ctx.moveTo(layout.boardX,gy); ctx.lineTo(layout.boardX+bpx,gy); ctx.stroke(); }

      const hover=hoverRef.current, drag=dragRef.current;
      if(hover&&drag&&s.tray[drag.idx]) drawShape(s.tray[drag.idx]!, layout.boardX+hover.gx*layout.cell, layout.boardY+hover.gy*layout.cell, layout.cell,1,true,hover.valid);

      // tray area
      rr(ctx,10,layout.trayY-8,cw-20,ch-layout.trayY+4,14); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.stroke();
      layout.traySlots.forEach((slot,i)=>{
        const shape=s.tray[i];
        rr(ctx,slot.x,slot.y,slot.w,slot.h,12);
        ctx.fillStyle = shape ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)';
        ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.stroke();
        if(!shape || (drag && drag.idx===i)) return;
        const xs=shape.cells.map(c=>c[0]),ys=shape.cells.map(c=>c[1]); const sw=Math.max(...xs)+1,sh=Math.max(...ys)+1; const cell=Math.min(24,Math.floor(Math.min((slot.w-20)/Math.max(1,sw),(slot.h-20)/Math.max(1,sh)))); const ox=slot.x+Math.floor((slot.w-sw*cell)/2), oy=slot.y+Math.floor((slot.h-sh*cell)/2);
        drawShape(shape,ox,oy,cell,1,false,true);
      });
      if(drag&&s.tray[drag.idx]) drawShape(s.tray[drag.idx]!, drag.x-layout.cell*0.8, drag.y-layout.cell*1.4, layout.cell,0.95,false,true);
      if(s.msg){ ctx.fillStyle='rgba(0,0,0,0.45)'; rr(ctx,layout.boardX+20,layout.boardY+10,bpx-40,34,10); ctx.fill(); ctx.fillStyle='#D9CBAB'; ctx.font='600 14px Inter, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.msg,layout.boardX+bpx/2,layout.boardY+27); ctx.textBaseline='alphabetic'; }

      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);

    const toBoard=(x:number,y:number)=>({gx:Math.floor((x-layout.boardX)/layout.cell),gy:Math.floor((y-layout.boardY)/layout.cell)});
    const pickTray=(x:number,y:number)=>{ for(let i=0;i<3;i++){ const slot=layout.traySlots[i]; if(x>=slot.x&&x<=slot.x+slot.w&&y>=slot.y&&y<=slot.y+slot.h&&g.current.tray[i]) return i; } return -1; };
    const getPos=(e:PointerEvent)=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
    const onDown=(e:PointerEvent)=>{ const u=uiRef.current, s=g.current; if(!s.started||s.over||u.paused) return; const p=getPos(e); const idx=pickTray(p.x,p.y); if(idx<0) return; dragRef.current={idx,x:p.x,y:p.y}; hoverRef.current=null; try{canvas.setPointerCapture(e.pointerId);}catch{} };
    const onMove=(e:PointerEvent)=>{ if(!dragRef.current||uiRef.current.paused) return; const p=getPos(e); dragRef.current.x=p.x; dragRef.current.y=p.y; const {gx,gy}=toBoard(p.x-layout.cell*0.3,p.y-layout.cell*0.9); const shape=g.current.tray[dragRef.current.idx]; if(shape) hoverRef.current={gx,gy,valid:canPlace(shape,gx,gy,g.current.grid)}; else hoverRef.current=null; };
    const onUp=(e:PointerEvent)=>{ if(!dragRef.current) return; const d=dragRef.current; dragRef.current=null; const h=hoverRef.current; hoverRef.current=null; try{canvas.releasePointerCapture(e.pointerId);}catch{} if(h&&h.valid) placeShape(d.idx,h.gx,h.gy); };
    canvas.addEventListener('pointerdown',onDown);
    canvas.addEventListener('pointermove',onMove);
    canvas.addEventListener('pointerup',onUp);
    canvas.addEventListener('pointercancel',onUp);
    return ()=>{ window.removeEventListener('resize',resize); canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerup',onUp); canvas.removeEventListener('pointercancel',onUp); cancelAnimationFrame(rafRef.current); };
  },[]);

  return (
    <GameShell title="Block Forge" subtitle="Puzzle Challenge" backHref={backHref} best={ui.best}
      stats={[{label:'Score',value:ui.score},{label:'Combo',value:ui.combo},{label:'Level',value:ui.level},{label:'Best',value:ui.best}]}
      accent="#2A9D8F" onPauseToggle={togglePause} paused={ui.paused} running={ui.started && !ui.over}
      rightSlot={<button onClick={toggleMute} className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Toggle sound">{ui.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>}
      instructions={['Drag blocks from the tray onto the 8×8 board.','Complete rows or columns to clear them and build combos.','A new set appears when all 3 are placed. No rotation.','Game ends when no piece fits.']}
      showStart={!ui.started && !ui.over} showGameOver={ui.over} onStart={()=>reset(true)} onRestart={()=>reset(true)} startLabel="Start Puzzle"
      gameOverExtra={<div className="text-sm text-white/60">Score {ui.score} • Clears {g.current.clears} • Max combo {ui.combo}</div>}>
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[620px] sm:h-[640px] rounded-2xl border border-white/10 bg-[#0b0b0a]" style={{touchAction:'none'}}/>
        {ui.paused && ui.started && !ui.over && <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-sm flex items-center justify-center"><div className="px-5 py-3 rounded-xl border border-white/15 bg-black/50 text-center"><p className="text-lg font-semibold">Paused</p></div></div>}
      </div>
    </GameShell>
  );
}

function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){const R=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+R,y);ctx.arcTo(x+w,y,x+w,y+h,R);ctx.arcTo(x+w,y+h,x,y+h,R);ctx.arcTo(x,y+h,x,y,R);ctx.arcTo(x,y,x+w,y,R);ctx.closePath();}
function lighten(hex:string,amt:number){ const c=hex.replace('#',''); const n=parseInt(c.length===3?c.split('').map(ch=>ch+ch).join(''):c,16); let r=(n>>16)+amt,g=((n>>8)&0xff)+amt,b=(n&0xff)+amt; r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b)); return `rgb(${r},${g},${b})`; }
