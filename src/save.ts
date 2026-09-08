import type { GameSnapshot, HospitalState } from './game/types';
const KEY='krankenhaus1.save.v1';
export function saveGame(state:HospitalState){const snapshot:GameSnapshot={state,savedAt:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(snapshot));}
export function loadGame():HospitalState|null{try{const raw=localStorage.getItem(KEY);if(!raw)return null;const parsed=JSON.parse(raw) as GameSnapshot;if(parsed.state?.version!==1)return null;return parsed.state;}catch{return null;}}
export function hasSave(){return localStorage.getItem(KEY)!==null;}
export function clearSave(){localStorage.removeItem(KEY);}
