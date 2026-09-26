import { useState, useEffect } from 'react';
import { CASES, INITIAL_STAFF } from '../game/content';
import type { GameState, RoleId, Decision, CaseFile } from '../game/types';

const INITIAL_STATE: GameState = {
  version: 1,
  tick: 0,
  nextTickAt: Date.now() + 1000 * 60 * 60 * 12, // +12 hours
  clockOffset: 0,
  selectedRole: null,
  metrics: { trust: 50, stability: 50, evidence: 0 },
  resources: { trukhanov: 100, bedrega: 100, tkach: 100 },
  staff: INITIAL_STAFF,
  decisions: [],
  consequences: [],
  journal: []
};

export function useGameState(role: RoleId | null) {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('odessa_save');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('odessa_save', JSON.stringify(state));
  }, [state]);

  // Get active cases for current role
  const activeCases = CASES.filter(c => c.role === role && !state.decisions.find(d => d.caseId === c.id));
  
  // Get available staff for current role
  const availableStaff = state.staff.filter(s => s.role === role && s.busyUntilTick <= state.tick);

  const makeDecision = (caseId: string, choiceId: string, staffId: string) => {
    const c = CASES.find(x => x.id === caseId);
    const choice = c?.choices.find(x => x.id === choiceId);
    if (!c || !choice) return;

    setState(prev => {
      const next = { ...prev };
      
      // Mark decision
      next.decisions.push({
        caseId,
        choiceId,
        staffId,
        tick: prev.tick,
        applied: false
      });

      // Mark staff as busy (e.g., for 1 tick)
      const staffIdx = next.staff.findIndex(s => s.id === staffId);
      if (staffIdx !== -1) {
        next.staff[staffIdx].busyUntilTick = prev.tick + 1;
        next.staff[staffIdx].fatigue += 10;
      }

      // Add to journal immediately
      next.journal.push({
        id: Math.random().toString(),
        tick: prev.tick,
        audience: role as RoleId,
        title: c.title,
        text: choice.response
      });

      // Apply immediate effects
      if (choice.effects) {
        if (choice.effects.trust) next.metrics.trust += choice.effects.trust;
        if (choice.effects.stability) next.metrics.stability += choice.effects.stability;
        if (choice.effects.evidence) next.metrics.evidence += choice.effects.evidence;
      }

      // Queue consequence if any
      if (choice.consequence) {
        next.consequences.push({
          id: Math.random().toString(),
          dueTick: prev.tick + choice.consequence.afterTicks,
          audience: choice.consequence.audience,
          text: choice.consequence.text,
          effects: choice.consequence.effects
        });
      }

      return next;
    });
  };

  const advanceTick = () => {
    setState(prev => {
      const next = { ...prev, tick: prev.tick + 1 };
      
      // Process due consequences
      const due = next.consequences.filter(c => c.dueTick === next.tick);
      for (const c of due) {
        // Apply effects
        if (c.effects.trust) next.metrics.trust += c.effects.trust;
        if (c.effects.stability) next.metrics.stability += c.effects.stability;
        if (c.effects.evidence) next.metrics.evidence += c.effects.evidence;

        // Add to journal of the target audience
        next.journal.push({
          id: Math.random().toString(),
          tick: next.tick,
          audience: c.audience,
          title: 'Последствия прошлого решения',
          text: c.text
        });
      }

      return next;
    });
  };

  const resetGame = () => {
    setState(INITIAL_STATE);
  };

  return {
    state,
    activeCases,
    availableStaff,
    makeDecision,
    advanceTick,
    resetGame
  };
}
