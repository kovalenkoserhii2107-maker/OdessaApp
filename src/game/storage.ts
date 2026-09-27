import { z } from 'zod';
import { createGame, catchUp } from './engine';
import { CASES, INITIAL_STAFF } from './content';
import type { GameState } from './types';

const role = z.enum(['trukhanov', 'bedrega', 'tkach']);
const int = z.number().int().nonnegative();
const effects = z.object({
  trust: z.number().optional(),
  stability: z.number().optional(),
  evidence: z.number().optional(),
});
const schema = z.object({
  version: z.literal(1),
  tick: int,
  nextTickAt: z.number().positive(),
  clockOffset: z.number(),
  selectedRole: role.nullable(),
  metrics: z.object({ trust: z.number(), stability: z.number(), evidence: z.number() }),
  resources: z.object({ trukhanov: int, bedrega: int, tkach: int }),
  staff: z.array(
    z.object({
      id: z.string(),
      role,
      name: z.string(),
      title: z.string(),
      skill: z.enum(['negotiation', 'analysis', 'operations']),
      fatigue: z.number(),
      busyUntilTick: int,
    }),
  ),
  decisions: z.array(
    z.object({
      caseId: z.string(),
      choiceId: z.string(),
      staffId: z.string(),
      tick: int,
      applied: z.boolean(),
    }),
  ),
  consequences: z.array(
    z.object({
      id: z.string(),
      dueTick: int,
      audience: z.union([role, z.literal('all')]),
      text: z.string(),
      effects,
    }),
  ),
  journal: z.array(
    z.object({
      id: z.string(),
      tick: int,
      audience: z.union([role, z.literal('all')]),
      title: z.string(),
      text: z.string(),
    }),
  ),
});

export function parseSave(raw: string): GameState | null {
  try {
    const result = schema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const state = result.data;
    if (
      state.staff.length !== INITIAL_STAFF.length ||
      INITIAL_STAFF.some(
        (original) =>
          state.staff.filter(
            (staff) =>
              staff.id === original.id &&
              staff.role === original.role &&
              staff.skill === original.skill,
          ).length !== 1,
      )
    )
      return null;
    if (
      state.decisions.some(
        (decision) =>
          !CASES.some(
            (file) =>
              file.id === decision.caseId &&
              file.choices.some((choice) => choice.id === decision.choiceId),
          ),
      )
    )
      return null;
    // Legacy updaters could duplicate decisions and exceed the metric bounds.
    state.decisions = state.decisions.filter(
      (entry, i, all) => all.findIndex((item) => item.caseId === entry.caseId) === i,
    );
    for (const key of ['trust', 'stability', 'evidence'] as const)
      state.metrics[key] = Math.max(0, Math.min(100, state.metrics[key]));
    state.staff.forEach((staff) => {
      staff.fatigue = Math.max(0, Math.min(100, staff.fatigue));
    });
    // Legacy engine retained processed consequences; never replay them on load.
    state.consequences = state.consequences.filter((item) => item.dueTick > state.tick);
    state.journal = state.journal.map((entry, i, all) =>
      all.findIndex((item) => item.id === entry.id) === i
        ? entry
        : { ...entry, id: `${entry.id}:duplicate:${i}` },
    );
    return state;
  } catch {
    return null;
  }
}

export function loadGame(
  storage: Storage,
  key: string,
  now = Date.now(),
): { state: GameState; warning: string | null; writable: boolean } {
  try {
    const raw = storage.getItem(key);
    if (!raw) return { state: createGame(now), warning: null, writable: true };
    const parsed = parseSave(raw);
    if (parsed) return { state: catchUp(parsed, now), warning: null, writable: true };
    storage.setItem(`${key}:backup:${now}`, raw);
    return {
      state: createGame(now),
      warning:
        'Сохранение повреждено. Его резервная копия оставлена в браузере; начата новая кампания.',
      writable: true,
    };
  } catch {
    return {
      state: createGame(now),
      warning:
        'Браузер не разрешил прочитать или сохранить прогресс. До перезагрузки игра будет работать в памяти.',
      writable: false,
    };
  }
}
