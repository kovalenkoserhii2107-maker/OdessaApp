import { useState, useEffect } from 'react';
import { activeCases, catchUp, createGame, decide, finishShift, isAvailable } from '../game/engine';
import { loadGame } from '../game/storage';
import type { RoleId } from '../game/types';

// Keep the existing campaign key; the demo never touches the player's campaign.
export function useGameState(demo: boolean) {
  const key = demo ? 'odessa_demo_save' : 'odessa_save';
  const [loaded] = useState(() => {
    try {
      return loadGame(window.localStorage, key);
    } catch {
      return {
        state: createGame(),
        warning: 'Прогресс доступен только до закрытия страницы.',
        writable: false,
      };
    }
  });
  const [state, setState] = useState(loaded.state);
  const [storageWarning, setStorageWarning] = useState(loaded.warning);

  useEffect(() => {
    if (!loaded.writable) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      setStorageWarning(
        'Не удалось сохранить прогресс. Проверьте доступное место и настройки браузера.',
      );
    }
  }, [state, key, loaded.writable]);

  useEffect(() => {
    const update = () => setState((prev) => catchUp(prev));
    const timer = window.setInterval(update, 30_000);
    window.addEventListener('focus', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);

  return {
    state,
    storageWarning,
    activeCases: activeCases(state, state.selectedRole),
    availableStaff: state.staff.filter(
      (staff) => staff.role === state.selectedRole && isAvailable(staff, state.tick),
    ),
    selectRole: (role: RoleId | null) => setState((prev) => ({ ...prev, selectedRole: role })),
    makeDecision: (caseId: string, choiceId: string, staffId: string) =>
      setState((prev) => decide(prev, prev.selectedRole, caseId, choiceId, staffId)),
    advanceTick: () => setState((prev) => finishShift(prev)),
    resetGame: () => setState(createGame()),
  };
}
