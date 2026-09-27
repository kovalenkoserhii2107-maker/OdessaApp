import { CASES, INITIAL_STAFF } from './content';
import type { Effects, GameState, RoleId, Staff } from './types';

export const SHIFT_MS = 12 * 60 * 60 * 1000;
export const MAX_FATIGUE = 80;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function createGame(now = Date.now()): GameState {
  return {
    version: 1,
    tick: 0,
    nextTickAt: now + SHIFT_MS,
    clockOffset: 0,
    selectedRole: null,
    metrics: { trust: 50, stability: 50, evidence: 0 },
    resources: { trukhanov: 100, bedrega: 100, tkach: 100 },
    staff: INITIAL_STAFF.map((staff) => ({ ...staff })),
    decisions: [],
    consequences: [],
    journal: [
      {
        id: 'welcome',
        tick: 0,
        audience: 'all',
        title: 'Открыто дело «Контур»',
        text: 'Три ведомства получили разные версии одного отчёта. Начните с входящих и назначьте сотрудников. Все события этой истории вымышлены.',
      },
    ],
  };
}

export function activeCases(state: GameState, role: RoleId | null) {
  return CASES.filter(
    (file) =>
      file.role === role &&
      !state.decisions.some((decision) => decision.caseId === file.id) &&
      state.tick >= (file.minTick ?? 0) &&
      (!file.requires || state.decisions.some((decision) => decision.caseId === file.requires)),
  );
}

export function isAvailable(staff: Staff, tick: number) {
  return staff.busyUntilTick <= tick && staff.fatigue < MAX_FATIGUE;
}

export function decisionError(
  state: GameState,
  role: RoleId | null,
  caseId: string,
  choiceId: string,
  staffId: string,
): string | null {
  const file = activeCases(state, role).find((item) => item.id === caseId);
  if (!file) return 'Это дело уже закрыто или пока недоступно.';
  const choice = file.choices.find((item) => item.id === choiceId);
  if (!choice) return 'Выберите решение.';
  const staff = state.staff.find((item) => item.id === staffId && item.role === role);
  if (!staff) return 'Назначьте сотрудника вашего ведомства.';
  if (!isAvailable(staff, state.tick))
    return 'Сотрудник занят или нуждается в отдыхе. Выберите другого.';
  if (choice.skill && choice.skill !== staff.skill)
    return 'Для этого решения нужен сотрудник с подходящим навыком.';
  if (state.resources[file.role] < choice.cost)
    return 'Недостаточно ресурса ведомства для этого решения.';
  return null;
}

function applyEffects(state: GameState, effects: Effects) {
  for (const key of ['trust', 'stability', 'evidence'] as const) {
    state.metrics[key] = clamp(state.metrics[key] + (effects[key] ?? 0));
  }
}

// Pure transitions: React StrictMode may invoke an updater twice with the same input.
export function decide(
  state: GameState,
  role: RoleId | null,
  caseId: string,
  choiceId: string,
  staffId: string,
): GameState {
  if (decisionError(state, role, caseId, choiceId, staffId)) return state;
  const file = CASES.find((item) => item.id === caseId)!;
  const choice = file.choices.find((item) => item.id === choiceId)!;
  const next = structuredClone(state);
  next.resources[file.role] -= choice.cost;
  next.decisions.push({ caseId, choiceId, staffId, tick: state.tick, applied: true });
  const staff = next.staff.find((item) => item.id === staffId)!;
  staff.busyUntilTick = state.tick + 1;
  staff.fatigue = clamp(staff.fatigue + 25);
  next.journal.push({
    id: `decision:${caseId}`,
    tick: state.tick,
    audience: file.role,
    title: file.title,
    text: choice.response,
  });
  applyEffects(next, choice.effects);
  if (choice.consequence) {
    next.consequences.push({
      id: `consequence:${caseId}`,
      dueTick: state.tick + choice.consequence.afterTicks,
      audience: choice.consequence.audience,
      text: choice.consequence.text,
      effects: { ...choice.consequence.effects },
    });
  }
  return next;
}

export function advanceShifts(state: GameState, count = 1): GameState {
  if (!Number.isSafeInteger(count) || count < 1) return state;
  const next = structuredClone(state);
  next.tick += count;
  next.nextTickAt += SHIFT_MS * count;
  next.staff = next.staff.map((staff) => ({
    ...staff,
    fatigue: clamp(staff.fatigue - 25 * count),
  }));
  const due = next.consequences
    .filter((item) => item.dueTick <= next.tick)
    .sort((a, b) => a.dueTick - b.dueTick);
  next.consequences = next.consequences.filter((item) => item.dueTick > next.tick);
  for (const consequence of due) {
    applyEffects(next, consequence.effects);
    next.journal.push({
      id: consequence.id,
      tick: consequence.dueTick,
      audience: consequence.audience,
      title: 'Ответ на прежнее решение',
      text: consequence.text,
    });
  }
  next.journal.push({
    id: `shift:${next.tick}`,
    tick: next.tick,
    audience: 'all',
    title: `Началась смена ${next.tick + 1}`,
    text:
      count > 1
        ? `Пока вас не было, прошло смен: ${count}. Ответы собраны в журнале, непрочитанные дела сохранены.`
        : 'Команда вернулась с поручений и отдохнула. Проверьте новые дела и ответы.',
  });
  return next;
}

export function catchUp(state: GameState, now = Date.now()): GameState {
  if (now < state.nextTickAt) return state;
  return advanceShifts(state, Math.floor((now - state.nextTickAt) / SHIFT_MS) + 1);
}

export function finishShift(state: GameState, now = Date.now()): GameState {
  return { ...advanceShifts(state), nextTickAt: now + SHIFT_MS };
}
