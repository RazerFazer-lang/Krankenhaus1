import type { HospitalState, Patient, PatientPriority, Room, StaffMember } from './types';
import { DIAGNOSES, FIRST_NAMES, ROOM_DEFS } from './types';

const priorityWeight:Record<PatientPriority,number>={green:1,yellow:2,orange:3,red:4,darkred:5};
const rand=(min:number,max:number)=>Math.random()*(max-min)+min;
const pick=<T,>(items:T[])=>items[Math.floor(Math.random()*items.length)];
const id=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export function createInitialState(hospitalName='Stadtklinik Nord', city='Hamburg'):HospitalState{
  const rooms:Room[]=[
    {id:'room-reception',type:'reception',x:5,y:5,w:5,h:3,name:'Empfang',beds:0,occupied:0,condition:100},
    {id:'room-wait',type:'waiting',x:11,y:5,w:5,h:4,name:'Wartebereich',beds:0,occupied:0,condition:100},
    {id:'room-er',type:'er',x:5,y:10,w:7,h:5,name:'Notaufnahme',beds:2,occupied:0,condition:100},
    {id:'room-lab',type:'lab',x:13,y:10,w:5,h:4,name:'Labor',beds:0,occupied:0,condition:100},
    {id:'room-ward',type:'ward',x:19,y:5,w:7,h:5,name:'Station',beds:8,occupied:0,condition:100},
    {id:'room-tech',type:'technical',x:19,y:11,w:4,h:3,name:'Technik',beds:0,occupied:0,condition:100}
  ];
  const staff:StaffMember[]=[
    makeStaff('Arzt','doctor',8,1.2,5900,8,6),makeStaff('Lena','nurse',6,1.1,4200,11,7),makeStaff('Jonas','nurse',7,1.05,4200,10,8),makeStaff('Marie','nurse',8,1.15,4400,12,7),makeStaff('Timo','cleaner',7,.95,3000,8,13),makeStaff('Sven','technician',8,1,3900,21,12)
  ];
  return {version:1,hospitalName,city,money:750000,reputation:76,morale:82,timeMinutes:8*60, speed:1, day:1, rooms, staff, patients:[],totalTreated:0,totalDeaths:0,totalRevenue:0,totalExpenses:0,eventLog:['08:00 – Krankenhaus eröffnet.','08:00 – Notaufnahme einsatzbereit.'],unlocked:['reception','waiting','er','treatment','ward','lab','technical','storage','pharmacy']};
}
function makeStaff(name:string,role:StaffMember['role'],level:number,speed:number,salary:number,x:number,y:number):StaffMember{return {id:id('staff'),name:name==='Arzt'?'Dr. Weber':name,role,level,skill:level*10,speed,fatigue:15,stress:10,satisfaction:88,x,y,shift:'early',salary,busyUntil:0};}

