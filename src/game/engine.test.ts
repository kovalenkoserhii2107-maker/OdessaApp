import { describe, expect, it } from 'vitest';
import {
  activeCases,
  advanceShifts,
  catchUp,
  createGame,
  decide,
  decisionError,
  finishShift,
  SHIFT_MS,
} from './engine';
import { CASES, INITIAL_STAFF } from './content';
import { loadGame, parseSave } from './storage';
import type { GameState } from './types';

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
  }
  return value;
}
const firstDecision = (state = createGame(1000)) =>
  decide(state, 'trukhanov', 't-story', 'stages', 't-n');

describe('decision validation and deterministic transitions', () => {
  it('does not mutate input, charge twice or accumulate effects under StrictMode replay', () => {
    const original = freezeDeep(createGame(1000));
    const once = firstDecision(original);
    expect(firstDecision(original)).toEqual(once);
    expect(once.decisions).toHaveLength(1);
    expect(once.resources.trukhanov).toBe(88);
    expect(once.metrics.trust).toBe(55);
    expect(original.resources.trukhanov).toBe(100);
    expect(original.staff[0].fatigue).toBe(0);
    expect(firstDecision(once)).toBe(once);
  });

  it.each([
    ['another role', 'bedrega', 't-story', 'stages', 'b-n'],
    ['another department staff', 'trukhanov', 't-story', 'stages', 'b-n'],
    ['wrong skill', 'trukhanov', 't-story', 'stages', 't-a'],
    ['missing staff', 'trukhanov', 't-story', 'stages', 'missing'],
    ['locked chapter', 'trukhanov', 't-story-3', 'head', 't-n'],
    ['missing choice', 'trukhanov', 't-story', 'missing', 't-n'],
  ] as const)('rejects %s', (_, role, file, choice, staff) => {
    const state = createGame(1000);
    expect(decisionError(state, role, file, choice, staff)).toBeTruthy();
    expect(decide(state, role, file, choice, staff)).toBe(state);
  });

  it('rejects a busy employee, exhausted employee and an unaffordable decision', () => {
    const busy = firstDecision();
    expect(decide(busy, 'trukhanov', 't-media', 'talk', 't-n')).toBe(busy);
    const exhausted = createGame(1000);
    exhausted.staff[0].fatigue = 90;
    expect(firstDecision(exhausted)).toBe(exhausted);
    const poor = createGame(1000);
    poor.resources.trukhanov = 11;
    expect(firstDecision(poor)).toBe(poor);
  });

  it('each new campaign starts with independent staff and arrays', () => {
    const played = firstDecision();
    const reset = createGame(1000);
    expect(reset.staff).toEqual(INITIAL_STAFF);
    expect(reset.staff).not.toBe(INITIAL_STAFF);
    expect(reset.decisions).toHaveLength(0);
    expect(played.staff[0].busyUntilTick).toBe(1);
  });

  it('keeps immediate metrics in range', () => {
    const state = createGame(1000);
    state.metrics.trust = 99;
    state.metrics.stability = 1;
    const result = decide(state, 'trukhanov', 't-story', 'date', 't-o');
    expect(result.metrics.trust).toBe(100);
    expect(result.metrics.stability).toBe(0);
  });
});

describe('shift progression', () => {
  it('processes each cross-role consequence once and recovers staff', () => {
    const state = firstDecision();
    const next = advanceShifts(freezeDeep(state), 2);
    expect(next.consequences).toHaveLength(0);
    expect(next.metrics.evidence).toBe(6);
    expect(next.staff[0].fatigue).toBe(0);
    expect(
      next.journal.some((item) => item.audience === 'bedrega' && item.id === 'consequence:t-story'),
    ).toBe(true);
    expect(advanceShifts(next).metrics.evidence).toBe(6);
  });
  it('catches up all overdue shifts without skipping consequences or repeating a boundary', () => {
    const state = firstDecision();
    const result = catchUp(state, 1000 + SHIFT_MS * 5);
    expect(result.tick).toBe(5);
    expect(result.metrics.evidence).toBe(6);
    expect(result.nextTickAt).toBe(1000 + SHIFT_MS * 6);
    expect(catchUp(result, 1000 + SHIFT_MS * 5)).toBe(result);
  });
  it('preserves the new 12-hour cadence after manually finishing a shift', () => {
    const result = finishShift(createGame(1000), 5000);
    expect(result.nextTickAt).toBe(5000 + SHIFT_MS);
    expect(catchUp(result, 5000 + SHIFT_MS - 1)).toBe(result);
  });
  it('requires both a previous decision and the chapter tick', () => {
    expect(
      activeCases(advanceShifts(createGame(1000), 2), 'trukhanov').map((file) => file.id),
    ).not.toContain('t-story-2');
    expect(activeCases(firstDecision(), 'trukhanov').map((file) => file.id)).not.toContain(
      't-story-2',
    );
    expect(
      activeCases(advanceShifts(firstDecision(), 2), 'trukhanov').map((file) => file.id),
    ).toContain('t-story-2');
  });
  it('every scripted choice can be made with a matching employee and sane cost', () => {
    for (const file of CASES)
      for (const choice of file.choices) {
        expect(choice.cost).toBeGreaterThanOrEqual(0);
        expect(
          INITIAL_STAFF.some(
            (staff) => staff.role === file.role && (!choice.skill || choice.skill === staff.skill),
          ),
        ).toBe(true);
        if (file.requires) expect(CASES.some((parent) => parent.id === file.requires)).toBe(true);
      }
  });
});

class MemoryStorage implements Storage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}
describe('save recovery', () => {
  it('preserves role and campaign progression through serialization', () => {
    const state = firstDecision();
    state.selectedRole = 'trukhanov';
    const loaded = parseSave(JSON.stringify(state))!;
    expect(loaded.selectedRole).toBe('trukhanov');
    expect(loaded.decisions).toEqual(state.decisions);
    expect(loaded.resources).toEqual(state.resources);
  });
  it.each(['not json', '{}', '{"version":2}', JSON.stringify({ ...createGame(1000), staff: [] })])(
    'handles invalid saves: %s',
    (raw) => {
      const storage = new MemoryStorage();
      storage.setItem('save', raw);
      const result = loadGame(storage, 'save', 1000);
      expect(result.state.tick).toBe(0);
      expect(result.warning).toBeTruthy();
      expect(storage.getItem('save:backup:1000')).toBe(raw);
    },
  );
  it('will not overwrite corrupt saves if a backup cannot be saved', () => {
    const storage = new MemoryStorage();
    storage.setItem('save', 'broken');
    storage.setItem = () => {
      throw new Error('quota');
    };
    const result = loadGame(storage, 'save', 1000);
    expect(result.writable).toBe(false);
    expect(storage.getItem('save')).toBe('broken');
  });
  it('does not replay stale consequences from the previous engine', () => {
    const old: GameState = firstDecision();
    old.tick = 3;
    expect(parseSave(JSON.stringify(old))!.consequences).toHaveLength(0);
  });
});
