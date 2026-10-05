/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * TypeScript Core Types & Room Data Contracts
 * ==========================================================================
 */

export type ActMood = 
  | 'ACT I: BEAUTY & CELEBRATION'
  | 'ACT II: CURIOSITY & SPLENDOR'
  | 'ACT III: SUSPICION & CHEMICAL DANGER'
  | 'ACT IV: PARANOIA & THE ENIGMA'
  | 'ACT V: PREPARATION & THE UNDERGROUND'
  | 'ACT VI: PANIC & THE FINAL BANQUET'
  | 'ACT VII: SURVIVAL & THE INFERNO'
  | 'ACT VIII: SILENCE & THE GANGA'
  | 'ACT IX: UNCERTAINTY & SURVIVAL';

export type MusicState = 
  | 'NORMAL'
  | 'CURIOUS'
  | 'INVESTIGATION'
  | 'SUSPICIOUS'
  | 'DANGER'
  | 'PANIC'
  | 'RELIEF'
  | 'UNCERTAINTY'
  | 'SILENCE';

export interface ClueDefinition {
  id: string;
  title: string;
  type: string;
  desc: string;
  icon?: string;
  roomId?: number;
}

export interface HotspotDefinition {
  id: string;
  title: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  icon: string;
  tag: string;
  drishtiHint: string;
  description: string;
  sensory: string;
  hollow: boolean;
  clue?: ClueDefinition;
}

export interface NPCDefinition {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initialX: number;
  initialY: number;
  state: string;
  dialogue: string;
  routineText: string;
}

export interface PuzzleDefinition {
  type: string;
  tag: string;
  title: string;
  instruction: string;
  elements?: any[];
  correctOrder?: string[];
  correctSelection?: string;
  targetAngle?: number;
  currentAngle?: number;
  steps?: any[];
  pattern?: number[];
  solutionNote: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  effect: string;
  suspicionDelta: number;
  recordedNote: string;
  unlockFlag?: string;
}

export interface DecisionDefinition {
  title: string;
  desc: string;
  options: DecisionOption[];
}

export interface BreakthroughDefinition {
  heading: string;
  narrative: string;
  buttonText: string;
}

export interface RoomDefinition {
  id: number;
  act: ActMood;
  themeClass: string;
  title: string;
  location: string;
  arrival: {
    sub: string;
    normalAspect: string;
    wrongAspect: string;
  };
  backgroundActivity: string[];
  ambientLog: string;
  npcs: NPCDefinition[];
  hotspots: HotspotDefinition[];
  puzzle: PuzzleDefinition;
  decision: DecisionDefinition;
  breakthrough: BreakthroughDefinition;
}

export interface KnowledgeFlags {
  knowsHouseIsDangerous: boolean;
  knowsCombustibleMaterials: boolean;
  understandsViduraWarning: boolean;
  knowsTunnelExists: boolean;
  knowsTunnelRoute: boolean;
  trustsMiner: boolean;
  knowsBoatSignal: boolean;
  unlockedSecretSkiff: boolean;
  preStagedWaterSkins: boolean;
  sawLacShipment: boolean;
  noticedDoorMismatch: boolean;
  knowsNightsRemain: boolean;
  knowsHollowFlues: boolean;
  knowsExternalLock: boolean;
  houseLayoutMapped: boolean;
  restrainedBhima: boolean;
  breakCellarEarly: boolean;
}
