/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Global GameState Store & Knowledge Graph
 * ==========================================================================
 */

import { KnowledgeFlags, ClueDefinition } from '../types';

export type VigilanceState = 'CALM' | 'WATCHFUL' | 'SUSPICIOUS' | 'DANGER';

export class GameStateStore {
  private static instance: GameStateStore;

  public currentRoomIndex: number = 0;
  public suspicion: number = 10; // 0% to 100% (Purochana's Vigilance)
  public vigilanceReason: string = "Guards are distracted by the spring festival. Purochana assumes you are honored guests.";
  public unreadJournalCount: number = 0;
  public isDrishtiActive: boolean = false;
  public isAudioMuted: boolean = false;

  public discoveredClues: Map<string, ClueDefinition> = new Map();
  public synthesizedDeductions: Set<string> = new Set();
  public recordedDecisions: Array<{ roomId: number; note: string }> = [];
  public unlockedRooms: Set<number> = new Set([0]);

  public knowledge: KnowledgeFlags = {
    knowsHouseIsDangerous: false,
    knowsCombustibleMaterials: false,
    understandsViduraWarning: false,
    knowsTunnelExists: false,
    knowsTunnelRoute: false,
    trustsMiner: false,
    knowsBoatSignal: false,
    unlockedSecretSkiff: false,
    preStagedWaterSkins: false,
    sawLacShipment: false,
    noticedDoorMismatch: false,
    knowsNightsRemain: false,
    knowsHollowFlues: false,
    knowsExternalLock: false,
    houseLayoutMapped: false,
    restrainedBhima: false,
    breakCellarEarly: false,
  };

  private listeners: Array<() => void> = [];

  private constructor() {}

  public static getInstance(): GameStateStore {
    if (!GameStateStore.instance) {
      GameStateStore.instance = new GameStateStore();
    }
    return GameStateStore.instance;
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getVigilanceState(): VigilanceState {
    if (this.suspicion < 25) return 'CALM';
    if (this.suspicion < 55) return 'WATCHFUL';
    if (this.suspicion < 80) return 'SUSPICIOUS';
    return 'DANGER';
  }

  public setSuspicion(deltaOrValue: number, reason?: string, isAbsolute: boolean = false) {
    if (isAbsolute) {
      this.suspicion = Math.max(0, Math.min(100, deltaOrValue));
    } else {
      this.suspicion = Math.max(0, Math.min(100, this.suspicion + deltaOrValue));
    }

    if (reason) {
      this.vigilanceReason = reason;
    } else {
      const state = this.getVigilanceState();
      switch (state) {
        case 'CALM':
          this.vigilanceReason = "Guards are distracted by the spring festival. Purochana assumes you are honored guests.";
          break;
        case 'WATCHFUL':
          this.vigilanceReason = "Purochana glances toward you intermittently. Keep your inquiries subtle.";
          break;
        case 'SUSPICIOUS':
          this.vigilanceReason = "Purochana noticed you inspecting the cargo wagons. His smile is strained.";
          break;
        case 'DANGER':
          this.vigilanceReason = "Armed stewards surround the convoy! Step away immediately to cool suspicion!";
          break;
      }
    }
    this.notify();
  }

  public coolSuspicion(amount: number = 3) {
    if (this.suspicion > 10) {
      this.setSuspicion(-amount, undefined, false);
    }
  }

  public incrementUnreadJournal() {
    this.unreadJournalCount++;
    this.notify();
  }

  public markJournalRead() {
    if (this.unreadJournalCount > 0) {
      this.unreadJournalCount = 0;
      this.notify();
    }
  }

  public toggleDrishti(): boolean {
    this.isDrishtiActive = !this.isDrishtiActive;
    this.notify();
    return this.isDrishtiActive;
  }

  public addClue(clue: ClueDefinition) {
    if (!this.discoveredClues.has(clue.id)) {
      this.discoveredClues.set(clue.id, clue);
      this.incrementUnreadJournal();
      this.notify();
    }
  }

  public addDecision(roomId: number, note: string) {
    this.recordedDecisions.push({ roomId, note });
    this.incrementUnreadJournal();
    this.notify();
  }

  public unlockKnowledge(flag: keyof KnowledgeFlags) {
    this.knowledge[flag] = true;
    this.incrementUnreadJournal();
    this.notify();
  }

  public setKnowledgeFlag(flag: keyof KnowledgeFlags, val: boolean = true) {
    this.knowledge[flag] = val;
    this.incrementUnreadJournal();
    this.notify();
  }

  public get clues(): ClueDefinition[] {
    return Array.from(this.discoveredClues.values());
  }
}

export const GameState = GameStateStore.getInstance();
if (typeof window !== 'undefined') {
  (window as any).GameState = GameState;
}
