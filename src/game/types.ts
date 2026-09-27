export type RoleId = 'trukhanov' | 'bedrega' | 'tkach';
export type Skill = 'negotiation' | 'analysis' | 'operations';
export type Metric = 'trust' | 'stability' | 'evidence';
export type Effects = Partial<Record<Metric, number>>;

export interface Character {
  id: RoleId; name: string; initials: string; title: string; area: string;
  description: string; personalGoal: string; color: string;
}
export interface Staff {
  id: string; role: RoleId; name: string; title: string; skill: Skill;
  fatigue: number; busyUntilTick: number;
}
export interface Choice {
  id: string; title: string; description: string; cost: number; skill?: Skill;
  effects: Effects; response: string;
  consequence?: { afterTicks: number; audience: RoleId; text: string; effects: Effects };
}
export interface CaseFile {
  id: string; role: RoleId; kind: 'story' | 'personal'; title: string; summary: string;
  sender: string; location: string; coordinates: [number, number]; body: string;
  reference: string; requires?: string; minTick?: number; choices: Choice[];
}
export interface Decision {
  caseId: string; choiceId: string; staffId: string; tick: number; applied: boolean;
}
export interface JournalEntry {
  id: string; tick: number; audience: RoleId | 'all'; title: string; text: string;
}
export interface PendingConsequence {
  id: string; dueTick: number; audience: RoleId; text: string; effects: Effects;
}
export interface GameState {
  version: 1; tick: number; nextTickAt: number; clockOffset: number;
  selectedRole: RoleId | null; metrics: Record<Metric, number>;
  resources: Record<RoleId, number>; staff: Staff[]; decisions: Decision[];
  consequences: PendingConsequence[]; journal: JournalEntry[];
}
