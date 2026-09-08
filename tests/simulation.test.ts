import { describe, expect, it } from 'vitest';
import { buildRoom, createInitialState, hireStaff, spawnPatient, tick, triggerMassCasualty } from '../src/game/simulation';

describe('Krankenhaus1 simulation',()=>{
  it('creates a valid starter hospital',()=>{const s=createInitialState();expect(s.money).toBe(750000);expect(s.rooms.length).toBeGreaterThan(3);expect(s.staff.length).toBe(6);});
  it('spawns patients with real state',()=>{const s=createInitialState();const p=spawnPatient(s);expect(s.patients).toHaveLength(1);expect(p.name).toBeTruthy();expect(p.vitals.oxygen).toBeGreaterThan(0);});
  it('builds rooms and charges money',()=>{const s=createInitialState();const before=s.money;const result=buildRoom(s,'storage',28,18);expect(result.ok).toBe(true);expect(s.money).toBeLessThan(before);});
  it('hires staff when affordable',()=>{const s=createInitialState();const before=s.staff.length;const hired=hireStaff(s,'nurse');expect(hired).toBeTruthy();expect(s.staff.length).toBe(before+1);});
  it('supports emergency batches',()=>{const s=createInitialState();triggerMassCasualty(s,12);expect(s.patients).toHaveLength(12);expect(s.eventLog[0]).toContain('NOTFALL');});
  it('advances simulation time',()=>{const s=createInitialState();const before=s.timeMinutes;spawnPatient(s);tick(s,5000);expect(s.timeMinutes).toBeGreaterThan(before);});
});
