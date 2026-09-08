export type PatientPriority = 'green' | 'yellow' | 'orange' | 'red' | 'darkred';
export type PatientStatus = 'arriving' | 'triage' | 'waiting' | 'diagnostics' | 'treatment' | 'ward' | 'discharged' | 'deceased';
export type StaffRole = 'doctor' | 'nurse' | 'cleaner' | 'technician' | 'security' | 'admin';
export type RoomType = 'reception' | 'waiting' | 'er' | 'treatment' | 'ward' | 'icu' | 'lab' | 'ct' | 'xray' | 'or' | 'pharmacy' | 'storage' | 'technical';

export interface VitalSigns { awareness:number; pulse:number; oxygen:number; temperature:number; pain:number; }
export interface Patient { id:string; name:string; age:number; diagnosis:string; symptoms:string[]; priority:PatientPriority; vitals:VitalSigns; status:PatientStatus; x:number; y:number; waitMinutes:number; roomId?:string; assignedDoctorId?:string; treatmentProgress:number; severity:number; source:'walk-in'|'RTW'|'KTW'; }
export interface StaffMember { id:string; name:string; role:StaffRole; level:number; skill:number; speed:number; fatigue:number; stress:number; satisfaction:number; x:number; y:number; targetPatientId?:string; roomId?:string; shift:'early'|'late'|'night'; salary:number; busyUntil:number; }
export interface Room { id:string; type:RoomType; x:number; y:number; w:number; h:number; name:string; beds:number; occupied:number; condition:number; }
export interface HospitalState { version:1; hospitalName:string; city:string; money:number; reputation:number; morale:number; timeMinutes:number; speed:number; day:number; rooms:Room[]; patients:Patient[]; staff:StaffMember[]; totalTreated:number; totalDeaths:number; totalRevenue:number; totalExpenses:number; eventLog:string[]; unlocked:RoomType[]; }
export interface GameSnapshot { state:HospitalState; savedAt:string; }

export const ROOM_DEFS: Record<RoomType,{label:string;cost:number;w:number;h:number;beds:number;requires?:RoomType[]}> = {
 reception:{label:'Empfang',cost:0,w:5,h:3,beds:0}, waiting:{label:'Wartebereich',cost:15000,w:5,h:4,beds:0,requires:['reception']}, er:{label:'Notaufnahme',cost:35000,w:7,h:5,beds:2,requires:['reception']}, treatment:{label:'Behandlung',cost:22000,w:5,h:4,beds:1,requires:['er']}, ward:{label:'Station',cost:45000,w:7,h:5,beds:8,requires:['reception']}, icu:{label:'Intensivstation',cost:90000,w:7,h:5,beds:4,requires:['ward']}, lab:{label:'Labor',cost:55000,w:5,h:4,beds:0,requires:['reception']}, ct:{label:'CT',cost:120000,w:5,h:4,beds:0,requires:['lab']}, xray:{label:'Röntgen',cost:65000,w:4,h:4,beds:0,requires:['lab']}, or:{label:'OP',cost:160000,w:6,h:5,beds:1,requires:['ward','lab']}, pharmacy:{label:'Apotheke',cost:30000,w:4,h:3,beds:0,requires:['reception']}, storage:{label:'Lager',cost:18000,w:4,h:3,beds:0,requires:['reception']}, technical:{label:'Technik',cost:25000,w:4,h:3,beds:0,requires:['reception']}
};

export const FIRST_NAMES=['Anna','Max','Jonas','Lea','Paul','Mia','Ben','Lena','Tom','Sophie','Noah','Emma','Finn','Marie','Felix','Laura','Leon','Nina'];
export const DIAGNOSES=[
  {name:'Knochenbruch',symptoms:['Schmerz','Schwellung'],priority:'yellow' as const,severity:.35},
  {name:'Herzinfarkt',symptoms:['Brustschmerz','Atemnot'],priority:'red' as const,severity:.92},
  {name:'Schlaganfall',symptoms:['Sprachstörung','Lähmung'],priority:'darkred' as const,severity:.98},
  {name:'Lungenentzündung',symptoms:['Fieber','Husten'],priority:'orange' as const,severity:.65},
  {name:'Schnittverletzung',symptoms:['Blutung','Schmerz'],priority:'green' as const,severity:.18},
  {name:'Asthmaanfall',symptoms:['Atemnot','Pfeifen'],priority:'orange' as const,severity:.7},
  {name:'Vergiftung',symptoms:['Übelkeit','Schwindel'],priority:'orange' as const,severity:.72},
  {name:'Blinddarmentzündung',symptoms:['Bauchschmerz','Fieber'],priority:'yellow' as const,severity:.52}
];
