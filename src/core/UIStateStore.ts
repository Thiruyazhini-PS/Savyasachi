/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Master UI Panel Coordinator & Single State Store
 * ==========================================================================
 */

export type ActiveUIPanel = 'none' | 'journal' | 'deduction' | 'audio' | 'vigilance';

export class UIStateStore {
  private static instance: UIStateStore;

  private activePanel: ActiveUIPanel = 'none';
  private listeners: Array<(panel: ActiveUIPanel) => void> = [];

  private constructor() {}

  public static getInstance(): UIStateStore {
    if (!UIStateStore.instance) {
      UIStateStore.instance = new UIStateStore();
    }
    return UIStateStore.instance;
  }

  public getActivePanel(): ActiveUIPanel {
    return this.activePanel;
  }

  public openPanel(panel: ActiveUIPanel) {
    if (this.activePanel !== panel) {
      this.activePanel = panel;
      this.notify();
    }
  }

  public closePanel() {
    if (this.activePanel !== 'none') {
      this.activePanel = 'none';
      this.notify();
    }
  }

  public togglePanel(panel: ActiveUIPanel) {
    if (this.activePanel === panel) {
      this.closePanel();
    } else {
      this.openPanel(panel);
    }
  }

  public subscribe(fn: (panel: ActiveUIPanel) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.activePanel));
  }
}

export const UIStore = UIStateStore.getInstance();