export function spawnPatient(state:HospitalState, forced?:Partial<Patient>):Patient{
  const d=pick(DIAGNOSES); const age=Math.floor(rand(7,88)); const p:Patient={id:id('pt'),name:`${pick(FIRST_NAMES)} ${pick(['Meyer','Schmidt','Fischer','Wagner','Klein','Becker'])}`,age,diagnosis:d.name,symptoms:d.symptoms,priority:d.priority,vitals:{awareness:100-(d.severity*25),pulse:Math.round(70+d.severity*55),oxygen:Math.round(99-d.severity*8),temperature:Math.round((36.7+d.severity*1.8)*10)/10,pain:Math.round(d.severity*9)},status:'arriving',x:8.5,y:13,waitMinutes:0,treatmentProgress:0,severity:d.severity,source:Math.random()<.55?'walk-in':Math.random()<.75?'RTW':'KTW',...forced};
  state.patients.push(p); state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – Neuer Patient: ${p.name} (${p.diagnosis}).`); state.eventLog=state.eventLog.slice(0,40); return p;
}
function fmtTime(m:number){const h=Math.floor(m/60)%24;const min=Math.floor(m%60);return `${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;}

function nearestRoom(state:HospitalState,type:'er'|'treatment'|'ward'|'icu'|'lab'|'ct'|'xray'|'or'):Room|undefined{return state.rooms.find(r=>r.type===type && (r.beds===0 || r.occupied<r.beds));}

export function tick(state:HospitalState, realDeltaMs:number):void{
  const minutes=realDeltaMs/1000*state.speed*1.7; state.timeMinutes+=minutes;
  const newDay=Math.floor(state.timeMinutes/(24*60))+1;
  if(newDay!==state.day){state.day=newDay; state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – Tageswechsel: Tag ${state.day}.`);}
  const targetRate=state.speed===0?0:(state.speed>=4?0.06:0.035);
  if(Math.random()<targetRate*realDeltaMs/1000) spawnPatient(state);
  for(const p of state.patients){ if(['discharged','deceased'].includes(p.status)) continue; p.waitMinutes += minutes; if(p.status==='arriving') {p.status='triage';p.x=8;p.y=11.5;} else if(p.status==='triage' && p.waitMinutes>1){p.status='waiting';p.x=13.2;p.y=7;} else if(p.status==='waiting') advanceWaiting(state,p,minutes); else if(p.status==='diagnostics') progressDiagnostics(state,p,minutes); else if(p.status==='treatment') progressTreatment(state,p,minutes); else if(p.status==='ward') progressWard(state,p,minutes); }
  for(const s of state.staff){s.fatigue=Math.min(100,s.fatigue+minutes*.018); s.stress=Math.min(100,s.stress+minutes*.008); if(s.busyUntil<=state.timeMinutes)s.targetPatientId=undefined; if(s.role==='technician' && Math.random()<.002*minutes) healBrokenRoom(state); s.x += Math.sign((s.targetPatientId?findPatient(state,s.targetPatientId)?.x:s.x)??s.x-s.x)*minutes*.02; s.satisfaction=Math.max(0,Math.min(100,s.satisfaction - Math.max(0,s.stress-70)*.002*minutes)); }
  const periodic = Math.floor(state.timeMinutes/60); if(periodic!==Math.floor((state.timeMinutes-minutes)/60)) chargeHourly(state);
}
function advanceWaiting(state:HospitalState,p:Patient,_minutes:number){const doctor=state.staff.find(s=>s.role==='doctor' && !s.targetPatientId && s.busyUntil<=state.timeMinutes); if(doctor){doctor.targetPatientId=p.id;p.assignedDoctorId=doctor.id;p.status='diagnostics';p.x=doctor.x;p.y=doctor.y;doctor.busyUntil=state.timeMinutes+3+p.severity*4;} else if(p.waitMinutes>12+20*(1-p.severity)){p.vitals.awareness=Math.max(0,p.vitals.awareness-p.severity*.8);}}
function progressDiagnostics(state:HospitalState,p:Patient,_minutes:number){if(p.waitMinutes>8){p.status='treatment'; const room=nearestRoom(state,'treatment')??nearestRoom(state,'er'); if(room){p.roomId=room.id;p.x=room.x+room.w/2;p.y=room.y+room.h/2;room.occupied=Math.min(room.beds,room.occupied+1);} state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – ${p.name}: Diagnose bestätigt (${p.diagnosis}).`);}}
function progressTreatment(state:HospitalState,p:Patient,minutes:number){p.treatmentProgress += minutes*(1.8+state.staff.filter(s=>s.role==='nurse').length*.03); p.vitals.pulse=Math.max(65,p.vitals.pulse-minutes*p.severity*2); p.vitals.pain=Math.max(0,p.vitals.pain-minutes*.15); if(p.treatmentProgress>10+p.severity*12){ if(p.severity>.93 && p.waitMinutes>35 && Math.random()<.16){p.status='deceased';state.totalDeaths++;state.reputation=Math.max(0,state.reputation-4);state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – KRITISCH: ${p.name} verstorben.`); } else {const ward=nearestRoom(state,'ward'); if(ward && ward.occupied<ward.beds && p.severity>.45){p.status='ward';p.x=ward.x+1+Math.random()*(ward.w-2);p.y=ward.y+1+Math.random()*(ward.h-2);p.roomId=ward.id;ward.occupied++;} else discharge(state,p); } } }
function progressWard(state:HospitalState,p:Patient,minutes:number){p.treatmentProgress+=minutes*.55; if(p.treatmentProgress>24) discharge(state,p);}
function discharge(state:HospitalState,p:Patient){p.status='discharged'; state.totalTreated++; const revenue=250+Math.round(p.severity*900); state.money+=revenue;state.totalRevenue+=revenue;state.reputation=Math.min(100,state.reputation+.025); if(p.roomId){const room=state.rooms.find(r=>r.id===p.roomId);if(room) room.occupied=Math.max(0,room.occupied-1);} state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – ${p.name} erfolgreich entlassen (+${revenue.toLocaleString('de-DE')} €).`);}
function chargeHourly(state:HospitalState){const expense=120+state.staff.reduce((s,x)=>s+x.salary/160,0);state.money-=expense;state.totalExpenses+=expense;state.morale=Math.max(0,state.morale-(state.staff.filter(s=>s.fatigue>85).length*.04));state.reputation=Math.max(0,state.reputation-(state.patients.filter(p=>p.status==='waiting').length>8?.06:0));}
function healBrokenRoom(state:HospitalState){const r=pick(state.rooms);r.condition=Math.min(100,r.condition+10);}
function findPatient(state:HospitalState,id:string){return state.patients.find(p=>p.id===id);}
export function buildRoom(state:HospitalState,type:keyof typeof ROOM_DEFS,x:number,y:number):{ok:boolean;message:string;room?:Room}{
  const def=ROOM_DEFS[type]; if(!def) return {ok:false,message:'Unbekannter Raum'}; if(!state.unlocked.includes(type)) return {ok:false,message:'Abteilung noch nicht freigeschaltet.'}; if(state.money<def.cost) return {ok:false,message:`Nicht genug Geld. Benötigt ${def.cost.toLocaleString('de-DE')} €.`}; if(state.rooms.some(r=>overlap(r.x,r.y,r.w,r.h,x,y,def.w,def.h))) return {ok:false,message:'Baufläche belegt.'};
  const room:Room={id:id('room'),type,x,y,w:def.w,h:def.h,name:`${def.label} ${state.rooms.filter(r=>r.type===type).length+1}`,beds:def.beds,occupied:0,condition:100};state.rooms.push(room);state.money-=def.cost;state.totalExpenses+=def.cost;state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – ${room.name} gebaut (-${def.cost.toLocaleString('de-DE')} €).`);return {ok:true,message:`${room.name} gebaut.`,room};
}
function overlap(x1:number,y1:number,w1:number,h1:number,x2:number,y2:number,w2:number,h2:number){return x1<x2+w2&&x1+w1>x2&&y1<y2+h2&&y1+h1>y2;}
export function hireStaff(state:HospitalState,role:StaffMember['role']):StaffMember|undefined{const costs={doctor:6200,nurse:4200,cleaner:3000,technician:3900,security:3400,admin:3200};if(state.money<5000)return undefined;const s=makeStaff(pick(FIRST_NAMES),role,Math.floor(rand(5,9)),.9+Math.random()*.35,costs[role],9+Math.random()*12,6+Math.random()*10);state.staff.push(s);state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – ${s.name} als ${role==='doctor'?'Arzt':role==='nurse'?'Pflegekraft':role} eingestellt.`);return s;}
export function triggerMassCasualty(state:HospitalState,count=12){for(let i=0;i<count;i++)spawnPatient(state,{priority:i<3?'red':i<6?'orange':'yellow',severity:i<3?.9:.55,status:'arriving'});state.reputation=Math.max(0,state.reputation-1);state.eventLog.unshift(`${fmtTime(state.timeMinutes)} – NOTFALL: Massenanfall von ${count} Patienten angekündigt!`);}
export function priorityScore(p:Patient){return priorityWeight[p.priority]*100-p.waitMinutes;}
