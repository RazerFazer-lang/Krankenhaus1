import Phaser from 'phaser';
import './style.css';
import { AudioSystem } from './audio';
import { buildRoom, createInitialState, hireStaff, spawnPatient, tick, triggerMassCasualty } from './game/simulation';
import { ROOM_DEFS, type HospitalState, type RoomType } from './game/types';
import { hasSave, loadGame, saveGame } from './save';

const audio=new AudioSystem();
let state:HospitalState=createInitialState();
let running=false;
let selected:{kind:'patient'|'staff'|'room';id:string}|null=null;
let scene:HospitalScene;
const app=document.querySelector<HTMLDivElement>('#app')!;

function boot(){
  app.innerHTML=`<div class="app-shell"><div id="game"></div><div id="overlay"></div></div>`;
  showMenu();
}
function showMenu(){
  const o=document.querySelector('#overlay')!;
  o.innerHTML=`<div class="modal-backdrop"><div class="modal"><h2>Krankenhaus1</h2><p>2D Krankenhaus-Managementsimulation</p><div class="row"><input id="hname" value="Stadtklinik Nord" placeholder="Krankenhausname"></div><div class="row"><input id="city" value="Hamburg" placeholder="Stadt"></div><div class="row"><select id="difficulty"><option value="normal">Normal</option><option value="easy">Einfach</option><option value="hard">Schwer</option><option value="sim">Simulation</option></select></div><div class="actions"><button id="new">Neues Spiel</button><button id="resume" ${hasSave()?'':'disabled'}>Spiel fortsetzen</button></div></div></div>`;
  o.querySelector('#new')!.addEventListener('click',()=>{audio.init();const difficulty=(o.querySelector('#difficulty') as HTMLSelectElement).value;state=createInitialState((o.querySelector('#hname') as HTMLInputElement).value||'Stadtklinik Nord',(o.querySelector('#city') as HTMLInputElement).value||'Hamburg');if(difficulty==='easy')state.money=950000;if(difficulty==='hard')state.money=450000;if(difficulty==='sim')state.money=300000;startGame();});
  o.querySelector('#resume')!.addEventListener('click',()=>{audio.init();const loaded=loadGame();if(loaded)state=loaded;startGame();});
}
function startGame(){document.querySelector('#overlay')!.innerHTML=uiHtml(); scene=new HospitalScene(); const config:Phaser.Types.Core.GameConfig={type:Phaser.AUTO,width:window.innerWidth,height:window.innerHeight,parent:'game',backgroundColor:'#091521',scene:[scene],scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}};new Phaser.Game(config);running=true;wireUi();}
function uiHtml(){return `<div class="hud"><div class="brand">🏥 ${state.hospitalName}</div><div class="stat">Geld<b id="money"></b></div><div class="stat">Patienten<b id="patients"></b></div><div class="stat">Personal<b id="staff"></b></div><div class="stat">Ruf<b id="rep"></b></div><div class="stat">Zeit<b id="clock"></b></div><div class="hud-actions"><button id="pause">⏸</button><button id="speed">×1</button><button id="save">💾</button><button id="menu">☰</button></div></div><div class="side left"><div class="panel-title">Bauen</div><div id="buildList" class="list"></div><div class="panel-title">Aktionen</div><button class="tool" id="spawn">Patient erzeugen <small>+1</small></button><button class="tool" id="mass">Massenanfall <small>12</small></button><button class="tool" id="hireNurse">Pflegekraft einstellen</button><button class="tool" id="hireDoctor">Arzt einstellen</button></div><div class="side right"><div class="panel-title">Live-Dashboard</div><div id="dashboard" class="list"></div><div class="panel-title">Meldungen</div><div id="events" class="list"></div></div><div class="bottom"><button id="normal">▶</button><button id="x2">×2</button><button id="x4">×4</button><button id="x8">×8</button></div><div class="toast" id="toast"></div>`;}
function wireUi(){
  const $=(id:string)=>document.getElementById(id)!;
  $('pause').addEventListener('click',()=>{state.speed=state.speed===0?1:0;audio.click();renderUi();});
  $('speed').addEventListener('click',()=>{state.speed=state.speed===8?1:state.speed*2;audio.click();renderUi();});
  $('save').addEventListener('click',()=>{saveGame(state);toast('Spielstand gespeichert.','ok');audio.success();});
  $('menu').addEventListener('click',()=>{saveGame(state);running=false;scene.game.events.emit('shutdown');scene.game.destroy(true);showMenu();});
  $('spawn').addEventListener('click',()=>{audio.init();spawnPatient(state);toast('Neuer Patient aufgenommen.','ok');audio.click();});
  $('mass').addEventListener('click',()=>{audio.init();triggerMassCasualty(state);toast('🚨 Massenanfall aktiviert!','danger');audio.emergency();});
  $('hireNurse').addEventListener('click',()=>{audio.init();const s=hireStaff(state,'nurse');toast(s?`${s.name} eingestellt.`:'Nicht genug Geld.','ok');audio.success();});
  $('hireDoctor').addEventListener('click',()=>{audio.init();const s=hireStaff(state,'doctor');toast(s?`${s.name} eingestellt.`:'Nicht genug Geld.','ok');audio.success();});
  for(const id of ['normal','x2','x4','x8'])$(id).addEventListener('click',()=>{state.speed=id==='normal'?1:Number(id.slice(1));renderUi();});
  renderBuildList();renderUi();
}
function renderBuildList(){const el=document.getElementById('buildList')!;el.innerHTML=Object.entries(ROOM_DEFS).filter(([t])=>!['reception'].includes(t)).map(([type,d])=>`<button class="tool" data-build="${type}" ${state.money<d.cost?'':''}><span>${d.label}</span><small>${d.cost.toLocaleString('de-DE')} €</small></button>`).join('');el.querySelectorAll('[data-build]').forEach(btn=>btn.addEventListener('click',()=>{const type=(btn as HTMLElement).dataset.build as RoomType;const result=buildRoom(state,type,2+Math.floor(Math.random()*26),3+Math.floor(Math.random()*12));toast(result.message,result.ok?'ok':'danger');if(result.ok)audio.success();else audio.warning();renderBuildList();}));}
function renderUi(){if(!running)return;const fmt=(n:number)=>n.toLocaleString('de-DE',{maximumFractionDigits:0});const h=Math.floor(state.timeMinutes/60)%24,m=Math.floor(state.timeMinutes%60);document.getElementById('money')!.textContent=fmt(state.money)+' €';document.getElementById('patients')!.textContent=`${state.patients.filter(p=>!['discharged','deceased'].includes(p.status)).length}/${state.patients.length}`;document.getElementById('staff')!.textContent=String(state.staff.length);document.getElementById('rep')!.textContent=`${state.reputation.toFixed(0)} %`;document.getElementById('clock')!.textContent=`Tag ${state.day} · ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;document.getElementById('speed')!.textContent=state.speed===0?'⏸':`×${state.speed}`;document.getElementById('dashboard')!.innerHTML=`<div class="card">Notaufnahme: <b>${Math.round(state.patients.filter(p=>['waiting','triage'].includes(p.status)).length)}</b> wartend</div><div class="card">Betten: <b>${state.rooms.reduce((a,r)=>a+r.occupied,0)} / ${state.rooms.reduce((a,r)=>a+r.beds,0)}</b></div><div class="card">Heute behandelt: <b>${state.totalTreated}</b></div><div class="card">Todesfälle: <b>${state.totalDeaths}</b></div><div class="card">Moral: <b>${state.morale.toFixed(0)} %</b></div>`;document.getElementById('events')!.innerHTML=state.eventLog.slice(0,9).map((e,i)=>`<div class="card event ${i===0?'warning':''}">${e}</div>`).join('');}
function toast(text:string,kind:'ok'|'danger'='ok'){const el=document.getElementById('toast');if(!el)return;const item=document.createElement('div');item.className=`toast-item ${kind==='danger'?'danger':'ok'}`;item.textContent=text;el.appendChild(item);setTimeout(()=>item.remove(),3500);}

class HospitalScene extends Phaser.Scene{
  private g!:Phaser.GameObjects.Graphics; private people=new Map<string,Phaser.GameObjects.Arc>(); private roomRects=new Map<string,Phaser.GameObjects.Rectangle>(); private dragging=false; private lastX=0; private lastY=0;
  constructor(){super('HospitalScene');}
  create(){this.g=this.add.graphics();this.cameras.main.setBounds(0,0,1500,900);this.input.on('wheel',(_p:any,_go:any,_dx:number,dy:number)=>{this.cameras.main.zoom=Phaser.Math.Clamp(this.cameras.main.zoom-dy*.0008,.65,2.1);});this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.middleButtonDown()){this.dragging=true;this.lastX=p.x;this.lastY=p.y;} });this.input.on('pointerup',()=>this.dragging=false);this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(this.dragging){this.cameras.main.scrollX-=(p.x-this.lastX)/this.cameras.main.zoom;this.cameras.main.scrollY-=(p.y-this.lastY)/this.cameras.main.zoom;this.lastX=p.x;this.lastY=p.y;}});}
  update(_t:number,delta:number){if(running)tick(state,delta);this.drawWorld();renderUi();}
  drawWorld(){this.g.clear();this.g.fillStyle(0x091721);this.g.fillRect(0,0,1500,900);this.g.fillStyle(0x102432);this.g.fillRect(30,30,1400,800);this.g.lineStyle(2,0x294a60,1);this.g.strokeRect(30,30,1400,800);for(let gx=50;gx<1420;gx+=32){this.g.lineStyle(1,0x173144,.35);this.g.lineBetween(gx,30,gx,830);}for(let gy=50;gy<830;gy+=32){this.g.lineStyle(1,0x173144,.35);this.g.lineBetween(30,gy,1430,gy);}
    const color:Record<string,number>={reception:0x315c75,waiting:0x3b667b,er:0x7d3948,treatment:0x5d3f67,ward:0x3f6d57,icu:0x713b54,lab:0x465b79,ct:0x4b6173,xray:0x4b6173,or:0x694961,pharmacy:0x3f6853,storage:0x5b5b42,technical:0x515e68};
    for(const r of state.rooms){const x=r.x*32,y=r.y*32,w=r.w*32,h=r.h*32;let rect=this.roomRects.get(r.id);if(!rect){rect=this.add.rectangle(x+w/2,y+h/2,w,h,color[r.type]??0x3e5667).setStrokeStyle(2,0x8bb5cc,.65).setInteractive();rect.on('pointerdown',()=>{selected={kind:'room',id:r.id};showSelection(r.name,`${ROOM_DEFS[r.type].label} · ${r.occupied}/${r.beds} Betten · Zustand ${Math.round(r.condition)} %`);});this.roomRects.set(r.id,rect);}rect.setPosition(x+w/2,y+h/2);rect.setSize(w,h);rect.setFillStyle(color[r.type]??0x3e5667,.92);this.add.text(x+7,y+6,r.name,{fontSize:'12px',color:'#eaf5fa',fontStyle:'bold'}).setDepth(2).setData('roomLabel',r.id);if(r.beds>0)this.add.text(x+7,y+h-20,`${r.occupied}/${r.beds} Betten`,{fontSize:'11px',color:'#cfe0ea'}).setDepth(2).setData('roomBedLabel',r.id);}
    const keep=new Set<string>();for(const p of state.patients){if(['discharged','deceased'].includes(p.status))continue;keep.add(p.id);let dot=this.people.get(p.id);if(!dot)dot=this.add.circle(0,0,7,0xffffff).setStrokeStyle(2,0x0b1620).setInteractive().on('pointerdown',()=>{selected={kind:'patient',id:p.id};showSelection(p.name,`${p.diagnosis} · ${priorityText(p.priority)} · ${p.status}`);});dot.setPosition(p.x*32,p.y*32);dot.setFillStyle(priorityColor(p.priority));this.people.set(p.id,dot);}for(const s of state.staff){keep.add(s.id);let dot=this.people.get(s.id);if(!dot)dot=this.add.circle(0,0,6,0x6fb6ff).setStrokeStyle(2,0x0b1620).setInteractive().on('pointerdown',()=>showSelection(s.name,`${roleText(s.role)} · Skill ${s.skill} · Stress ${s.stress.toFixed(0)} %`));dot.setPosition(s.x*32,s.y*32);dot.setFillStyle(0x73b9ff);this.people.set(s.id,dot);}for(const [id,obj] of this.people){if(!keep.has(id)){obj.destroy();this.people.delete(id);}}}
}
function priorityColor(p:string){return p==='darkred'?0xff394d:p==='red'?0xf05e65:p==='orange'?0xff9e52:p==='yellow'?0xf3d361:0x63d38a;}
function priorityText(p:string){return ({green:'Grün',yellow:'Gelb',orange:'Orange',red:'Rot',darkred:'Akut'})[p]??p;}
function roleText(r:string){return ({doctor:'Arzt',nurse:'Pflegekraft',cleaner:'Reinigung',technician:'Technik',security:'Security',admin:'Verwaltung'})[r]??r;}
function showSelection(title:string,detail:string){toast(`${title} — ${detail}`,'ok');}
boot();
