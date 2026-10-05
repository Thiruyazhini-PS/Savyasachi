/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Master Application Coordinator & In-World Escape-Room Gameplay Engine
 * ==========================================================================
 */

import gsap from 'gsap';
import { GameState } from './core/GameState';
import { UIStore, ActiveUIPanel } from './core/UIStateStore';
import { AudioEngine } from './audio/SpatialAudio';
import { WorldEngine } from './render/WorldRenderer';
import { Tableau } from './tableau/DeductionBoard';
import { Folio, FolioSketchbook } from './journal/Sketchbook';
import { ClueDefinition } from './types';
import { ROOM2_PUZZLE_CONFIG } from './rooms/RoomData';

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  type: string;
  desc: string;
  imageSrc: string;
}

class ChakravyuhaApp {
  // Inventory
  private satchelItems: InventoryItem[] = [];
  private isSatchelOpen: boolean = false;

  // Escape Room Lock State for Cargo Crate
  private lockDials = [0, 0, 0]; // 0-9
  private readonly SANSKRIT_NUMERALS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  private readonly TARGET_COMBINATION = [4, 2, 3]; // ४ - २ - ३
  private isCrateUnlocked: boolean = false;
  private difficultyMode: 'STORY' | 'STANDARD' | 'SCHOLAR' = 'STANDARD';
  private failedCrateAttempts: number = 0;
  private currentCloseUpObject: 'crate' | 'tally' | 'disc' | 'convoy' | 'folio_plan' | 'plan_table' | 'east_wall' | 'lotus_plate' | 'door_latch' | 'camphor_chest' | 'hidden_stair' | null = null;

  // Room State Machine & Routine System
  public currentRoomId: 1 | 2 = 1;
  private room2LotusAngle: number = 0;
  private room2MeasuredGap: boolean = false;
  private room2KnockedHollow: boolean = false;
  private room2PanelUnlocked: boolean = false;
  private room2Revisited: boolean = false;
  private room2RoutineTimer: any = null;
  private room2RoutineElapsed: number = 0;
  private room2IdleBarkTimer: any = null;
  private room2DecisionMade: boolean = false;
  private room2GuardStationedAtEastWall: boolean = false;

  // Scene State Machine
  private currentScene: 'MANHWA' | 'MANHWA_ROOM2' | 'GATE_ROOM' | 'CLOSEUP' = 'MANHWA';
  private currentPanelIndex: number = 0;
  private readonly TOTAL_MANHWA_PANELS: number = 8;
  private currentRoom2PanelIndex: number = 0;
  private readonly TOTAL_ROOM2_MANHWA_PANELS: number = 7;
  private isWheelThrottled: boolean = false;
  private captionTimeout: any = null;

  // DOM elements cache
  private dom!: {
    audioPrompt: HTMLElement;
    btnEnterStory: HTMLButtonElement;
    actTag: HTMLElement;
    chapterTitle: HTMLElement;
    
    // Top-Right HUD Controls
    vigilanceWidget: HTMLElement;
    vigilanceFlame: HTMLElement;
    vigilanceText: HTMLElement;
    vigilancePopover: HTMLElement;
    vigilancePopoverStatus: HTMLElement;
    vigilancePopoverDesc: HTMLElement;

    btnSound: HTMLButtonElement;
    soundSvg: SVGElement | null;
    muteSlashLine: SVGLineElement | null;
    soundPopover: HTMLElement;
    btnCloseSound: HTMLButtonElement;
    btnToggleMutePanel: HTMLButtonElement;
    panelSoundIcon: HTMLElement;
    panelMuteLabel: HTMLElement;
    sliderMaster: HTMLInputElement;
    sliderMusic: HTMLInputElement;
    sliderAmbient: HTMLInputElement;
    sliderSfx: HTMLInputElement;
    sliderVoice: HTMLInputElement;
    valMaster: HTMLElement;
    valMusic: HTMLElement;
    valAmbient: HTMLElement;
    valSfx: HTMLElement;
    valVoice: HTMLElement;
    toggleAudioCaptions: HTMLInputElement;
    audioCaptionToast: HTMLElement;

    btnFolio: HTMLButtonElement;
    folioBadge: HTMLElement;
    folioDrawer: HTMLElement;
    folioBookBackdrop: HTMLElement | null;
    btnCloseFolio: HTMLButtonElement;

    btnDeduction: HTMLButtonElement;
    deductionBadge: HTMLElement;
    deductionDrawer: HTMLElement;
    deductionBackdrop: HTMLElement | null;
    btnCloseDeduction: HTMLButtonElement;

    hudDimBackdrop: HTMLElement;

    btnSatchel: HTMLButtonElement;
    inventoryCount: HTMLElement;
    inventoryTray: HTMLElement;
    btnDrishti: HTMLButtonElement;
    drishtiOverlay: HTMLElement;
    btnNextRoom: HTMLButtonElement;
    arrivalBanner: HTMLElement;
    arrivalLocation: HTMLElement;
    arrivalSub: HTMLElement;
    ambientTickerText: HTMLElement;
    interactiveScene: HTMLElement;
    speechBubbleContainer: HTMLElement;
    btnPanLeft: HTMLButtonElement;
    btnPanRight: HTMLButtonElement;
    btnSkipCinematic: HTMLButtonElement;
    closeupModal: HTMLElement;
    closeupViewport: HTMLElement;
    btnCloseCloseup: HTMLButtonElement;
    closeupImage: HTMLImageElement;
    closeupInteractiveLayer: HTMLElement;
    closeupObjectLabel: HTMLElement;
    closeupWhisperText: HTMLElement;
    btnInspectTallyShortcut: HTMLButtonElement;
    btnHintCandle: HTMLButtonElement;
    hintModal: HTMLElement;
    btnCloseHint: HTMLButtonElement;
    btnHighlightTally: HTMLButtonElement;
    btnTriggerShowMe: HTMLButtonElement;
    decisionModal: HTMLElement;
    decisionTitle: HTMLElement;
    decisionDesc: HTMLElement;
    decisionOptions: HTMLElement;
    cinematicModal: HTMLElement;
    btnCinematicContinue: HTMLButtonElement;
    btnReplayManhwa: HTMLButtonElement | null;
    btnReplayManhwaRoom2: HTMLButtonElement | null;
    manhwaContainer: HTMLElement;
    manhwaPanels: HTMLElement[];
    btnManhwaPrev: HTMLButtonElement;
    btnManhwaNext: HTMLButtonElement;
    btnSkipManhwa: HTMLButtonElement;
    manhwaPanelCounter: HTMLElement;
    manhwaContainerRoom2: HTMLElement;
    manhwaPanelsRoom2: HTMLElement[];
    btnManhwaPrevRoom2: HTMLButtonElement;
    btnManhwaNextRoom2: HTMLButtonElement;
    btnSkipManhwaRoom2: HTMLButtonElement;
    manhwaPanelCounterRoom2: HTMLElement;
    btnEnterRoom2FromManhwa: HTMLButtonElement | null;
    btnEnterGateRoom: HTMLButtonElement | null;
    viewportStage: HTMLElement;
    btnTabRoom1: HTMLButtonElement | null;
    btnTabRoom2: HTMLButtonElement | null;
  };

  public async init() {
    this.cacheDOM();
    this.bindEvents();
    this.setupUIStore();
    this.setupGameStateSubscriptions();

    // Initialize Manhwa Reader at first panel (Prev button disabled)
    this.goToPanel(0, false);

    // Initialize 2.5D World Renderer on canvas
    const worldCanvas = document.getElementById('world-canvas') as HTMLCanvasElement;
    if (worldCanvas) {
      await WorldEngine.init(worldCanvas);
    }

    // Initialize Deduction Tableau and Folio
    Tableau.init();
    Folio.init();

    // Render Varanavata Scene Entities
    this.renderVaranavataScene();

    // Expose for testing & verification
    (window as any).chakravyuha = {
      app: this,
      UIStore,
      GameState,
      AudioEngine,
      Tableau,
      Folio,
    };
  }

  private cacheDOM() {
    this.dom = {
      audioPrompt: document.getElementById('audio-init-prompt')!,
      btnEnterStory: document.getElementById('btn-enter-story') as HTMLButtonElement,
      actTag: document.getElementById('act-tag')!,
      chapterTitle: document.getElementById('chapter-title')!,

      vigilanceWidget: document.getElementById('vigilance-widget')!,
      vigilanceFlame: document.getElementById('candle-flame')!,
      vigilanceText: document.getElementById('vigilance-text')!,
      vigilancePopover: document.getElementById('vigilance-popover')!,
      vigilancePopoverStatus: document.getElementById('vigilance-popover-status')!,
      vigilancePopoverDesc: document.getElementById('vigilance-popover-desc')!,

      btnSound: document.getElementById('btn-sound') as HTMLButtonElement,
      soundSvg: document.getElementById('sound-svg') as unknown as SVGElement,
      muteSlashLine: document.getElementById('mute-slash-line') as unknown as SVGLineElement,
      soundPopover: document.getElementById('sound-popover')!,
      btnCloseSound: document.getElementById('btn-close-sound') as HTMLButtonElement,
      btnToggleMutePanel: document.getElementById('btn-toggle-mute-panel') as HTMLButtonElement,
      panelSoundIcon: document.getElementById('panel-sound-icon')!,
      panelMuteLabel: document.getElementById('panel-mute-label')!,
      sliderMaster: document.getElementById('slider-master') as HTMLInputElement,
      sliderMusic: document.getElementById('slider-music') as HTMLInputElement,
      sliderAmbient: document.getElementById('slider-ambient') as HTMLInputElement,
      sliderSfx: document.getElementById('slider-sfx') as HTMLInputElement,
      sliderVoice: document.getElementById('slider-voice') as HTMLInputElement,
      valMaster: document.getElementById('val-master')!,
      valMusic: document.getElementById('val-music')!,
      valAmbient: document.getElementById('val-ambient')!,
      valSfx: document.getElementById('val-sfx')!,
      valVoice: document.getElementById('val-voice')!,
      toggleAudioCaptions: document.getElementById('toggle-audio-captions') as HTMLInputElement,
      audioCaptionToast: document.getElementById('audio-caption-toast')!,

      btnFolio: document.getElementById('btn-folio') as HTMLButtonElement,
      folioBadge: document.getElementById('folio-badge')!,
      folioDrawer: document.getElementById('folio-drawer')!,
      folioBookBackdrop: document.getElementById('folio-book-backdrop'),
      btnCloseFolio: document.getElementById('btn-close-folio') as HTMLButtonElement,

      btnDeduction: document.getElementById('btn-deduction') as HTMLButtonElement,
      deductionBadge: document.getElementById('deduction-badge')!,
      deductionDrawer: document.getElementById('deduction-drawer')!,
      deductionBackdrop: document.getElementById('deduction-backdrop'),
      btnCloseDeduction: document.getElementById('btn-close-deduction') as HTMLButtonElement,

      hudDimBackdrop: document.getElementById('hud-dim-backdrop')!,

      btnSatchel: document.getElementById('btn-satchel') as HTMLButtonElement,
      inventoryCount: document.getElementById('inventory-count')!,
      inventoryTray: document.getElementById('inventory-tray')!,
      btnDrishti: document.getElementById('btn-drishti') as HTMLButtonElement,
      drishtiOverlay: document.getElementById('drishti-overlay')!,
      btnNextRoom: document.getElementById('btn-next-room') as HTMLButtonElement,
      arrivalBanner: document.getElementById('arrival-banner')!,
      arrivalLocation: document.getElementById('arrival-location')!,
      arrivalSub: document.getElementById('arrival-sub')!,
      ambientTickerText: document.getElementById('ambient-ticker-text')!,
      interactiveScene: document.getElementById('interactive-scene')!,
      speechBubbleContainer: document.getElementById('speech-bubble-container')!,
      btnPanLeft: document.getElementById('btn-pan-left') as HTMLButtonElement,
      btnPanRight: document.getElementById('btn-pan-right') as HTMLButtonElement,
      btnSkipCinematic: document.getElementById('btn-skip-cinematic') as HTMLButtonElement,
      closeupModal: document.getElementById('closeup-modal')!,
      closeupViewport: document.getElementById('closeup-viewport')!,
      btnCloseCloseup: document.getElementById('btn-close-closeup') as HTMLButtonElement,
      closeupImage: document.getElementById('closeup-image') as HTMLImageElement,
      closeupInteractiveLayer: document.getElementById('closeup-interactive-layer')!,
      closeupObjectLabel: document.getElementById('closeup-object-label')!,
      closeupWhisperText: document.getElementById('closeup-whisper-text')!,
      btnInspectTallyShortcut: document.getElementById('btn-inspect-tally-shortcut') as HTMLButtonElement,
      btnHintCandle: document.getElementById('btn-hint-candle') as HTMLButtonElement,
      hintModal: document.getElementById('hint-modal')!,
      btnCloseHint: document.getElementById('btn-close-hint') as HTMLButtonElement,
      btnHighlightTally: document.getElementById('btn-highlight-tally') as HTMLButtonElement,
      btnTriggerShowMe: document.getElementById('btn-trigger-show-me') as HTMLButtonElement,
      decisionModal: document.getElementById('decision-modal')!,
      decisionTitle: document.getElementById('decision-title')!,
      decisionDesc: document.getElementById('decision-desc')!,
      decisionOptions: document.getElementById('decision-options')!,
      cinematicModal: document.getElementById('cinematic-modal')!,
      btnCinematicContinue: document.getElementById('btn-cinematic-continue') as HTMLButtonElement,
      btnReplayManhwa: document.getElementById('btn-replay-manhwa') as HTMLButtonElement | null,
      btnReplayManhwaRoom2: document.getElementById('btn-replay-manhwa-room2') as HTMLButtonElement | null,
      manhwaContainer: document.getElementById('manhwa-container')!,
      manhwaPanels: Array.from(document.querySelectorAll('#manhwa-panels-column .manhwa-panel')) as HTMLElement[],
      btnManhwaPrev: document.getElementById('btn-manhwa-prev') as HTMLButtonElement,
      btnManhwaNext: document.getElementById('btn-manhwa-next') as HTMLButtonElement,
      btnSkipManhwa: document.getElementById('btn-skip-manhwa') as HTMLButtonElement,
      manhwaPanelCounter: document.getElementById('manhwa-panel-counter')!,
      manhwaContainerRoom2: document.getElementById('manhwa-container-room2')!,
      manhwaPanelsRoom2: Array.from(document.querySelectorAll('#manhwa-panels-column-room2 .manhwa-panel')) as HTMLElement[],
      btnManhwaPrevRoom2: document.getElementById('btn-manhwa-prev-room2') as HTMLButtonElement,
      btnManhwaNextRoom2: document.getElementById('btn-manhwa-next-room2') as HTMLButtonElement,
      btnSkipManhwaRoom2: document.getElementById('btn-skip-manhwa-room2') as HTMLButtonElement,
      manhwaPanelCounterRoom2: document.getElementById('manhwa-panel-counter-room2')!,
      btnEnterRoom2FromManhwa: document.getElementById('btn-enter-room2-from-manhwa') as HTMLButtonElement | null,
      btnEnterGateRoom: document.getElementById('btn-enter-gate-room') as HTMLButtonElement | null,
      viewportStage: document.getElementById('viewport-stage')!,
      btnTabRoom1: document.getElementById('btn-tab-room1') as HTMLButtonElement | null,
      btnTabRoom2: document.getElementById('btn-tab-room2') as HTMLButtonElement | null,
    };
  }

  private setupUIStore() {
    UIStore.subscribe((panel: ActiveUIPanel) => {
      // Hide all panels
      this.dom.soundPopover.classList.add('hidden');
      this.dom.vigilancePopover.classList.add('hidden');
      this.dom.folioDrawer.classList.add('hidden');
      this.dom.deductionDrawer.classList.add('hidden');
      this.dom.hudDimBackdrop.classList.add('hidden');

      if (panel === 'none') {
        return;
      }

      AudioEngine.playPaperTurn();
      this.dom.hudDimBackdrop.classList.remove('hidden');

      switch (panel) {
        case 'audio':
          this.dom.soundPopover.classList.remove('hidden');
          this.syncAudioPopoverSliders();
          break;
        case 'vigilance':
          this.dom.vigilancePopover.classList.remove('hidden');
          this.updateVigilancePopoverUI();
          break;
        case 'journal':
          this.dom.folioDrawer.classList.remove('hidden');
          Folio.onOpen();
          GameState.markJournalRead();
          break;
        case 'deduction':
          this.dom.deductionDrawer.classList.remove('hidden');
          Tableau.resizeCanvas();
          Tableau.renderTray();
          requestAnimationFrame(() => {
            Tableau.resizeCanvas();
          });
          break;
      }
    });
  }

  private setupGameStateSubscriptions() {
    GameState.subscribe(() => {
      this.updateVigilanceUI();
      this.updateBadgesUI();
    });

    // Audio caption toast event
    window.addEventListener('audio-caption', (e: any) => {
      const text = e.detail?.text;
      if (!text || !this.dom.audioCaptionToast) return;
      this.dom.audioCaptionToast.innerText = text;
      this.dom.audioCaptionToast.classList.remove('hidden');
      this.dom.audioCaptionToast.style.opacity = '1';

      if (this.captionTimeout) clearTimeout(this.captionTimeout);
      this.captionTimeout = setTimeout(() => {
        this.dom.audioCaptionToast.style.opacity = '0';
        setTimeout(() => this.dom.audioCaptionToast.classList.add('hidden'), 400);
      }, 2600);
    });

    this.updateVigilanceUI();
    this.updateBadgesUI();
    this.updateSoundIconUI(AudioEngine.isMuted);
  }

  private updateBadgesUI() {
    // Folio badge
    if (this.dom.folioBadge) {
      const count = GameState.unreadJournalCount;
      this.dom.folioBadge.innerText = `${count}`;
      this.dom.folioBadge.classList.toggle('hidden', count === 0);
    }
    // Deduction badge
    Tableau.updateBadgesAndCounters();
  }

  private updateVigilanceUI() {
    const state = GameState.getVigilanceState();
    const stateLower = state.toLowerCase();

    // 1. Flame animation
    this.dom.vigilanceFlame.className = `candle-flame ${stateLower}`;

    // 2. Text label
    const textCapitalized = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
    this.dom.vigilanceText.innerText = `Vigilance: ${textCapitalized}`;

    // 3. Widget container border/glow
    this.dom.vigilanceWidget.className = `vigilance-candle-widget state-${stateLower}`;

    // 4. Heartbeat sound on DANGER
    if (state === 'DANGER') {
      AudioEngine.setHeartbeatActive(true);
      AudioEngine.triggerCaption("✦ [Danger: Purochana's vigilance peaks! Heavy heartbeat sound]");
    } else {
      AudioEngine.setHeartbeatActive(false);
    }

    this.updateVigilancePopoverUI();
  }

  private updateVigilancePopoverUI() {
    const state = GameState.getVigilanceState();
    if (this.dom.vigilancePopoverStatus) {
      this.dom.vigilancePopoverStatus.innerText = `VIGILANCE: ${state}`;
    }
    if (this.dom.vigilancePopoverDesc) {
      this.dom.vigilancePopoverDesc.innerText = GameState.vigilanceReason;
    }
  }

  private toggleSoundMute() {
    const isMuted = AudioEngine.toggleMute();
    this.updateSoundIconUI(isMuted);
    AudioEngine.triggerCaption(isMuted ? "✦ [Audio Muted]" : "✦ [Audio Active]");
  }

  private updateSoundIconUI(isMuted: boolean) {
    if (this.dom.muteSlashLine) {
      this.dom.muteSlashLine.classList.toggle('hidden', !isMuted);
    }
    const waves = document.querySelectorAll('.sound-wave');
    waves.forEach((w) => {
      (w as HTMLElement).style.opacity = isMuted ? '0' : '1';
    });
    if (this.dom.panelMuteLabel) {
      this.dom.panelMuteLabel.innerText = isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE';
    }
    if (this.dom.panelSoundIcon) {
      this.dom.panelSoundIcon.innerText = isMuted ? '🔇' : '🔊';
    }
    if (this.dom.btnToggleMutePanel) {
      this.dom.btnToggleMutePanel.classList.toggle('is-muted', isMuted);
    }
  }

  private syncAudioPopoverSliders() {
    const buses: Array<'master' | 'music' | 'ambient' | 'sfx' | 'voice'> = [
      'master', 'music', 'ambient', 'sfx', 'voice'
    ];
    buses.forEach((bus) => {
      const slider = this.dom[`slider${bus.charAt(0).toUpperCase() + bus.slice(1)}` as keyof typeof this.dom] as HTMLInputElement;
      const valEl = this.dom[`val${bus.charAt(0).toUpperCase() + bus.slice(1)}` as keyof typeof this.dom] as HTMLElement;
      if (slider && valEl) {
        const pct = Math.round(AudioEngine.volumes[bus] * 100);
        slider.value = `${pct}`;
        valEl.innerText = `${pct}%`;
      }
    });
    if (this.dom.toggleAudioCaptions) {
      this.dom.toggleAudioCaptions.checked = AudioEngine.captionsEnabled;
    }
    this.updateSoundIconUI(AudioEngine.isMuted);
  }

  private isTypingInInput(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }

  private bindEvents() {
    // 1. Manhwa Nav Controls (Unified Single State Machine)
    this.dom.btnManhwaNext.addEventListener('click', () => {
      this.advanceToNextPanel();
    });

    this.dom.btnManhwaPrev.addEventListener('click', () => {
      this.goToPreviousPanel();
    });

    this.dom.btnSkipManhwa.addEventListener('click', () => {
      this.transitionToGateRoom();
    });

    const btnManhwaRoom2 = document.getElementById('btn-manhwa-room2');
    btnManhwaRoom2?.addEventListener('click', () => {
      this.openRoom2ManhwaIntro();
    });

    this.dom.btnEnterGateRoom?.addEventListener('click', () => {
      this.transitionToGateRoom();
    });

    this.dom.btnReplayManhwa?.addEventListener('click', () => {
      UIStore.closePanel();
      this.replayManhwaIntro();
    });

    this.dom.btnReplayManhwaRoom2?.addEventListener('click', () => {
      UIStore.closePanel();
      this.openRoom2ManhwaIntro();
    });

    // Make individual Room 1 panels interactive on click
    this.dom.manhwaPanels.forEach((panel, idx) => {
      panel.addEventListener('click', () => {
        if (this.currentScene === 'MANHWA') {
          this.goToPanel(idx);
        }
      });
    });

    // Room 2 Manhwa Navigation Events
    this.dom.btnSkipManhwaRoom2?.addEventListener('click', () => {
      this.transitionToGrandChamber(false);
    });

    this.dom.btnEnterRoom2FromManhwa?.addEventListener('click', () => {
      this.transitionToGrandChamber(false);
    });

    this.dom.btnManhwaNextRoom2?.addEventListener('click', () => {
      this.advanceToNextRoom2Panel();
    });

    this.dom.btnManhwaPrevRoom2?.addEventListener('click', () => {
      this.goToPreviousRoom2Panel();
    });

    this.dom.manhwaPanelsRoom2.forEach((panel, idx) => {
      panel.addEventListener('click', () => {
        if (this.currentScene === 'MANHWA_ROOM2') {
          this.goToRoom2Panel(idx);
        }
      });
    });

    // 2. Keyboard Navigation for Manhwa, Panels & Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (UIStore.getActivePanel() !== 'none') {
          UIStore.closePanel();
          return;
        }
        if (!this.dom.hintModal.classList.contains('hidden')) {
          this.dom.hintModal.classList.add('hidden');
          return;
        }
        if (!this.dom.closeupModal.classList.contains('hidden')) {
          this.dom.closeupModal.classList.add('hidden');
          this.currentCloseUpObject = null;
          GameState.coolSuspicion(6);
          return;
        }
      }

      if (this.isTypingInInput(e)) return;

      if (UIStore.getActivePanel() === 'journal') {
        if (['ArrowRight', 'PageDown'].includes(e.key)) {
          e.preventDefault();
          Folio.nextPage();
          return;
        } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
          e.preventDefault();
          Folio.prevPage();
          return;
        }
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        UIStore.togglePanel('journal');
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        UIStore.togglePanel('deduction');
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.toggleSoundMute();
        return;
      }

      if (this.currentScene === 'MANHWA') {
        if (['ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown'].includes(e.key)) {
          e.preventDefault();
          this.advanceToNextPanel();
        } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
          e.preventDefault();
          this.goToPreviousPanel();
        }
      } else if (this.currentScene === 'MANHWA_ROOM2') {
        if (['ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown'].includes(e.key)) {
          e.preventDefault();
          this.advanceToNextRoom2Panel();
        } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
          e.preventDefault();
          this.goToPreviousRoom2Panel();
        }
      }
    });

    // Mouse Wheel Navigation (Throttled for clean panel-by-panel stepping)
    window.addEventListener('wheel', (e) => {
      if (this.currentScene === 'MANHWA') {
        if (this.isWheelThrottled) return;
        if (Math.abs(e.deltaY) > 25) {
          this.isWheelThrottled = true;
          if (e.deltaY > 0) {
            this.advanceToNextPanel();
          } else {
            this.goToPreviousPanel();
          }
          setTimeout(() => {
            this.isWheelThrottled = false;
          }, 380);
        }
      } else if (this.currentScene === 'MANHWA_ROOM2') {
        if (this.isWheelThrottled) return;
        if (Math.abs(e.deltaY) > 25) {
          this.isWheelThrottled = true;
          if (e.deltaY > 0) {
            this.advanceToNextRoom2Panel();
          } else {
            this.goToPreviousRoom2Panel();
          }
          setTimeout(() => {
            this.isWheelThrottled = false;
          }, 380);
        }
      }
    }, { passive: false });

    // Touch Swipe Navigation for Manhwa
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.currentScene === 'MANHWA' && e.changedTouches.length > 0) {
        const diff = e.changedTouches[0].clientY - touchStartY;
        if (diff < -45) {
          this.advanceToNextPanel();
        } else if (diff > 45) {
          this.goToPreviousPanel();
        }
      } else if (this.currentScene === 'MANHWA_ROOM2' && e.changedTouches.length > 0) {
        const diff = e.changedTouches[0].clientY - touchStartY;
        if (diff < -45) {
          this.advanceToNextRoom2Panel();
        } else if (diff > 45) {
          this.goToPreviousRoom2Panel();
        }
      }
    }, { passive: true });

    // Enter Story (if prompt was clicked)
    this.dom.btnEnterStory?.addEventListener('click', () => {
      AudioEngine.init();
      this.dom.audioPrompt.classList.add('faded');
      setTimeout(() => this.dom.audioPrompt.classList.add('hidden'), 900);
      this.goToPanel(0, false);
    });

    // Skip Cinematic Button
    this.dom.btnSkipCinematic.addEventListener('click', () => {
      this.skipRoomEntranceCinematic();
    });

    // 3. Top-Right HUD Controls Wired to UIStore
    this.dom.vigilanceWidget.addEventListener('click', () => {
      UIStore.togglePanel('vigilance');
    });
    this.dom.vigilanceWidget.addEventListener('mouseenter', () => {
      this.dom.vigilanceWidget.title = `${GameState.vigilanceReason} (Click for details)`;
    });

    this.dom.btnSound.addEventListener('click', () => {
      UIStore.togglePanel('audio');
    });

    this.dom.btnFolio.addEventListener('click', () => {
      UIStore.togglePanel('journal');
    });

    this.dom.btnDeduction.addEventListener('click', () => {
      UIStore.togglePanel('deduction');
    });

    this.dom.hudDimBackdrop.addEventListener('click', () => {
      UIStore.closePanel();
    });

    this.dom.btnCloseSound.addEventListener('click', () => {
      UIStore.closePanel();
    });

    this.dom.btnCloseFolio.addEventListener('click', () => {
      UIStore.closePanel();
    });

    this.dom.folioBookBackdrop?.addEventListener('click', () => {
      UIStore.closePanel();
    });

    this.dom.btnCloseDeduction.addEventListener('click', () => {
      UIStore.closePanel();
    });

    this.dom.deductionBackdrop?.addEventListener('click', () => {
      UIStore.closePanel();
    });

    // Sound Popover Mute Toggle & Sliders
    this.dom.btnToggleMutePanel.addEventListener('click', () => {
      this.toggleSoundMute();
    });

    const buses: Array<'master' | 'music' | 'ambient' | 'sfx' | 'voice'> = [
      'master', 'music', 'ambient', 'sfx', 'voice'
    ];
    buses.forEach((bus) => {
      const slider = this.dom[`slider${bus.charAt(0).toUpperCase() + bus.slice(1)}` as keyof typeof this.dom] as HTMLInputElement;
      const valEl = this.dom[`val${bus.charAt(0).toUpperCase() + bus.slice(1)}` as keyof typeof this.dom] as HTMLElement;
      if (slider && valEl) {
        slider.addEventListener('input', () => {
          const num = parseInt(slider.value, 10);
          AudioEngine.setBusVolume(bus, num / 100);
          valEl.innerText = `${num}%`;
        });
      }
    });

    this.dom.toggleAudioCaptions.addEventListener('change', () => {
      AudioEngine.setCaptionsEnabled(this.dom.toggleAudioCaptions.checked);
    });

    // Camera Pan Controls: If in MANHWA mode, navigate panels; in GATE_ROOM, pan camera
    this.dom.btnPanLeft.addEventListener('click', () => {
      if (this.currentScene === 'MANHWA') {
        this.goToPreviousPanel();
      } else {
        WorldEngine.panCamera(-1);
        AudioEngine.playFootstep(-0.4);
      }
    });
    this.dom.btnPanRight.addEventListener('click', () => {
      if (this.currentScene === 'MANHWA') {
        this.advanceToNextPanel();
      } else {
        WorldEngine.panCamera(1);
        AudioEngine.playFootstep(0.4);
      }
    });

    // Drishti Sight Toggle
    this.dom.btnDrishti.addEventListener('click', () => {
      this.toggleDrishtiSight();
    });

    // Satchel (Inventory) Drawer Toggle
    this.dom.btnSatchel.addEventListener('click', () => {
      this.toggleSatchel();
    });

    // Close-Up: Step Back Button
    this.dom.btnCloseCloseup.addEventListener('click', () => {
      AudioEngine.playFootstep();
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
      GameState.coolSuspicion(6);
    });

    // Close-Up: Shortcut to Inspect Rosetta Key (Merchant Tally Stone)
    this.dom.btnInspectTallyShortcut.addEventListener('click', () => {
      this.openTallyStoneCloseUp();
    });

    // Hint Candle: Open 4-Tier Hint Panel
    this.dom.btnHintCandle.addEventListener('click', () => {
      if (this.currentRoomId === 2) {
        this.updateRoom2HintUI();
      } else {
        if (this.difficultyMode === 'SCHOLAR' && this.failedCrateAttempts < 2) {
          AudioEngine.triggerCaption(`✦ Scholar Mode: Insight withheld until the 2nd failed attempt (${this.failedCrateAttempts}/2)`);
          this.dom.closeupWhisperText.innerText = `Scholar Mode: No hints permitted before the 2nd failed attempt. (Failed attempts: ${this.failedCrateAttempts}/2)`;
          return;
        }
        this.updateRoom1HintUI();
      }
      AudioEngine.playTempleBell(523.25);
      this.dom.hintModal.classList.remove('hidden');
    });

    // Close Hint Panel
    this.dom.btnCloseHint.addEventListener('click', () => {
      this.dom.hintModal.classList.add('hidden');
    });

    // Hint Tier 2: Highlight Target
    this.dom.btnHighlightTally.addEventListener('click', () => {
      this.dom.hintModal.classList.add('hidden');
      this.dom.closeupModal.classList.add('hidden');
      if (this.currentRoomId === 2) {
        this.highlightSceneHotspot('plan_table');
      } else {
        this.highlightSceneHotspot('tally_stone');
      }
    });

    // Hint Tier 4: Show Me Walkthrough (Give-up mode)
    this.dom.btnTriggerShowMe.addEventListener('click', () => {
      if (this.currentRoomId === 2) {
        this.triggerRoom2ShowMeWalkthrough();
      } else {
        this.triggerShowMeWalkthrough();
      }
    });

    // Next Room / Approach Lakshagriha (Opens Room 2 Manhwa Webtoon Story)
    this.dom.btnNextRoom.addEventListener('click', () => {
      this.openRoom2ManhwaIntro();
    });

    this.dom.btnCinematicContinue?.addEventListener('click', () => {
      this.dom.cinematicModal.classList.add('hidden');
      if (this.currentRoomId === 1) {
        this.openRoom2ManhwaIntro();
      } else {
        this.transitionToGrandChamber(false);
      }
    });

    // Room Switcher Tabs
    this.dom.btnTabRoom1?.addEventListener('click', () => {
      if (this.currentRoomId !== 1) {
        this.transitionToGateRoom(true);
      }
    });

    this.dom.btnTabRoom2?.addEventListener('click', () => {
      if (this.currentRoomId !== 2) {
        if (!this.room2Revisited) {
          this.openRoom2ManhwaIntro();
        } else {
          this.transitionToGrandChamber(true);
        }
      }
    });
  }

  // =========================================================================
  // MANHWA READER ENGINE (8-Panel Sequence Navigation & Story Beats)
  // =========================================================================
  public goToPanel(index: number, smooth: boolean = true) {
    if (this.currentScene !== 'MANHWA') return;
    this.currentPanelIndex = Math.max(0, Math.min(this.TOTAL_MANHWA_PANELS - 1, index));

    // Update panel counter
    if (this.dom.manhwaPanelCounter) {
      this.dom.manhwaPanelCounter.innerText = `PANEL ${this.currentPanelIndex + 1} / ${this.TOTAL_MANHWA_PANELS}`;
    }

    // Update Disabled State on Prev/Next
    const isFirst = this.currentPanelIndex === 0;
    const isLast = this.currentPanelIndex === this.TOTAL_MANHWA_PANELS - 1;

    if (this.dom.btnManhwaPrev) {
      this.dom.btnManhwaPrev.disabled = isFirst;
      this.dom.btnManhwaPrev.classList.toggle('disabled', isFirst);
    }

    if (this.dom.btnManhwaNext) {
      this.dom.btnManhwaNext.title = isLast ? 'Enter Festival Gates (Room 2)' : 'Next Panel (→, ↓, or Space)';
      if (isLast) {
        this.dom.btnManhwaNext.innerHTML = '<span>➔</span>';
      } else {
        this.dom.btnManhwaNext.innerHTML = '<span>›</span>';
      }
    }

    // Toggle active panel classes
    this.dom.manhwaPanels.forEach((panel, i) => {
      if (i === this.currentPanelIndex) {
        panel.classList.add('active-panel');
        // Ken Burns and layered parallax push-in
        const img = panel.querySelector('.manhwa-art') as HTMLElement;
        if (img) {
          gsap.fromTo(img, { scale: 1.0 }, { scale: 1.035, duration: 3.5, ease: 'power1.out' });
        }
        // Scroll target into view
        panel.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
      } else {
        panel.classList.remove('active-panel');
      }
    });

    AudioEngine.playFootstep();
  }

  public advanceToNextPanel() {
    AudioEngine.init();
    if (this.currentScene !== 'MANHWA') return;
    if (this.currentPanelIndex < this.TOTAL_MANHWA_PANELS - 1) {
      this.goToPanel(this.currentPanelIndex + 1);
    } else {
      this.transitionToGateRoom();
    }
  }

  public goToPreviousPanel() {
    AudioEngine.init();
    if (this.currentScene !== 'MANHWA') return;
    if (this.currentPanelIndex > 0) {
      this.goToPanel(this.currentPanelIndex - 1);
    }
  }

  public transitionToGateRoom(revisit: boolean = false) {
    AudioEngine.init();
    this.currentRoomId = 1;
    this.stopRoom2Routine();
    this.stopRoom2IdleBarks();

    if (this.dom.btnTabRoom1) this.dom.btnTabRoom1.classList.add('active');
    if (this.dom.btnTabRoom2) this.dom.btnTabRoom2.classList.remove('active');
    this.dom.actTag.innerText = "ACT I: BEAUTY & CELEBRATION";
    this.dom.chapterTitle.innerText = "Varanavata: The Deceptive Welcome";

    WorldEngine.setRoomScene(1);
    const backdrop = document.getElementById('room-backdrop-layer');
    if (backdrop) backdrop.className = 'room-backdrop-layer room1-gates';

    if (revisit || this.currentScene === 'GATE_ROOM') {
      this.currentScene = 'GATE_ROOM';
      this.dom.viewportStage.classList.remove('hidden');
      this.dom.manhwaContainer.classList.add('hidden');
      this.dom.manhwaContainerRoom2.classList.add('hidden');
      this.renderVaranavataScene();
      this.dom.ambientTickerText.innerText = "You return to the bustling festival gates. The Ganga breeze rustles the awnings.";
      return;
    }

    this.currentScene = 'GATE_ROOM';
    // Push into gate room
    gsap.to(this.dom.manhwaContainer, {
      opacity: 0,
      scale: 1.04,
      duration: 0.65,
      ease: 'power2.inOut',
      onComplete: () => {
        this.dom.manhwaContainer.classList.add('hidden');
        this.dom.manhwaContainerRoom2.classList.add('hidden');
        this.dom.viewportStage.classList.remove('hidden');
        gsap.fromTo(this.dom.viewportStage, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        this.startRoomEntranceCinematic();
      }
    });
  }

  public replayManhwaIntro() {
    AudioEngine.init();
    this.currentScene = 'MANHWA';
    this.dom.folioDrawer.classList.add('hidden');
    this.dom.closeupModal.classList.add('hidden');
    this.dom.hintModal.classList.add('hidden');
    this.dom.viewportStage.classList.add('hidden');
    this.dom.manhwaContainer.classList.remove('hidden');
    this.dom.manhwaContainer.style.opacity = '1';
    this.dom.manhwaContainer.style.transform = 'scale(1)';
    this.goToPanel(0, false);
  }

  // =========================================================================
  // ROOM 2 MANHWA READER ENGINE (The Golden Trap of Lakshagriha)
  // =========================================================================
  public openRoom2ManhwaIntro() {
    AudioEngine.init();
    AudioEngine.playDiscoveryChime();
    this.currentScene = 'MANHWA_ROOM2';

    // Close any active overlays
    UIStore.closePanel();
    this.dom.folioDrawer.classList.add('hidden');
    this.dom.closeupModal.classList.add('hidden');
    this.dom.hintModal.classList.add('hidden');
    this.dom.cinematicModal.classList.add('hidden');
    this.dom.viewportStage.classList.add('hidden');
    this.dom.manhwaContainer.classList.add('hidden');

    // Show Room 2 Manhwa Container
    this.dom.manhwaContainerRoom2.classList.remove('hidden');
    this.dom.manhwaContainerRoom2.style.opacity = '1';
    this.dom.manhwaContainerRoom2.style.transform = 'scale(1)';

    this.goToRoom2Panel(0, false);
    this.dom.ambientTickerText.innerText = "✦ The Pandavas ascend to the promontory. Lakshagriha looms against the twilight.";
  }

  public goToRoom2Panel(index: number, smooth: boolean = true) {
    if (this.currentScene !== 'MANHWA_ROOM2') return;
    this.currentRoom2PanelIndex = Math.max(0, Math.min(this.TOTAL_ROOM2_MANHWA_PANELS - 1, index));

    // Update panel counter
    if (this.dom.manhwaPanelCounterRoom2) {
      this.dom.manhwaPanelCounterRoom2.innerText = `PANEL ${this.currentRoom2PanelIndex + 1} / ${this.TOTAL_ROOM2_MANHWA_PANELS}`;
    }

    // Update Disabled State on Prev/Next
    const isFirst = this.currentRoom2PanelIndex === 0;
    const isLast = this.currentRoom2PanelIndex === this.TOTAL_ROOM2_MANHWA_PANELS - 1;

    if (this.dom.btnManhwaPrevRoom2) {
      this.dom.btnManhwaPrevRoom2.disabled = isFirst;
      this.dom.btnManhwaPrevRoom2.classList.toggle('disabled', isFirst);
    }

    if (this.dom.btnManhwaNextRoom2) {
      this.dom.btnManhwaNextRoom2.title = isLast ? 'Enter Grand Chamber (Room 2)' : 'Next Panel (→, ↓, or Space)';
      if (isLast) {
        this.dom.btnManhwaNextRoom2.innerHTML = '<span>➔</span>';
      } else {
        this.dom.btnManhwaNextRoom2.innerHTML = '<span>›</span>';
      }
    }

    // Toggle active panel classes
    this.dom.manhwaPanelsRoom2.forEach((panel, i) => {
      if (i === this.currentRoom2PanelIndex) {
        panel.classList.add('active-panel');
        // Ken Burns and layered parallax push-in
        const img = panel.querySelector('.manhwa-art') as HTMLElement;
        if (img) {
          gsap.fromTo(img, { scale: 1.0 }, { scale: 1.035, duration: 3.5, ease: 'power1.out' });
        }
        panel.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
      } else {
        panel.classList.remove('active-panel');
      }
    });

    AudioEngine.playFootstep();
  }

  public advanceToNextRoom2Panel() {
    AudioEngine.init();
    if (this.currentScene !== 'MANHWA_ROOM2') return;
    if (this.currentRoom2PanelIndex < this.TOTAL_ROOM2_MANHWA_PANELS - 1) {
      this.goToRoom2Panel(this.currentRoom2PanelIndex + 1);
    } else {
      this.transitionToGrandChamber(false);
    }
  }

  public goToPreviousRoom2Panel() {
    AudioEngine.init();
    if (this.currentScene !== 'MANHWA_ROOM2') return;
    if (this.currentRoom2PanelIndex > 0) {
      this.goToRoom2Panel(this.currentRoom2PanelIndex - 1);
    }
  }

  // =========================================================================
  // ROOM 1 ENTRANCE CINEMATIC (5-10s, skippable)
  // =========================================================================
  private startRoomEntranceCinematic() {
    this.dom.btnSkipCinematic.classList.remove('hidden');
    this.dom.ambientTickerText.innerText = "Conch horns echo across the sacred waters. Saffron dust swirls on a river breeze.";

    WorldEngine.playEntranceCinematic(() => {
      this.finishEntranceCinematic();
    });
  }

  private skipRoomEntranceCinematic() {
    if (this.currentRoomId === 2) {
      WorldEngine.skipRoom2EntranceCinematic();
      this.finishRoom2EntranceCinematic();
    } else {
      WorldEngine.skipEntranceCinematic();
      this.finishEntranceCinematic();
    }
  }

  private finishEntranceCinematic() {
    this.dom.btnSkipCinematic.classList.add('hidden');
    this.triggerArrivalBanner();
    this.dom.ambientTickerText.innerText = "Golden hour sunbeams warm the river stones. A merchant cart creaks in the distance.";
  }

  private triggerArrivalBanner() {
    if (this.currentRoomId === 2) {
      if (this.dom.arrivalLocation) this.dom.arrivalLocation.innerText = "GRAND AUDIENCE HALL OF LAKSHAGRIHA";
      if (this.dom.arrivalSub) this.dom.arrivalSub.innerText = "Cedar, gold and silk. Everything shines like it was made yesterday.";
    } else {
      if (this.dom.arrivalLocation) this.dom.arrivalLocation.innerText = "GATES OF VARANAVATA";
      if (this.dom.arrivalSub) this.dom.arrivalSub.innerText = "Bells chime on the northern Ganga; marigolds veil the architect’s gaze.";
    }
    this.dom.arrivalBanner.classList.add('visible');
    setTimeout(() => {
      this.dom.arrivalBanner.classList.remove('visible');
    }, 5500);
  }

  // =========================================================================
  // LIVING SCENE SETUP (VARANAVATA VERTICAL SLICE)
  // =========================================================================
  private renderVaranavataScene() {
    this.dom.interactiveScene.innerHTML = '';

    // 1. The Convoy (9 Wagons: 4 lac wagons weeping amber, 1 honey cart red herring, 4 festival carts)
    this.createSceneActor({
      id: 'convoy',
      name: 'Arrival Convoy (9 Wagons)',
      role: 'Royal & Festival Wagons',
      portrait: '/assets/closeup_crate.jpg',
      x: 12,
      y: 55,
      onClick: () => {
        this.openConvoyCloseUp();
      }
    });

    // 2. Queen Mother Kunti (Near floral offerings)
    this.createSceneActor({
      id: 'kunti',
      name: 'Queen Kunti',
      role: 'Mother of the Pandavas',
      portrait: '/assets/char_kunti.jpg',
      x: 25,
      y: 65,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Queen Kunti', actor.portrait, 
          "Yudhishthira, observe the carts behind the temple gate. The drivers carry private seals. Four heavy freight wagons weep dark amber resin with official lac guild stamps, while five carry festival offerings."
        );
      }
    });

    // 3. Vidura's Disguised Ascetic Envoy (Center-Left)
    this.createSceneActor({
      id: 'envoy',
      name: 'Wandering Ascetic',
      role: "Vidura's Secret Envoy",
      portrait: '/assets/closeup_copper_disc.jpg',
      x: 38,
      y: 68,
      onClick: (actor) => {
        if (!this.hasItem('item_copper_disc')) {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Vidura’s Envoy', actor.portrait,
            "'The disc keeps count of nights. Ask it what remains.' Take this talisman!"
          );
          
          // Animate Item Pickup into Satchel!
          this.animateItemPickup({
            id: 'item_copper_disc',
            name: "Vidura's Copper Moon Disc",
            icon: '🔘',
            type: 'CIPHER TALISMAN',
            desc: "Vidura's heavy bronze-copper disc. A celestial ring of 9 moons: 6 carved lit, and 3 dark hollows remaining. 'The disc keeps count of nights. Ask it what remains.'",
            imageSrc: '/assets/closeup_copper_disc.jpg',
          }, actor.x, actor.y);

        } else {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Vidura’s Envoy', actor.portrait,
            "'The disc keeps count of nights. Ask it what remains.'"
          );
        }
      }
    });

    // 4. Town Surveyor's Folio (Architectural Ground Plan with 7 doors)
    this.createSceneActor({
      id: 'surveyor_folio',
      name: "Town Surveyor's Folio",
      role: 'Architectural Blueprint (7 Doors)',
      portrait: '/assets/closeup_tally_board.jpg',
      x: 50,
      y: 76,
      onClick: () => {
        this.openSurveyorFolioCloseUp();
      }
    });

    // 5. The Merchant's Tally Stone (Rosetta Key, Ground near Crate)
    this.createSceneActor({
      id: 'tally_stone',
      name: "Merchant's Tally Stone",
      role: 'Rosetta Key',
      portrait: '/assets/closeup_tally_board.jpg',
      x: 62,
      y: 76,
      onClick: () => {
        this.openTallyStoneCloseUp();
      }
    });

    // 6. The Heavy Timber Lac Crate (Center-Right)
    this.createSceneActor({
      id: 'cargo_crate',
      name: 'Reinforced Cargo Crate',
      role: 'Royal Cargo',
      portrait: '/assets/closeup_crate.jpg',
      x: 74,
      y: 70,
      onClick: () => {
        this.openCrateCloseUp();
      }
    });

    // 7. Purochana (Right Side, near gate archway)
    this.createSceneActor({
      id: 'purochana',
      name: 'Purochana',
      role: 'Royal Steward & Architect',
      portrait: '/assets/char_purochana.jpg',
      x: 86,
      y: 56,
      onClick: (actor) => {
        if (GameState.getVigilanceState() === 'DANGER') {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "Why do you linger suspiciously near our supply wagons, Pandava? The palace awaits. The guards grow wary."
          );
          AudioEngine.triggerCaption("✦ [Purochana watches you with acute suspicion]");
          return;
        }

        if (this.isCrateUnlocked) {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "Noble Yudhishthira! The palanquin is ready. Shall we proceed into the house before the twilight puja?"
          );
          this.openDecisionPrompt();
        } else {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "Welcome, princes of the Kurus! By King Dhritarashtra's command, I have built a house of five doors — a celestial haven of cedar and gold consecrated for your rest on the promontory!"
          );
        }
      }
    });
  }

  private createSceneActor(config: {
    id: string;
    name: string;
    role: string;
    portrait: string;
    x: number;
    y: number;
    onClick: (actor: any) => void;
  }) {
    const el = document.createElement('div');
    el.className = 'scene-interactive-object';
    el.id = `actor-${config.id}`;
    el.dataset.id = config.id;
    el.style.left = `${config.x}%`;
    el.style.top = `${config.y}%`;

    el.innerHTML = `
      <div class="actor-card-manhwa">
        <div class="actor-avatar-ring">
          <img src="${config.portrait}" alt="${config.name}" class="actor-avatar-img">
        </div>
        <div class="actor-nametag">
          <span class="actor-name">${config.name}</span>
          <span class="actor-role">${config.role}</span>
        </div>
      </div>
      <div class="object-subtle-indicator"></div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      config.onClick(config);
    });

    this.dom.interactiveScene.appendChild(el);
  }

  private highlightSceneHotspot(id: string) {
    const el = document.getElementById(`actor-${id}`);
    if (el) {
      gsap.fromTo(el, { scale: 1 }, { scale: 1.25, duration: 0.35, yoyo: true, repeat: 3, ease: 'power2.out' });
      this.dom.ambientTickerText.innerText = "❖ The merchant's tally stone catches the amber rays of the sun...";
    }
  }

  private showSpeechBubble(x: number, y: number, speaker: string, portraitSrc: string, text: string) {
    AudioEngine.playFootstep();
    this.dom.speechBubbleContainer.innerHTML = '';

    const bubble = document.createElement('div');
    bubble.className = 'anchored-speech-bubble';
    bubble.style.left = `${Math.max(16, Math.min(84, x))}%`;
    bubble.style.top = `${Math.max(12, y)}%`;

    bubble.innerHTML = `
      <div class="bubble-portrait">
        <img src="${portraitSrc}" alt="${speaker}">
      </div>
      <div class="bubble-content">
        <span class="bubble-speaker">${speaker}</span>
        <p class="bubble-dialogue">"${text}"</p>
      </div>
    `;

    this.dom.speechBubbleContainer.appendChild(bubble);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      bubble.style.opacity = '0';
      setTimeout(() => bubble.remove(), 400);
    }, 6000);
  }

  // =========================================================================
  // ANIMATED ITEM PICKUP (Lifts, Rotates, Flies to Satchel)
  // =========================================================================
  private animateItemPickup(item: InventoryItem, startXPercent: number, startYPercent: number) {
    AudioEngine.playDiscoveryChime();

    // Create flying item element
    const flyer = document.createElement('div');
    flyer.style.position = 'fixed';
    flyer.style.left = `${startXPercent}vw`;
    flyer.style.top = `${startYPercent}vh`;
    flyer.style.width = '70px';
    flyer.style.height = '70px';
    flyer.style.borderRadius = '50%';
    flyer.style.border = '2px solid #d4af37';
    flyer.style.background = `url('${item.imageSrc}') center/cover`;
    flyer.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.8), 0 10px 25px rgba(0,0,0,0.6)';
    flyer.style.zIndex = '9000';
    flyer.style.pointerEvents = 'none';
    document.body.appendChild(flyer);

    // Satchel button target coords
    const satchelRect = this.dom.btnSatchel.getBoundingClientRect();
    const targetX = satchelRect.left + satchelRect.width / 2 - 35;
    const targetY = satchelRect.top + satchelRect.height / 2 - 35;

    // GSAP 3-Stage Cinematic Animation:
    // 1. Lift and scale into light
    // 2. Rotate 360 degrees
    // 3. Swoop with spring into satchel
    gsap.timeline()
      .to(flyer, {
        scale: 1.4,
        y: -40,
        duration: 0.6,
        ease: 'power2.out',
      })
      .to(flyer, {
        rotation: 360,
        duration: 0.5,
        ease: 'power1.inOut',
      })
      .to(flyer, {
        left: targetX,
        top: targetY,
        scale: 0.35,
        opacity: 0.8,
        duration: 0.7,
        ease: 'power3.in',
        onComplete: () => {
          flyer.remove();
          this.addToSatchel(item);
          // Pop satchel button
          gsap.fromTo(this.dom.btnSatchel, { scale: 1.25 }, { scale: 1.0, duration: 0.3, ease: 'bounce.out' });
        }
      });
  }

  // =========================================================================
  // FULL-SCREEN IN-WORLD CLOSE-UP: CARGO CRATE & 3-DIAL LOCK
  // =========================================================================
  private openCrateCloseUp() {
    if (GameState.getVigilanceState() === 'DANGER') {
      AudioEngine.playWallTap(false);
      this.showSpeechBubble(64, 59, 'Purochana’s Steward', '/assets/char_purochana.jpg',
        "Halt! Royal provisions are sealed under the architect's royal mark. Step away from the wagons!"
      );
      AudioEngine.triggerCaption("✦ [Interaction locked: Vigilance at Danger!]");
      return;
    }

    // Inspecting cargo wagons raises vigilance
    GameState.setSuspicion(15, "Purochana noticed you inspecting the cargo wagons. His smile is strained.");

    this.currentCloseUpObject = 'crate';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/closeup_crate.jpg';
    this.dom.closeupObjectLabel.innerText = 'ROYAL CONVOY CARGO';
    this.dom.btnInspectTallyShortcut.classList.remove('hidden');

    if (this.isCrateUnlocked) {
      this.dom.closeupWhisperText.innerText = "The heavy brass cylinder lock hangs open. Fragrant cedar shavings and raw amber lac resin lie exposed.";
      this.dom.closeupInteractiveLayer.innerHTML = `
        <div class="crate-unlocked-tray">
          <div class="oily-fragrance-wisp"></div>
          <div style="font-size:2.4rem; margin-bottom:4px;">📦</div>
          <h3>UNSEALED CARGO CHEST</h3>
          <div class="amber-cedar-visual">
            <div class="amber-resin-lump">🔶</div>
            <div class="amber-cedar-desc">
              <h4>AMBER BLOCKS PACKED IN CEDAR</h4>
              <p>Smelling heavily of clarified cow ghee & flammable tree lac. Packed beneath aromatic cedar shavings to conceal the incendiary payload.</p>
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.35); border-left: 3px solid #d4af37; padding: 10px 14px; text-align: left; margin-bottom: 14px; border-radius: 0 8px 8px 0;">
            <span style="font-family: var(--font-regal); font-size: 0.7rem; color: #ffd700; font-weight: 700; letter-spacing: 1px;">CONFISCATED ROYAL DISPATCH</span>
            <p style="font-family: var(--font-narrative); color: #f2e9d8; font-size: 1.05rem; line-height: 1.4; margin: 4px 0 0; font-style: italic;">
              "To Purochana: The lac supply from eastern hill guilds has arrived. Line the interior cavity partitions before the Pandavas' arrival. Duryodhana."
            </p>
          </div>
          <button id="btn-collect-dispatch" class="btn-read-dispatch">KEEP DISPATCH & RECORD EVIDENCE</button>
        </div>
      `;

      document.getElementById('btn-collect-dispatch')?.addEventListener('click', () => {
        this.dom.closeupModal.classList.add('hidden');
        this.dom.btnNextRoom.classList.remove('hidden');
        this.dom.ambientTickerText.innerText = "✦ Dispatch gathered. The pathway to Lakshagriha's threshold is clear.";
      });
    } else {
      this.dom.closeupWhisperText.innerText = "Three heavy brass tumblers secure the latch. Dark amber resin oozes from the lower joinery.";
      this.renderCrateLockMechanism();
    }

    this.dom.closeupModal.classList.remove('hidden');
  }

  private renderCrateLockMechanism() {
    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="crate-tactile-lock">
        <!-- Live Carved Wood Inscription Lid (Builder's Voice) -->
        <div class="crate-carved-lid">
          <div class="lid-carved-header">
            <span>❖ CARVED WOOD INSCRIPTION · BUILDER'S HAND ❖</span>
          </div>
          <div class="lid-carved-lines">
            <div class="lid-carved-line" data-line="1">
              <span class="line-num">I.</span>
              <span class="line-text">"Count the wagons that weep amber."</span>
            </div>
            <div class="lid-carved-line" data-line="2">
              <span class="line-num">II.</span>
              <span class="line-text">"The surveyor drew more doors than the builder swore. How many more?"</span>
            </div>
            <div class="lid-carved-line" data-line="3">
              <span class="line-num">III.</span>
              <span class="line-text">"The messenger's gift counts nights. How many moons are still dark?"</span>
            </div>
          </div>
        </div>

        <!-- Difficulty Mode Selector -->
        <div class="crate-difficulty-bar">
          <span class="difficulty-label">DIFFICULTY</span>
          <div class="difficulty-options">
            <button class="btn-diff-mode ${this.difficultyMode === 'STORY' ? 'active' : ''}" data-mode="STORY">STORY</button>
            <button class="btn-diff-mode ${this.difficultyMode === 'STANDARD' ? 'active' : ''}" data-mode="STANDARD">STANDARD</button>
            <button class="btn-diff-mode ${this.difficultyMode === 'SCHOLAR' ? 'active' : ''}" data-mode="SCHOLAR">SCHOLAR</button>
          </div>
        </div>

        <!-- Brass Tumbler Dials -->
        <div class="lock-dials-container">
          ${[0, 1, 2].map(idx => {
            const curVal = this.lockDials[idx];
            const prevVal = (curVal - 1 + 10) % 10;
            const nextVal = (curVal + 1) % 10;
            const isAlignedInStory = this.difficultyMode === 'STORY' && curVal === this.TARGET_COMBINATION[idx];
            return `
              <div class="brass-tumbler-slot" data-dial="${idx}">
                <button class="tumbler-arrow-btn" data-dial="${idx}" data-dir="-1">▲</button>
                <div class="brass-tumbler-cylinder ${isAlignedInStory ? 'dial-aligned' : ''}" id="tumbler-cylinder-${idx}" data-dial="${idx}">
                  <span class="tumbler-ghost-numeral tumbler-ghost-prev">${this.SANSKRIT_NUMERALS[prevVal]}</span>
                  <span class="tumbler-active-numeral" id="tumbler-val-${idx}">${this.SANSKRIT_NUMERALS[curVal]}</span>
                  <span class="tumbler-ghost-numeral tumbler-ghost-next">${this.SANSKRIT_NUMERALS[nextVal]}</span>
                </div>
                <button class="tumbler-arrow-btn" data-dial="${idx}" data-dir="1">▼</button>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Pull Brass Latch Button -->
        <button id="btn-pull-latch" class="btn-pull-latch">PULL BRASS LATCH</button>

        <!-- Dynamic Resin Drip Zone -->
        <div class="resin-drip-zone" id="resin-drip-zone"></div>

        <!-- In-World Tactile Investigation Shortcuts -->
        <div class="crate-inworld-shortcuts">
          <button id="btn-inspect-convoy-shortcut" class="btn-crate-clue-link">
            <span>❖ EXAMINE CONVOY (9 WAGONS)</span>
          </button>
          <button id="btn-inspect-folio-shortcut" class="btn-crate-clue-link">
            <span>❖ EXAMINE SURVEYOR'S FOLIO</span>
          </button>
          <button id="btn-inspect-disc-shortcut" class="btn-crate-clue-link">
            <span>❖ EXAMINE VIDURA'S DISC</span>
          </button>
          <button id="btn-inspect-tally-shortcut-inner" class="btn-crate-clue-link">
            <span>❖ EXAMINE TALLY STONE</span>
          </button>
        </div>
      </div>
    `;

    // Difficulty selector buttons
    this.dom.closeupInteractiveLayer.querySelectorAll('.btn-diff-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = (btn as HTMLElement).dataset.mode as any;
        if (mode) {
          this.difficultyMode = mode;
          AudioEngine.playMechanicalClick();
          this.renderCrateLockMechanism();
          if (mode === 'STORY') {
            this.dom.closeupWhisperText.innerText = "Story Mode: Dials click distinctly when aligned to the correct digit.";
          } else if (mode === 'SCHOLAR') {
            this.dom.closeupWhisperText.innerText = "Scholar Mode: Vidura's guidance is withheld until after two failed attempts.";
          } else {
            this.dom.closeupWhisperText.innerText = "Standard Mode: Only the full latch gives feedback on pull.";
          }
        }
      });
    });

    // Arrow button listeners
    this.dom.closeupInteractiveLayer.querySelectorAll('.tumbler-arrow-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dialIdx = parseInt((btn as HTMLElement).dataset.dial!);
        const dir = parseInt((btn as HTMLElement).dataset.dir!);
        this.rotateLockDial(dialIdx, dir);
      });
    });

    // Cylinder wheel & drag listeners
    [0, 1, 2].forEach(idx => {
      const cyl = document.getElementById(`tumbler-cylinder-${idx}`);
      if (!cyl) return;

      cyl.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dir = e.deltaY > 0 ? 1 : -1;
        this.rotateLockDial(idx, dir);
      }, { passive: false });

      // Touch / pointer drag with momentum
      let startY = 0;
      cyl.addEventListener('pointerdown', (e) => {
        startY = e.clientY;
        cyl.setPointerCapture(e.pointerId);
      });
      cyl.addEventListener('pointermove', (e) => {
        if (startY === 0) return;
        const diff = e.clientY - startY;
        if (Math.abs(diff) > 26) {
          this.rotateLockDial(idx, diff > 0 ? 1 : -1);
          startY = e.clientY;
        }
      });
      cyl.addEventListener('pointerup', () => {
        startY = 0;
      });
    });

    // Latch pull button
    document.getElementById('btn-pull-latch')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.attemptUnlockCrate();
    });

    // Shortcut: Examine Convoy
    document.getElementById('btn-inspect-convoy-shortcut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openConvoyCloseUp();
    });

    // Shortcut: Examine Surveyor's Folio
    document.getElementById('btn-inspect-folio-shortcut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSurveyorFolioCloseUp();
    });

    // Shortcut: Examine Vidura's Disc
    document.getElementById('btn-inspect-disc-shortcut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openCopperDiscCloseUp();
    });

    // Shortcut: Examine Tally Stone
    document.getElementById('btn-inspect-tally-shortcut-inner')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTallyStoneCloseUp();
    });
  }

  private rotateLockDial(dialIdx: number, dir: number) {
    this.lockDials[dialIdx] = (this.lockDials[dialIdx] + dir + 10) % 10;

    const curVal = this.lockDials[dialIdx];
    const prevVal = (curVal - 1 + 10) % 10;
    const nextVal = (curVal + 1) % 10;

    const valEl = document.getElementById(`tumbler-val-${dialIdx}`);
    if (valEl) {
      valEl.innerText = this.SANSKRIT_NUMERALS[curVal];
      gsap.fromTo(valEl, { y: dir * 7, opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.15, ease: 'power2.out' });
    }

    const cyl = document.getElementById(`tumbler-cylinder-${dialIdx}`);
    if (cyl) {
      const prevEl = cyl.querySelector('.tumbler-ghost-prev') as HTMLElement;
      const nextEl = cyl.querySelector('.tumbler-ghost-next') as HTMLElement;
      if (prevEl) prevEl.innerText = this.SANSKRIT_NUMERALS[prevVal];
      if (nextEl) nextEl.innerText = this.SANSKRIT_NUMERALS[nextVal];

      // Story mode: dial clicks when its digit is right!
      if (this.difficultyMode === 'STORY') {
        if (curVal === this.TARGET_COMBINATION[dialIdx]) {
          AudioEngine.playMechanicalClick();
          cyl.classList.add('dial-aligned');
          AudioEngine.triggerCaption(`✦ [Tumbler ${dialIdx + 1} clicks into alignment]`);
        } else {
          cyl.classList.remove('dial-aligned');
          AudioEngine.playMechanicalClick();
        }
      } else {
        AudioEngine.playMechanicalClick();
      }
    }
  }

  private attemptUnlockCrate() {
    const isCorrect = this.lockDials.every((val, idx) => val === this.TARGET_COMBINATION[idx]);

    if (isCorrect) {
      this.isCrateUnlocked = true;
      AudioEngine.playLatchSnap();
      setTimeout(() => AudioEngine.playWoodCreak(), 200);
      setTimeout(() => AudioEngine.playDiscoveryChime(), 400);

      // Camera rack-focus animation
      this.dom.closeupViewport.classList.add('camera-rack-focus');
      setTimeout(() => {
        this.dom.closeupViewport.classList.remove('camera-rack-focus');
      }, 1400);

      this.dom.closeupWhisperText.innerText = "✦ CLACK! The brass pins align. A faint oily scent—crude lac mixed with ghee—wafts from the open timber.";

      // Reward & Carry-over Knowledge Flags
      GameState.unlockKnowledge('sawLacShipment');
      GameState.unlockKnowledge('noticedDoorMismatch');
      GameState.unlockKnowledge('knowsNightsRemain');
      GameState.unlockKnowledge('knowsCombustibleMaterials');
      GameState.unlockKnowledge('knowsHouseIsDangerous');

      // Create Evidence Card: Amber blocks packed in cedar, smelling of ghee
      const amberClue: ClueDefinition = {
        id: 'clue_amber_blocks_ghee',
        title: "Amber blocks packed in cedar, smelling of ghee",
        type: 'MATERIAL EVIDENCE',
        desc: "Raw, translucent blocks of combustible lac resin concealed beneath cedar wood shavings, heavily scented with clarified ghee.",
      };
      Tableau.addClueToTray(amberClue);
      Tableau.placeClueOnBoard(amberClue);
      GameState.addClue(amberClue);

      // Create Evidence Card: Confiscated Royal Dispatch
      const dispatchClue: ClueDefinition = {
        id: 'clue_purochana_dispatch',
        title: "Purochana's Dispatch",
        desc: "Private courier order from Duryodhana mandating lac-reinforced walls.",
        type: 'DOCUMENT',
      };
      Tableau.addClueToTray(dispatchClue);
      Tableau.placeClueOnBoard(dispatchClue);
      GameState.addClue(dispatchClue);

      FolioSketchbook.renderStudy(1, true);

      // Re-render opened state
      setTimeout(() => {
        this.openCrateCloseUp();
      }, 700);

      this.dom.btnNextRoom.classList.remove('hidden');
    } else {
      // Soft clunk sound and track failed attempt
      AudioEngine.playWallTap(false);
      this.failedCrateAttempts++;

      // Resin drip visual animation
      const dripZone = document.getElementById('resin-drip-zone');
      if (dripZone) {
        const drop = document.createElement('div');
        drop.className = 'resin-ooze-drop';
        drop.style.left = `${45 + (Math.random() * 10 - 5)}%`;
        dripZone.appendChild(drop);
        setTimeout(() => drop.remove(), 1500);
      }

      // Screen micro-shake
      const modal = this.dom.closeupModal;
      gsap.fromTo(modal, { x: -5 }, { x: 5, duration: 0.05, repeat: 4, yoyo: true, onComplete: () => { modal.style.transform = ''; } });

      // Story mode reveals aligned dials; Standard/Scholar never reveal which dial is wrong!
      if (this.difficultyMode === 'STORY') {
        const correctCount = this.lockDials.filter((v, i) => v === this.TARGET_COMBINATION[i]).length;
        this.dom.closeupWhisperText.innerText = `A soft clunk and a resin drip. (${correctCount} of 3 tumblers aligned)`;
      } else {
        this.dom.closeupWhisperText.innerText = "A soft clunk echoes as amber resin oozes down the timber joinery. The latch catches firmly.";
      }
    }
  }

  // =========================================================================
  // FULL-SCREEN IN-WORLD CLOSE-UP: CONVOY INSPECTION (9 WAGONS)
  // =========================================================================
  public openConvoyCloseUp() {
    this.currentCloseUpObject = 'convoy';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/closeup_crate.jpg';
    this.dom.closeupObjectLabel.innerText = "ARRIVAL CONVOY · 9 WAGONS";
    this.dom.closeupWhisperText.innerText = "Nine wagons stand in the temple courtyard. Exactly 4 have resin-stained wheels and lac guild stamps. One sweet cart drips honey (red herring).";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');

    const wagonsData = [
      { id: 1, name: "Cart 1 · Flower Garlands", type: "FESTIVAL", icon: "🌸", stamp: "No Stamp", wheels: "Clean wooden spokes", desc: "Temple offerings of marigold and white jasmine. No resin." },
      { id: 2, name: "Wagon 2 · Heavy Freight", type: "LAC", icon: "🪵", stamp: "★ LAC GUILD STAMP", wheels: "Resin-stained wheels (weeping dark amber)", desc: "Sealed eastern mountain timber. Amber pitch oozes from the axle." },
      { id: 3, name: "Cart 3 · Wild Honey & Sweets", type: "HERRING", icon: "🍯", stamp: "No Stamp", wheels: "Golden liquid dripping on rim", desc: "Red Herring: Honey dripping from a cracked jar looks like amber resin, but the tailboard has NO lac stamp!" },
      { id: 4, name: "Wagon 4 · Timber Freight", type: "LAC", icon: "📦", stamp: "★ LAC GUILD STAMP", wheels: "Resin-stained wheels (weeping dark amber)", desc: "Heavy beam chest bound with thick hemp. Weeps dark resin." },
      { id: 5, name: "Cart 5 · Sandalwood & Incense", type: "FESTIVAL", icon: "🪔", stamp: "No Stamp", wheels: "Clean wooden spokes", desc: "Sacred dhoop and camphor burners. Dry dust on the rims." },
      { id: 6, name: "Wagon 6 · Reinforced Chest", type: "LAC", icon: "🛡", stamp: "★ LAC GUILD STAMP", wheels: "Resin-stained wheels (weeping dark amber)", desc: "Iron-banded crate sweating raw lac along the bottom joinery." },
      { id: 7, name: "Cart 7 · Silk & Ceremonial Robes", type: "FESTIVAL", icon: "👘", stamp: "No Stamp", wheels: "Clean wooden spokes", desc: "Auspicious golden textiles for the royal welcome." },
      { id: 8, name: "Wagon 8 · Pine Supply Chest", type: "LAC", icon: "🌲", stamp: "★ LAC GUILD STAMP", wheels: "Resin-stained wheels (weeping dark amber)", desc: "Low-slung wagon weeping thick amber drops from beneath the tarp." },
      { id: 9, name: "Cart 9 · Auspicious Grains", type: "FESTIVAL", icon: "🌾", stamp: "No Stamp", wheels: "Clean wooden spokes", desc: "Pounded rice and vermilion powder offerings." },
    ];

    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="convoy-inspection-panel glass-vellum">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1.5px solid rgba(212,175,55,0.4); padding-bottom: 8px;">
          <div>
            <span style="font-family:var(--font-regal); font-size:0.7rem; color:var(--crimson-vedic); font-weight:700; letter-spacing:1.5px;">EVIDENCE INSPECTION</span>
            <h3 style="font-family:var(--font-regal); font-size:1.15rem; margin:0; color:var(--ink-primary);">THE ARRIVAL CONVOY · 9 SUPPLY WAGONS</h3>
          </div>
          <button id="btn-convoy-back-crate" class="btn-subtle">RETURN TO CRATE</button>
        </div>

        <div style="background:#fff9f0; border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:8px 12px; font-size:0.8rem; color:#5a4128;">
          <strong>Survey Note:</strong> 9 wagons total. Count only wagons that <em>weep amber resin</em> (bearing both the resin-stained wheels AND the official Lac Guild tailboard stamp).
        </div>

        <div class="convoy-grid">
          ${wagonsData.map(w => `
            <div class="convoy-wagon-card ${w.type === 'LAC' ? 'is-lac-wagon' : (w.type === 'HERRING' ? 'is-red-herring' : '')}">
              <div class="wagon-card-header">
                <span class="wagon-card-title">${w.icon} ${w.name}</span>
                <span class="wagon-badge ${w.type === 'LAC' ? 'badge-lac' : (w.type === 'HERRING' ? 'badge-herring' : 'badge-festival')}">
                  ${w.type === 'LAC' ? 'LAC WAGON' : (w.type === 'HERRING' ? 'RED HERRING' : 'FESTIVAL')}
                </span>
              </div>
              <div class="wagon-details-row">
                <div><span class="wagon-spec-tag">Tailboard:</span> ${w.stamp}</div>
                <div><span class="wagon-spec-tag">Wheels:</span> ${w.wheels}</div>
                <div style="font-style:italic; margin-top:2px;">${w.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background:rgba(184, 74, 45, 0.1); border-left:3px solid #b84a2d; padding:8px 14px; border-radius:0 8px 8px 0; font-size:0.82rem; color:var(--ink-primary);">
          <strong>Deduction:</strong> Wagons with Lac Stamp + Weeping Resin Wheels = <strong>4 wagons</strong> (Wagons 2, 4, 6, 8). One sweet cart drips honey (no stamp). 4 standard festival carts.
        </div>
      </div>
    `;

    document.getElementById('btn-convoy-back-crate')?.addEventListener('click', () => {
      this.openCrateCloseUp();
    });

    this.dom.closeupModal.classList.remove('hidden');
  }

  // =========================================================================
  // FULL-SCREEN IN-WORLD CLOSE-UP: TOWN SURVEYOR'S FOLIO (7 DOORS BLUEPRINT)
  // =========================================================================
  public openSurveyorFolioCloseUp() {
    this.currentCloseUpObject = 'folio_plan';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/closeup_tally_board.jpg';
    this.dom.closeupObjectLabel.innerText = "TOWN SURVEYOR'S FOLIO · ARCHITECTURAL BLUEPRINT";
    this.dom.closeupWhisperText.innerText = "The surveyor's folio plan clearly shows 7 doors. But Purochana swore: 'a house of five doors.'";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');

    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="surveyor-folio-plan-container glass-vellum">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:8px;">
          <div>
            <span style="font-family:var(--font-regal); font-size:0.7rem; color:var(--crimson-vedic); font-weight:700; letter-spacing:1.5px;">BLUEPRINT SCHEMATIC</span>
            <h3 style="font-family:var(--font-regal); font-size:1.15rem; margin:0; color:var(--ink-primary);">TOWN SURVEYOR'S OFFICIAL GROUND PLAN</h3>
          </div>
          <button id="btn-folio-back-crate" class="btn-subtle">RETURN TO CRATE</button>
        </div>

        <svg class="surveyor-blueprint-svg" viewBox="0 0 580 290">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(180,150,120,0.18)" stroke-width="0.8"/>
            </pattern>
          </defs>
          <rect width="580" height="290" fill="url(#grid)"/>

          <!-- Palace Perimeter Walls -->
          <rect x="70" y="35" width="440" height="200" fill="rgba(212,175,55,0.06)" stroke="#4a3b2c" stroke-width="2.5"/>
          <line x1="220" y1="35" x2="220" y2="235" stroke="#7a624d" stroke-width="1.5" stroke-dasharray="4,3"/>
          <line x1="370" y1="35" x2="370" y2="235" stroke="#7a624d" stroke-width="1.5" stroke-dasharray="4,3"/>
          <line x1="70" y1="135" x2="510" y2="135" stroke="#7a624d" stroke-width="1.5" stroke-dasharray="4,3"/>

          <!-- Room Labels -->
          <text x="145" y="85" font-family="'Cinzel', serif" font-size="11" fill="#6e5541" text-anchor="middle">EAST HALL</text>
          <text x="295" y="85" font-family="'Cinzel', serif" font-size="11" fill="#6e5541" text-anchor="middle">CENTRAL COURT</text>
          <text x="440" y="85" font-family="'Cinzel', serif" font-size="11" fill="#6e5541" text-anchor="middle">WEST SALON</text>
          <text x="145" y="185" font-family="'Cinzel', serif" font-size="11" fill="#6e5541" text-anchor="middle">ROYAL SUITE</text>
          <text x="295" y="185" font-family="'Cinzel', serif" font-size="11" fill="#6e5541" text-anchor="middle">BANQUET HALL</text>
          <text x="440" y="185" font-family="'Cinzel', serif" font-size="11" fill="#6e5541" text-anchor="middle">RIVER VERANDA</text>

          <!-- The 7 Doors Marked -->
          <!-- Door 1: North Main Portico -->
          <rect x="275" y="27" width="40" height="16" fill="#b84a2d" rx="2"/>
          <circle cx="295" cy="18" r="9" fill="#96251b"/>
          <text x="295" y="22" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">1</text>
          <text x="295" y="10" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 1 (North Gate)</text>

          <!-- Door 2: East Gallery -->
          <rect x="62" y="70" width="16" height="30" fill="#b84a2d" rx="2"/>
          <circle cx="48" cy="85" r="9" fill="#96251b"/>
          <text x="48" y="89" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">2</text>
          <text x="48" y="104" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 2</text>

          <!-- Door 3: East Sentry Postern -->
          <rect x="62" y="170" width="16" height="30" fill="#b84a2d" rx="2"/>
          <circle cx="48" cy="185" r="9" fill="#96251b"/>
          <text x="48" y="189" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">3</text>
          <text x="48" y="204" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 3</text>

          <!-- Door 4: South Garden Portal -->
          <rect x="195" y="227" width="40" height="16" fill="#b84a2d" rx="2"/>
          <circle cx="215" cy="255" r="9" fill="#96251b"/>
          <text x="215" y="259" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">4</text>
          <text x="215" y="272" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 4</text>

          <!-- Door 5: South River Sally Port -->
          <rect x="350" y="227" width="40" height="16" fill="#b84a2d" rx="2"/>
          <circle cx="370" cy="255" r="9" fill="#96251b"/>
          <text x="370" y="259" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">5</text>
          <text x="370" y="272" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 5</text>

          <!-- Door 6: West River Terrace -->
          <rect x="502" y="70" width="16" height="30" fill="#b84a2d" rx="2"/>
          <circle cx="532" cy="85" r="9" fill="#96251b"/>
          <text x="532" y="89" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">6</text>
          <text x="532" y="104" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 6</text>

          <!-- Door 7: Concealed River Postern -->
          <rect x="502" y="170" width="16" height="30" fill="#b84a2d" rx="2"/>
          <circle cx="532" cy="185" r="9" fill="#96251b"/>
          <text x="532" y="189" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">7</text>
          <text x="532" y="204" font-family="sans-serif" font-size="8" fill="#96251b" text-anchor="middle">DOOR 7</text>
        </svg>

        <div class="surveyor-calc-box">
          <div class="calc-title">DEDUCTION: SURVEYOR'S PLAN VS. BUILDER'S WORD</div>
          <p class="calc-body">
            • <strong>Surveyor's Folio Blueprint:</strong> Exactly <strong>7 doors</strong> are drafted.<br>
            • <strong>Purochana's Sworn Declaration (Manhwa Panel 3):</strong> <em>"I have built a house of five doors."</em> (<strong>5 doors</strong>).<br>
            • <strong>Difference:</strong> 7 (Drawn) − 5 (Sworn) = <strong>2 doors</strong>.
          </p>
        </div>
      </div>
    `;

    document.getElementById('btn-folio-back-crate')?.addEventListener('click', () => {
      this.openCrateCloseUp();
    });

    this.dom.closeupModal.classList.remove('hidden');
  }

  // =========================================================================
  // FULL-SCREEN IN-WORLD CLOSE-UP: MERCHANT'S TALLY STONE (ROSETTA KEY)
  // =========================================================================
  public openTallyStoneCloseUp() {
    this.currentCloseUpObject = 'tally';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/closeup_tally_board.jpg';
    this.dom.closeupObjectLabel.innerText = "MERCHANT'S TALLY STONE · ROSETTA KEY";
    this.dom.closeupWhisperText.innerText = "The merchant's tally stone correlates counting notches (1 to 9) with Sanskrit numerals (१ to ९).";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');

    const rows = [
      { num: 1, notch: "|", glyph: "१", word: "One" },
      { num: 2, notch: "||", glyph: "२", word: "Two" },
      { num: 3, notch: "|||", glyph: "३", word: "Three" },
      { num: 4, notch: "||||", glyph: "४", word: "Four" },
      { num: 5, notch: "|||||", glyph: "५", word: "Five" },
      { num: 6, notch: "||||||", glyph: "६", word: "Six" },
      { num: 7, notch: "|||||||", glyph: "७", word: "Seven" },
      { num: 8, notch: "||||||||", glyph: "८", word: "Eight" },
      { num: 9, notch: "|||||||||", glyph: "९", word: "Nine" },
    ];

    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="tally-stone-grid-view">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.3); padding-bottom:6px; margin-bottom:4px;">
          <div>
            <span style="font-family:var(--font-regal); font-size:0.68rem; color:#ffd700; letter-spacing:1.5px;">ROSETTA KEY</span>
            <h4 style="font-family:var(--font-regal); font-size:0.95rem; margin:0; color:#fff;">MERCHANT'S CARVED TALLY SLATE</h4>
          </div>
          <button id="btn-tally-back-crate" class="btn-subtle">RETURN TO CRATE</button>
        </div>

        ${rows.map(r => `
          <div class="tally-stone-row ${[4, 2, 3].includes(r.num) ? 'highlight-target' : ''}">
            <span class="tally-row-idx">Row ${r.num}</span>
            <span class="tally-notches">${r.notch}</span>
            <span class="tally-glyph">${r.glyph}</span>
            <span class="tally-word">${r.word}</span>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-tally-back-crate')?.addEventListener('click', () => {
      this.openCrateCloseUp();
    });

    this.dom.closeupModal.classList.remove('hidden');
  }

  // =========================================================================
  // 4-TIER HINT SYSTEM & "SHOW ME" WALKTHROUGH
  // =========================================================================
  private triggerShowMeWalkthrough() {
    this.dom.hintModal.classList.add('hidden');
    this.dom.closeupWhisperText.innerText = "✦ Vidura's disciple begins the walkthrough...";

    // Step 1: Open Tally Stone to translate 4, 2, 3
    setTimeout(() => {
      this.openTallyStoneCloseUp();
      this.dom.closeupWhisperText.innerText = "STEP 1: 4 lac wagons (४), 7 minus 5 doors = 2 (२), 3 dark moons remaining (३).";
      AudioEngine.playTempleBell(440);
    }, 800);

    // Step 2: Return to Crate
    setTimeout(() => {
      this.openCrateCloseUp();
      this.dom.closeupWhisperText.innerText = "STEP 2: Aligning the brass tumblers to ४ (4), २ (2), and ३ (3)...";
    }, 4200);

    // Step 3: Auto-rotate dials step by step to 4, 2, 3
    setTimeout(() => {
      const step0 = (4 - this.lockDials[0] + 10) % 10;
      this.rotateLockDial(0, step0);
    }, 5500);
    setTimeout(() => {
      const step1 = (2 - this.lockDials[1] + 10) % 10;
      this.rotateLockDial(1, step1);
    }, 6700);
    setTimeout(() => {
      const step2 = (3 - this.lockDials[2] + 10) % 10;
      this.rotateLockDial(2, step2);
    }, 7900);

    // Step 4: Pull latch and unlock
    setTimeout(() => {
      this.attemptUnlockCrate();
      FolioSketchbook.renderStudy(1, true);
    }, 9200);
  }

  // =========================================================================
  // SATCHEL (INVENTORY) & ARTIFACT INSPECTION
  // =========================================================================
  private addToSatchel(item: InventoryItem) {
    this.satchelItems.push(item);
    this.dom.inventoryCount.innerText = `${this.satchelItems.length}`;
    this.renderSatchelTray();

    // Register clue if copper disc or artifact
    if (item.id === 'item_copper_disc') {
      const discClue: ClueDefinition = {
        id: 'clue_copper_disc',
        title: "Vidura's Moon Count Disc",
        type: 'ENIGMA',
        desc: "Vidura's copper night talisman: A ring of 9 moons (6 lit, 3 dark remaining). 'The disc keeps count of nights. Ask it what remains.'",
      };
      Tableau.addClueToTray(discClue);
      GameState.addClue(discClue);
    }
  }

  private hasItem(id: string): boolean {
    return this.satchelItems.some((item) => item.id === id);
  }

  private toggleSatchel() {
    this.isSatchelOpen = !this.isSatchelOpen;
    AudioEngine.playFootstep();
    if (this.isSatchelOpen) {
      this.dom.inventoryTray.classList.remove('hidden');
    } else {
      this.dom.inventoryTray.classList.add('hidden');
    }
  }

  private renderSatchelTray() {
    this.dom.inventoryTray.innerHTML = '';
    this.satchelItems.forEach((item) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.title = `${item.name}: ${item.desc}`;
      slot.innerHTML = `
        <span class="slot-icon">${item.icon}</span>
        <span class="slot-title">${item.name}</span>
      `;
      slot.addEventListener('click', () => {
        this.openArtifactCloseUp(item);
      });
      this.dom.inventoryTray.appendChild(slot);
    });
  }

  public openCopperDiscCloseUp() {
    this.openArtifactCloseUp({
      id: 'item_copper_disc',
      name: "Vidura's Copper Moon Disc",
      icon: '🔘',
      type: 'CIPHER TALISMAN',
      desc: "Vidura's heavy bronze-copper disc. A celestial ring of 9 moons: 6 carved lit, and 3 dark hollows remaining. 'The disc keeps count of nights. Ask it what remains.'",
      imageSrc: '/assets/closeup_copper_disc.jpg',
    });
  }

  public openArtifactCloseUp(item: InventoryItem) {
    this.currentCloseUpObject = 'disc';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = item.imageSrc;
    this.dom.closeupObjectLabel.innerText = item.name.toUpperCase();
    this.dom.btnInspectTallyShortcut.classList.add('hidden');

    if (item.id === 'item_copper_disc') {
      this.dom.closeupWhisperText.innerText = "The disc keeps count of nights. Ask it what remains.";
      this.dom.closeupInteractiveLayer.innerHTML = `
        <div class="copper-disc-viewport">
          <div class="disc-envoy-quote">"The disc keeps count of nights. Ask it what remains."</div>
          
          <svg class="disc-moon-ring-svg" viewBox="0 0 260 260">
            <defs>
              <radialGradient id="discMetal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#b87333"/>
                <stop offset="65%" stop-color="#804a1e"/>
                <stop offset="90%" stop-color="#4a2a10"/>
                <stop offset="100%" stop-color="#2a1608"/>
              </radialGradient>
              <radialGradient id="litMoon" cx="40%" cy="40%" r="50%">
                <stop offset="0%" stop-color="#fff8db"/>
                <stop offset="60%" stop-color="#ffd700"/>
                <stop offset="100%" stop-color="#c99700"/>
              </radialGradient>
            </defs>
            <circle cx="130" cy="130" r="120" fill="url(#discMetal)" stroke="#d4af37" stroke-width="4"/>
            <circle cx="130" cy="130" r="85" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle cx="130" cy="130" r="45" fill="none" stroke="rgba(212,175,55,0.4)" stroke-width="2"/>
            
            <!-- Central Inscribed Porcupine Symbol (Vidura's Secret Cipher) -->
            <text x="130" y="137" font-size="28" text-anchor="middle" fill="#d4af37" opacity="0.85">🦔</text>

            <!-- 9 Moons: Exactly 6 Lit, 3 Dark (NO numerals on disc!) -->
            ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
              const angle = (i * 40 - 90) * (Math.PI / 180);
              const cx = 130 + 85 * Math.cos(angle);
              const cy = 130 + 85 * Math.sin(angle);
              const isLit = i < 6; // 6 lit moons, 3 dark moons
              if (isLit) {
                return `
                  <circle cx="${cx}" cy="${cy}" r="11" fill="url(#litMoon)" stroke="#ffe899" stroke-width="1.5"/>
                  <circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="#ffd700" stroke-width="0.8" opacity="0.7"/>
                `;
              } else {
                return `
                  <circle cx="${cx}" cy="${cy}" r="11" fill="#140f0c" stroke="#5a4530" stroke-width="1.5"/>
                  <path d="M ${cx - 5} ${cy - 8} A 9 9 0 0 0 ${cx - 5} ${cy + 8} A 11 11 0 0 1 ${cx - 5} ${cy - 8}" fill="#332419"/>
                `;
              }
            }).join('')}
          </svg>

          <div class="disc-moon-summary">
            Ring of 9 moons: <strong>6 carved lit</strong>, <strong>3 dark remaining</strong>.<br>
            <span style="font-style:italic; color:#ffd700;">No numerals or text appear upon the metal.</span>
          </div>

          <button id="btn-disc-back-crate" class="btn-subtle">RETURN TO CRATE</button>
        </div>
      `;

      document.getElementById('btn-disc-back-crate')?.addEventListener('click', () => {
        this.openCrateCloseUp();
      });
    } else {
      this.dom.closeupWhisperText.innerText = item.desc;
      this.dom.closeupInteractiveLayer.innerHTML = '';
    }

    this.dom.closeupModal.classList.remove('hidden');
  }

  // =========================================================================
  // DRISHTI INSIGHT MODE
  // =========================================================================
  private toggleDrishtiSight() {
    const isEngaged = GameState.toggleDrishti();
    if (isEngaged) {
      AudioEngine.triggerDramaticSilence(3.0);
      this.dom.drishtiOverlay.classList.remove('hidden');
      this.dom.btnDrishti.style.borderColor = 'var(--gold-regal)';
      this.dom.btnDrishti.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.6)';
      this.dom.ambientTickerText.innerText = "👁‍🗨 Drishti Engaged: Internal air currents and structural joints illuminated.";
    } else {
      this.dom.drishtiOverlay.classList.add('hidden');
      this.dom.btnDrishti.style.borderColor = '';
      this.dom.btnDrishti.style.boxShadow = '';
      this.dom.ambientTickerText.innerText = "Golden hour sunbeams warm the river stones.";
    }
  }

  // =========================================================================
  // CANONICAL DECISION PROMPT
  // =========================================================================
  private openDecisionPrompt() {
    AudioEngine.playDiscoveryChime();
    this.dom.decisionTitle.innerText = "Purochana's Invitation to Lakshagriha";
    this.dom.decisionDesc.innerText =
      "Purochana bows low, urging the royal family to enter the house before sunset. Having discovered the lac resin and Duryodhana's dispatch, what is your counsel?";

    this.dom.decisionOptions.innerHTML = `
      <button class="decision-choice-btn" id="btn-choice-feign">
        <span class="choice-title">Feign Total Innocence & Accept Escort</span>
        <span class="choice-consequence">Preserves secrecy (-10% Vigilance). Duryodhana's spies report normal compliance.</span>
      </button>
      <button class="decision-choice-btn" id="btn-choice-delay">
        <span class="choice-title">Linger by the Ghats to Scout River Paths</span>
        <span class="choice-consequence">Unlocks knowledge of river skiffs (+15% Vigilance). Purochana becomes watchful.</span>
      </button>
    `;

    document.getElementById('btn-choice-feign')?.addEventListener('click', () => {
      this.dom.decisionModal.classList.add('hidden');
      GameState.setSuspicion(-10);
      this.dom.ambientTickerText.innerText = "You accept Purochana's escort with serene grace. The trap remains undisturbed.";
      this.dom.btnNextRoom.classList.remove('hidden');
    });

    document.getElementById('btn-choice-delay')?.addEventListener('click', () => {
      this.dom.decisionModal.classList.add('hidden');
      GameState.setSuspicion(15);
      this.dom.ambientTickerText.innerText = "You linger at the Ganga shallows. The river skiff route is memorized for flight.";
      this.dom.btnNextRoom.classList.remove('hidden');
    });

    this.dom.decisionModal.classList.remove('hidden');
  }

  // =========================================================================
  // ROOM 2: LAKSHAGRIHA (THE GRAND CHAMBER) MASTER ENGINE & ROUTINES
  // =========================================================================

  public transitionToGrandChamber(revisit: boolean = false) {
    AudioEngine.init();
    this.currentRoomId = 2;
    this.stopRoom2Routine();
    this.stopRoom2IdleBarks();

    if (this.dom.btnTabRoom1) this.dom.btnTabRoom1.classList.remove('active');
    if (this.dom.btnTabRoom2) this.dom.btnTabRoom2.classList.add('active');
    this.dom.actTag.innerText = "ACT II: CURIOSITY & SPLENDOR";
    this.dom.chapterTitle.innerText = "Lakshagriha: The Grand Chamber";

    UIStore.closePanel();
    this.dom.hintModal.classList.add('hidden');
    this.dom.closeupModal.classList.add('hidden');
    this.dom.cinematicModal.classList.add('hidden');
    this.dom.manhwaContainer.classList.add('hidden');
    this.dom.manhwaContainerRoom2.classList.add('hidden');
    this.dom.viewportStage.classList.remove('hidden');
    this.currentScene = 'GATE_ROOM';

    WorldEngine.setRoomScene(2);
    const backdrop = document.getElementById('room-backdrop-layer');
    if (backdrop) backdrop.className = 'room-backdrop-layer room2-chamber';
    this.renderGrandChamberScene(revisit);
    this.startRoom2Routine();
    this.startRoom2IdleBarks();

    if (!revisit && !this.room2Revisited) {
      this.room2Revisited = true;
      this.dom.btnSkipCinematic.classList.remove('hidden');
      this.dom.ambientTickerText.innerText = "Cedar, gold and silk. Everything shines like it was made yesterday.";

      WorldEngine.playRoom2EntranceCinematic(() => {
        this.finishRoom2EntranceCinematic();
      });
    } else {
      this.dom.ambientTickerText.innerText =
        "Revisiting the Grand Chamber: Soot clings to the base of the east wall. Extra iron bolts gleam outside the windows.";
    }
  }

  private finishRoom2EntranceCinematic() {
    this.dom.btnSkipCinematic.classList.add('hidden');
    this.triggerArrivalBanner();
    this.triggerRoom2OpeningDialogue();
  }

  private triggerRoom2OpeningDialogue() {
    // Shot-by-shot opening lines anchored to speakers (each <= 14 words, voiceless with audio tick)
    setTimeout(() => {
      this.showSpeechBubble(84, 30, 'Purochana', '/assets/char_purochana.jpg',
        "Welcome, princes. Not a nail was spared for your comfort."
      );
    }, 500);

    setTimeout(() => {
      this.showSpeechBubble(45, 52, 'Queen Kunti', '/assets/char_kunti.jpg',
        "It is lovely. Why does my chest feel so tight?"
      );
    }, 3200);

    setTimeout(() => {
      this.showSpeechBubble(54, 46, 'Yudhishthira', '/assets/char_yudhishthira.jpg',
        "Smell the air. Ghee and resin, and nothing is cooking."
      );
    }, 6000);

    setTimeout(() => {
      this.showSpeechBubble(36, 46, 'Bhimasena', '/assets/char_bhima.jpg',
        "A house that smells like a feast with no feast."
      );
    }, 8800);

    setTimeout(() => {
      this.showSpeechBubble(54, 46, 'Yudhishthira', '/assets/char_yudhishthira.jpg',
        "Say nothing. Smile. Keep your eyes open."
      );
    }, 11500);
  }

  // Purochana 90-Second Routine Loop
  private startRoom2Routine() {
    this.stopRoom2Routine();
    this.room2RoutineElapsed = 0;
    this.room2RoutineTimer = setInterval(() => {
      if (this.currentRoomId !== 2) return;
      this.room2RoutineElapsed = (this.room2RoutineElapsed + 1) % 90;
      this.updatePurochanaRoutine(this.room2RoutineElapsed);
    }, 1000);
  }

  private stopRoom2Routine() {
    if (this.room2RoutineTimer) {
      clearInterval(this.room2RoutineTimer);
      this.room2RoutineTimer = null;
    }
  }

  private updatePurochanaRoutine(sec: number) {
    const puroActor = document.getElementById('actor-purochana');
    if (!puroActor) return;

    if (sec < 25) {
      // 0:00 - 0:25: Upper gallery rail, hands behind back, smiling down
      puroActor.style.left = '82%';
      puroActor.style.top = '20%';
      puroActor.title = "Purochana · Upper Gallery Rail (smiling down)";
    } else if (sec < 45) {
      // 0:25 - 0:45: Walks to stairs landing, glances toward the hall
      puroActor.style.left = '88%';
      puroActor.style.top = '36%';
      puroActor.title = "Purochana · Gallery Staircase";
    } else if (sec < 60) {
      // 0:45 - 1:00: Inspects east wall upper timber seam
      puroActor.style.left = '82%';
      puroActor.style.top = '36%';
      puroActor.title = "Purochana · East Wall Upper Timber Seam";
    } else if (sec < 75) {
      // 1:00 - 1:15: Greets Kunti with a formal bow from the aisle
      puroActor.style.left = '43%';
      puroActor.style.top = '78%';
      puroActor.title = "Purochana · Greeting Queen Kunti";
    } else {
      // 1:15 - 1:30: Exits through outer corridor
      puroActor.style.left = '95%';
      puroActor.style.top = '76%';
      puroActor.title = "Purochana · Exiting through portal";
    }
  }

  // 25-Second Random Idle Barks (Only one at a time)
  private startRoom2IdleBarks() {
    this.stopRoom2IdleBarks();
    const barks = [
      { speaker: 'Oil-Bearer', portrait: '/assets/room02_char_oilbearer.jpg', text: "Mind the floor, my lord. We oiled it this morning." },
      { speaker: 'Lamp-Boy', portrait: '/assets/room02_char_lampboy.jpg', text: "They never stay straight, these flames. Always bending." },
      { speaker: 'Steward Guard', portrait: '/assets/char_guard.jpg', text: "Not that door, my lord. It sticks." },
      { speaker: 'Nakula', portrait: '/assets/char_twins.jpg', text: "This oil feels like butter." },
      { speaker: 'Sahadeva', portrait: '/assets/char_twins.jpg', text: "Ours at home never smelled like this." },
      { speaker: 'Arjuna', portrait: '/assets/char_arjuna.jpg', text: "The bolts are all outside. Strange for a guest house." }
    ];

    let lastIdx = -1;
    this.room2IdleBarkTimer = setInterval(() => {
      if (this.currentRoomId !== 2 || this.currentScene !== 'GATE_ROOM') return;
      let nextIdx = Math.floor(Math.random() * barks.length);
      if (nextIdx === lastIdx) nextIdx = (nextIdx + 1) % barks.length;
      lastIdx = nextIdx;
      const b = barks[nextIdx];
      const anchorMap: { [k: string]: { x: number; y: number } } = {
        'Oil-Bearer': { x: 70, y: 52 },
        'Lamp-Boy': { x: 20, y: 64 },
        'Steward Guard': { x: 94, y: 58 },
        'Nakula': { x: 28, y: 53 },
        'Sahadeva': { x: 28, y: 53 },
        'Arjuna': { x: 12, y: 56 }
      };
      const pos = anchorMap[b.speaker] || { x: 50, y: 50 };
      this.showSpeechBubble(pos.x, pos.y, b.speaker, b.portrait, b.text);
    }, 25000);
  }

  private stopRoom2IdleBarks() {
    if (this.room2IdleBarkTimer) {
      clearInterval(this.room2IdleBarkTimer);
      this.room2IdleBarkTimer = null;
    }
  }

  // =========================================================================
  // ROOM 2 LIVING SCENE SETUP (LAKSHAGRIHA GRAND CHAMBER)
  // =========================================================================
  private renderGrandChamberScene(revisit: boolean = false) {
    this.dom.interactiveScene.innerHTML = '';

    // 1. Purochana (Gallery Mezzanine / Patrol)
    this.createSceneActor({
      id: 'purochana',
      name: 'Purochana',
      role: 'Royal Architect',
      portrait: '/assets/char_purochana.jpg',
      x: 82,
      y: 20,
      onClick: (actor) => {
        const vig = GameState.getVigilanceState();
        if (vig === 'DANGER') {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "The hall is closed for the evening."
          );
        } else if (vig === 'SUSPICIOUS') {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "Please do not trouble yourself with the east side. It is being finished."
          );
        } else if (vig === 'WATCHFUL') {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "You are very curious about my work."
          );
        } else {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Purochana', actor.portrait,
            "Is something wrong with the walls, my prince?"
          );
        }
      }
    });

    // 2. Oil-Bearer (Woman, 40s)
    this.createSceneActor({
      id: 'oil_bearer',
      name: 'Oil-Bearer',
      role: 'Palace Servant',
      portrait: '/assets/room02_char_oilbearer.jpg',
      x: 74,
      y: 56,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Oil-Bearer', actor.portrait,
          "Mind the floor, my lord. We oiled it this morning."
        );
      }
    });

    // 3. Lamp-Boy (Boy, 12, trimming wicks)
    this.createSceneActor({
      id: 'lamp_boy',
      name: 'Lamp-Boy',
      role: 'Palace Servant',
      portrait: '/assets/room02_char_lampboy.jpg',
      x: 22,
      y: 56,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Lamp-Boy', actor.portrait,
          "They never stay straight, these flames. Always bending."
        );
      }
    });

    // 4. Steward Guard
    this.createSceneActor({
      id: 'steward_guard',
      name: 'Steward Guard',
      role: "Purochana's Sentry",
      portrait: '/assets/char_guard.jpg',
      x: 95,
      y: 58,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Steward Guard', actor.portrait,
          "Not that door, my lord. It sticks."
        );
      }
    });

    // If Bhima struck the door early, an extra guard stands at the east wall
    if (this.room2GuardStationedAtEastWall) {
      this.createSceneActor({
        id: 'steward_guard_east',
        name: 'Alerted Guard',
        role: "Stationed Sentry",
        portrait: '/assets/char_guard.jpg',
        x: 88,
        y: 44,
        onClick: (actor) => {
          this.showSpeechBubble(actor.x, actor.y - 12, 'Alerted Guard', actor.portrait,
            "The east wall is under inspection. Step back, my lord."
          );
        }
      });
    }

    // 5. Queen Mother Kunti
    this.createSceneActor({
      id: 'kunti',
      name: 'Queen Kunti',
      role: 'Mother of Pandavas',
      portrait: '/assets/char_kunti.jpg',
      x: 49,
      y: 64,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Queen Kunti', actor.portrait,
          "Listen, my son. The walls are not all the same."
        );
      }
    });

    // 6. Yudhishthira
    this.createSceneActor({
      id: 'yudhishthira',
      name: 'Yudhishthira',
      role: 'Eldest Pandava',
      portrait: '/assets/char_yudhishthira.jpg',
      x: 58,
      y: 50,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Yudhishthira', actor.portrait,
          "The drawing and the house. Do they agree?"
        );
      }
    });

    // 7. Bhima
    this.createSceneActor({
      id: 'bhima',
      name: 'Bhimasena',
      role: 'Second Pandava',
      portrait: '/assets/char_bhima.jpg',
      x: 40,
      y: 52,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Bhimasena', actor.portrait,
          "Let me break that door. Let me find what they hide."
        );
      }
    });

    // 8. Arjuna
    this.createSceneActor({
      id: 'arjuna',
      name: 'Arjuna',
      role: 'Master Archer',
      portrait: '/assets/char_arjuna.jpg',
      x: 13,
      y: 72,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Arjuna', actor.portrait,
          "The bolts are all outside. Strange for a guest house."
        );
      }
    });

    // 9. Nakula & Sahadeva
    this.createSceneActor({
      id: 'nakula_sahadeva',
      name: 'Nakula & Sahadeva',
      role: 'Twin Princes',
      portrait: '/assets/char_twins.jpg',
      x: 31,
      y: 72,
      onClick: (actor) => {
        this.showSpeechBubble(actor.x, actor.y - 12, 'Sahadeva', actor.portrait,
          "This oil feels like butter. Ours at home never smelled like this."
        );
      }
    });

    // 10. HOTSPOT: Surveyor's Drafting Table & Knotted Cord
    this.createSceneActor({
      id: 'plan_table',
      name: "Surveyor's Table",
      role: 'Architectural Plan',
      portrait: '/assets/room02_plan_table.jpg',
      x: 50,
      y: 84,
      onClick: () => {
        this.openSurveyorPlanTableCloseUp();
      }
    });

    // 11. HOTSPOT: East Wall Carved Lotus Frieze
    this.createSceneActor({
      id: 'east_wall',
      name: 'East Wall Frieze',
      role: 'Carved Lotus Plate',
      portrait: '/assets/room02_east_wall.jpg',
      x: 82,
      y: 50,
      onClick: () => {
        this.openEastWallKnockCloseUp();
      }
    });

    // 12. HOTSPOT: Outer Door Latch
    this.createSceneActor({
      id: 'door_latch',
      name: 'Outer Door Latch',
      role: 'Exterior Slide-Bolt',
      portrait: '/assets/room02_door_latch.jpg',
      x: 7,
      y: 48,
      onClick: () => {
        this.openDoorLatchCloseUp();
      }
    });

    // 13. HOTSPOT: Sandalwood Altar Chest (Red Herring)
    this.createSceneActor({
      id: 'camphor_chest',
      name: 'Altar Offering Chest',
      role: 'Camphor Cakes',
      portrait: '/assets/room02_jewelry_chest.jpg',
      x: 89,
      y: 72,
      onClick: () => {
        this.openJewelryChestCloseUp();
      }
    });

    // 14. HOTSPOT: Brass Brazier & Leaning Flame
    this.createSceneActor({
      id: 'brazier_oil',
      name: 'Brass Brazier',
      role: 'Leaning Flame',
      portrait: '/assets/room02_brazier_oil.jpg',
      x: 66,
      y: 72,
      onClick: () => {
        this.showSpeechBubble(66, 60, 'Observation', '/assets/room02_brazier_oil.jpg',
          "The flame persistently leans east toward the frieze, pulled by a subtle subterranean draft."
        );
      }
    });

    // 15. HOTSPOT: Concealed Subterranean Stairway (Revealed once panel is unlocked)
    if (this.room2PanelUnlocked) {
      this.createSceneActor({
        id: 'hidden_stair',
        name: 'Concealed Stairway',
        role: 'Descent to Cellar',
        portrait: '/assets/room02_hidden_stair.jpg',
        x: 76,
        y: 52,
        onClick: () => {
          this.openHiddenStairCloseUp();
        }
      });
    }
  }

  // =========================================================================
  // CLOSE-UP 1: SURVEYOR'S PLAN TABLE & KNOTTED CORD
  // =========================================================================
  public openSurveyorPlanTableCloseUp() {
    this.currentCloseUpObject = 'plan_table';
    AudioEngine.playParchmentRustle();
    this.dom.closeupImage.src = '/assets/room02_plan_table.jpg';
    this.dom.closeupObjectLabel.innerText = "SURVEYOR'S DRAFTING TABLE · 16 VS 12 KNOTS";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');

    this.dom.closeupWhisperText.innerText =
      "The drawing specifies 16 cord-lengths for the east hall. Pacing the chamber yields only 12. Exactly four units are missing.";

    this.renderPlanTableInteractiveLayer();
    this.dom.closeupModal.classList.remove('hidden');
  }

  private renderPlanTableInteractiveLayer() {
    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="plan-table-container">
        <div class="plan-header-title" style="font-family:var(--font-regal); font-size:1.1rem; color:#ffd700; letter-spacing:1px;">ARCHITECTURAL GROUND PLAN · SEVEN DOORS DRAFTED</div>
        <p class="plan-subtitle" style="font-size:0.85rem; color:#d8cbb5; margin:4px 0 12px 0;">Compare the drafted blueprint (16 knots) against the paced hall dimension (12 knots).</p>
        
        <div class="plan-measure-controls" style="display:flex; gap:12px; margin-bottom:12px;">
          <button id="btn-measure-plan" class="btn-subtle" style="border-color:#d4af37; color:#ffd700;">
            <span>📏 MEASURE DRAFTED WALL (16 KNOTS)</span>
          </button>
          <button id="btn-measure-hall" class="btn-subtle" style="border-color:#d4af37; color:#ffd700;">
            <span>👣 MEASURE PACED HALL (12 KNOTS)</span>
          </button>
        </div>

        <div class="plan-measurement-display" id="plan-measure-display" style="background:rgba(0,0,0,0.5); padding:10px 16px; border-radius:6px; font-size:0.88rem; width:100%; text-align:center;">
          ${this.room2MeasuredGap 
            ? '<span style="color:#ffd700; font-weight:bold;">✦ GAP IDENTIFIED: 16 (Plan) − 12 (Hall) = 4 Missing Knots! Concealed cavity mapped.</span>'
            : '<span>Select cord measurements to compute the architectural variance.</span>'
          }
        </div>

        <div class="plan-ink-action-row" style="margin-top:14px;">
          <button id="btn-ink-gap" class="btn-brush-enter ${this.room2MeasuredGap ? 'completed' : ''}">
            ${this.room2MeasuredGap ? '✓ HIDDEN CAVITY INKED IN FOLIO' : '✒ INK 4-LENGTH HOLLOW STRIP ON MAP'}
          </button>
        </div>

        <button id="btn-plan-back-hall" class="btn-subtle" style="margin-top:10px;">RETURN TO CHAMBER</button>
      </div>
    `;

    document.getElementById('btn-measure-plan')?.addEventListener('click', () => {
      AudioEngine.playCordTick();
      const display = document.getElementById('plan-measure-display');
      if (display) {
        display.innerHTML = `<strong>Surveyor's Drafted East Wall:</strong> Exactly <strong>16 cord knots</strong> from north pier to south corner.`;
      }
    });

    document.getElementById('btn-measure-hall')?.addEventListener('click', () => {
      AudioEngine.playCordTick();
      const display = document.getElementById('plan-measure-display');
      if (display) {
        display.innerHTML = `<strong>Paced Interior Chamber:</strong> Exactly <strong>12 cord knots</strong> between columns. <em>Missing: 4 knots.</em>`;
      }
    });

    document.getElementById('btn-ink-gap')?.addEventListener('click', () => {
      AudioEngine.playParchmentRustle();
      AudioEngine.playDiscoveryChime();
      this.room2MeasuredGap = true;
      GameState.setKnowledgeFlag('houseLayoutMapped', true);
      
      const display = document.getElementById('plan-measure-display');
      if (display) {
        display.innerHTML = `<span style="color:#ffd700; font-weight:bold;">✦ GAP CONFIRMED: 16 − 12 = 4 cord lengths! The eastern partition conceals a 4-length flue.</span>`;
      }

      const inkBtn = document.getElementById('btn-ink-gap');
      if (inkBtn) {
        inkBtn.innerText = '✓ HIDDEN CAVITY INKED IN FOLIO';
        inkBtn.classList.add('completed');
      }

      this.dom.closeupWhisperText.innerText =
        "✦ Floor plan mapped to Folio! The east wall hides a hollow four-length partition.";

      Tableau.addClueToTray({
        id: 'clue_door_count_mismatch',
        title: 'Door Count Mismatch (7 Drawn vs 5 Built)',
        type: 'SPATIAL EVIDENCE',
        desc: "The surveyor's folio blueprint marks 7 doors, but only 5 are built in the hall. Two portals are sealed."
      });
      Tableau.addClueToTray({
        id: 'clue_east_wall_strip',
        title: 'East Wall 4-Length Hollow Strip',
        type: 'SPATIAL EVIDENCE',
        desc: "Surveyor's plan measures 16 cord lengths; internal hall measures only 12. A 4-length hollow void exists behind the lotuses."
      });
      FolioSketchbook.renderStudy(2, true);
    });

    document.getElementById('btn-plan-back-hall')?.addEventListener('click', () => {
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
    });
  }

  // =========================================================================
  // CLOSE-UP 2: EAST WALL KNOCK VIEW (TACTILE ACOUSTIC RESONANCE)
  // =========================================================================
  public openEastWallKnockCloseUp() {
    this.currentCloseUpObject = 'east_wall';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/room02_east_wall.jpg';
    this.dom.closeupObjectLabel.innerText = "EAST WALL · CARVED LOTUS FRIEZE & ELEPHANTS";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');
    this.dom.closeupWhisperText.innerText =
      "Knock along the carved timber panels. Listen for where solid cedar yields to hollow resonance.";

    this.renderEastWallInteractiveLayer();
    this.dom.closeupModal.classList.remove('hidden');
  }

  private renderEastWallInteractiveLayer() {
    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="east-wall-knock-container" id="east-wall-knock-zones">
        <div class="knock-prompt-header" style="font-family:var(--font-regal); font-size:1.05rem; color:#ffd700; margin-bottom:12px;">TAP TIMBER PANELS TO TEST ACOUSTIC RESONANCE</div>

        <div class="knock-zones-grid" style="display:flex; justify-content:center; gap:14px; width:100%; max-width:680px;">
          <div class="knock-panel-zone" data-zone="1" style="flex:1; height:180px; background:rgba(40,25,18,0.7); border:1.5px solid rgba(212,175,55,0.4); border-radius:6px; cursor:pointer; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <span class="zone-label" style="font-size:0.75rem; color:#c7b299;">Panel I</span>
            <div class="zone-touch-target" style="font-size:1.1rem; margin-top:6px;">👊 TAP</div>
          </div>
          <div class="knock-panel-zone" data-zone="2" style="flex:1; height:180px; background:rgba(40,25,18,0.7); border:1.5px solid rgba(212,175,55,0.4); border-radius:6px; cursor:pointer; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <span class="zone-label" style="font-size:0.75rem; color:#c7b299;">Panel II</span>
            <div class="zone-touch-target" style="font-size:1.1rem; margin-top:6px;">👊 TAP</div>
          </div>
          <div class="knock-panel-zone hollow-strip-target" data-zone="3" title="Subtly wider timber strip" style="flex:1.2; height:180px; background:rgba(60,35,22,0.85); border:2px solid #ffd700; border-radius:6px; cursor:pointer; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <span class="zone-label" style="font-size:0.75rem; color:#ffd700; font-weight:bold;">Panel III (Lotus Frieze)</span>
            <div class="zone-touch-target" style="font-size:1.1rem; margin-top:6px; color:#ffd700;">🪷 TAP STRIP</div>
            <div class="subtle-draft-indicator" style="font-size:0.7rem; color:#a8e6cf; margin-top:4px;">💨 Draft</div>
          </div>
          <div class="knock-panel-zone" data-zone="4" style="flex:1; height:180px; background:rgba(40,25,18,0.7); border:1.5px solid rgba(212,175,55,0.4); border-radius:6px; cursor:pointer; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <span class="zone-label" style="font-size:0.75rem; color:#c7b299;">Panel IV</span>
            <div class="zone-touch-target" style="font-size:1.1rem; margin-top:6px;">👊 TAP</div>
          </div>
          <div class="knock-panel-zone" data-zone="5" style="flex:1; height:180px; background:rgba(40,25,18,0.7); border:1.5px solid rgba(212,175,55,0.4); border-radius:6px; cursor:pointer; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <span class="zone-label" style="font-size:0.75rem; color:#c7b299;">Panel V</span>
            <div class="zone-touch-target" style="font-size:1.1rem; margin-top:6px;">👊 TAP</div>
          </div>
        </div>

        <div class="knock-feedback-banner" id="knock-feedback-text" style="margin-top:14px; background:rgba(0,0,0,0.6); padding:10px 16px; border-radius:6px; font-size:0.88rem; width:100%; text-align:center;">
          ${this.room2KnockedHollow
            ? '<span style="color:#ffd700;">✦ Hollow cavity identified behind Panel III! Rotating brass lotus plate is exposed.</span>'
            : 'Click any carved panel to test its structural density.'
          }
        </div>

        <div class="lotus-shortcut-row" style="margin-top:16px; text-align:center;">
          <button id="btn-inspect-lotus-plate" class="btn-brush-enter ${this.room2KnockedHollow ? '' : 'faded'}">
            <span>🪷 EXAMINE ROTATING LOTUS PLATE →</span>
          </button>
          <button id="btn-knock-back-hall" class="btn-subtle" style="margin-left:10px;">STEP BACK</button>
        </div>
      </div>
    `;

    const zones = this.dom.closeupInteractiveLayer.querySelectorAll('.knock-panel-zone');
    zones.forEach((z) => {
      z.addEventListener('click', (e) => {
        const zoneNum = parseInt((z as HTMLElement).dataset.zone || '1', 10);
        this.triggerKnockRipple(z as HTMLElement, e as MouseEvent, zoneNum === 3);
      });
    });

    document.getElementById('btn-inspect-lotus-plate')?.addEventListener('click', () => {
      this.openLotusPlateCloseUp();
    });

    document.getElementById('btn-knock-back-hall')?.addEventListener('click', () => {
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
    });
  }

  private triggerKnockRipple(zoneEl: HTMLElement, evt: MouseEvent, isHollow: boolean) {
    const feedback = document.getElementById('knock-feedback-text');
    AudioEngine.playWallTap(isHollow);

    // Create tactile visual ripple
    const ripple = document.createElement('div');
    ripple.className = `knock-ripple-circle ${isHollow ? 'hollow' : 'dull'}`;
    const rect = zoneEl.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    zoneEl.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

    if (isHollow) {
      this.room2KnockedHollow = true;
      GameState.setKnowledgeFlag('knowsHollowFlues', true);
      if (feedback) {
        feedback.innerHTML = `<span style="color:#ffd700; font-weight:bold;">✦ (hollow knock) — Deep resonant chime! Behind Panel III lies a hollow chimney. A brass lotus plate is concealed beside the frame.</span>`;
      }
      this.dom.closeupWhisperText.innerText =
        "The wall rings hollow! A draft breathes past the lotus carving. The concealed lotus plate is unlocked for inspection.";

      Tableau.addClueToTray({
        id: 'clue_hollow_resonance',
        title: 'Hollow Resonance Behind Lotus Frieze',
        type: 'ACOUSTIC EVIDENCE',
        desc: "Panel III produces a low, resonant hollow ring. A concealed cavity connects directly to the foundation."
      });
    } else {
      if (feedback) {
        feedback.innerHTML = `<span>(dull knock) — Dense solid cedar. Muffled thud.</span>`;
      }
    }
  }

  // =========================================================================
  // CLOSE-UP 3: CONCEALED ROTATING LOTUS PLATE (COUNTERWEIGHT RELEASE)
  // =========================================================================
  public openLotusPlateCloseUp() {
    this.currentCloseUpObject = 'lotus_plate';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/room02_lotus_plate.jpg';
    this.dom.closeupObjectLabel.innerText = "BRASS LOTUS MEDALLION · 8 PETALS & ARROW GROOVE";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');
    this.dom.closeupWhisperText.innerText =
      "Eight brass petals within a notched rim. Petal #3 is noticeably elongated. A faint arrow groove is etched in the frame at 135°.";

    this.renderLotusPlateInteractiveLayer();
    this.dom.closeupModal.classList.remove('hidden');
  }

  private renderLotusPlateInteractiveLayer() {
    const angle = this.room2LotusAngle;
    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="lotus-plate-container" style="display:flex; flex-direction:column; align-items:center; background:rgba(20,15,10,0.92); border:2px solid var(--gold-regal); border-radius:12px; padding:20px; max-width:540px; margin:auto;">
        <div class="lotus-frame-header" style="font-family:var(--font-regal); font-size:1.1rem; color:#ffd700;">CONCEALED COUNTERWEIGHT RELEASE</div>
        <p class="lotus-frame-sub" style="font-size:0.85rem; color:#d8cbb5; margin:4px 0 14px 0; text-align:center;">Rotate the plate until the elongated petal (#3) aligns with the carved arrow groove (135°).</p>

        <div class="lotus-disc-assembly" style="position:relative; width:260px; height:260px; display:flex; justify-content:center; align-items:center;">
          <!-- Carved Frame Arrow Groove at 135° (pointing down-right) -->
          <svg class="lotus-fixed-frame-svg" viewBox="0 0 280 280" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
            <defs>
              <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#ffd700"/>
              </marker>
            </defs>
            <circle cx="140" cy="140" r="132" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="2"/>
            
            <!-- Fixed Frame Arrow etched at 135° -->
            <line x1="205" y1="205" x2="225" y2="225" stroke="#ffd700" stroke-width="3.5" marker-end="url(#arrowHead)"/>
            <text x="210" y="244" fill="#ffd700" font-size="10.5" font-family="var(--font-regal)" font-weight="bold">ARROW 135°</text>
          </svg>

          <!-- Rotating Lotus Disc -->
          <div class="lotus-rotating-disc" id="lotus-rotating-disc" style="transform: rotate(${angle}deg); width:230px; height:230px; border-radius:50%; cursor:grab;">
            <svg viewBox="0 0 240 240" class="lotus-svg" style="width:100%; height:100%;">
              <defs>
                <radialGradient id="brassGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#fff8db"/>
                  <stop offset="60%" stop-color="#d4af37"/>
                  <stop offset="100%" stop-color="#805a10"/>
                </radialGradient>
                <radialGradient id="longPetalGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#ffffff"/>
                  <stop offset="50%" stop-color="#ffd700"/>
                  <stop offset="100%" stop-color="#b8860b"/>
                </radialGradient>
              </defs>

              <!-- Central Brass Boss -->
              <circle cx="120" cy="120" r="110" fill="url(#brassGrad)" stroke="#5a3d0a" stroke-width="3"/>
              <circle cx="120" cy="120" r="32" fill="#5a3d0a" stroke="#ffd700" stroke-width="2"/>
              <circle cx="120" cy="120" r="10" fill="#ffd700"/>

              <!-- 8 Detent Notches on Rim -->
              ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                const rad = (deg - 90) * Math.PI / 180;
                const x1 = 120 + 104 * Math.cos(rad);
                const y1 = 120 + 104 * Math.sin(rad);
                const x2 = 120 + 110 * Math.cos(rad);
                const y2 = 120 + 110 * Math.sin(rad);
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#140f0c" stroke-width="3"/>`;
              }).join('')}

              <!-- 8 Carved Lotus Petals: Petal #3 (at 135°) is ELONGATED -->
              ${[0, 1, 2, 3, 4, 5, 6, 7].map(idx => {
                const deg = idx * 45;
                const isLong = idx === 3; // Petal 3 is the long petal!
                return `
                  <g transform="rotate(${deg} 120 120)">
                    <path d="${isLong ? 'M 112 120 C 104 70, 102 12, 120 4 C 138 12, 136 70, 128 120 Z' : 'M 113 120 C 106 85, 106 35, 120 25 C 134 35, 134 85, 127 120 Z'}"
                          fill="${isLong ? 'url(#longPetalGrad)' : '#b8860b'}"
                          stroke="#5a3d0a"
                          stroke-width="${isLong ? '2' : '1.2'}"/>
                    ${isLong ? '<circle cx="120" cy="18" r="4.5" fill="#fff" stroke="#800" stroke-width="1.2"/>' : ''}
                    ${isLong ? '<text x="120" y="55" font-size="8.5" fill="#5a3d0a" font-weight="bold" text-anchor="middle">LONGEST</text>' : ''}
                  </g>
                `;
              }).join('')}
            </svg>
          </div>
        </div>

        <div class="lotus-angle-status" style="margin-top:12px; font-size:0.88rem; color:#c7b299;">
          CURRENT ROTATION: <span id="lotus-deg-label" style="font-weight:bold; color:#ffd700;">${((angle % 360) + 360) % 360}°</span>
        </div>

        <!-- Tactile Rotation Step Buttons -->
        <div class="lotus-rotation-controls" style="display:flex; gap:10px; margin-top:12px;">
          <button id="btn-rot-m45" class="btn-subtle">⟲ −45°</button>
          <button id="btn-rot-m15" class="btn-subtle">⟲ −15°</button>
          <button id="btn-rot-p15" class="btn-subtle">⟳ +15°</button>
          <button id="btn-rot-p45" class="btn-subtle">⟳ +45°</button>
        </div>

        <div class="lotus-engage-row" style="margin-top:16px; text-align:center;">
          <button id="btn-engage-counterweight" class="btn-brush-enter">
            <span>⚙ ENGAGE COUNTERWEIGHT LATCH</span>
          </button>
          <button id="btn-lotus-back-hall" class="btn-subtle" style="margin-left:10px;">RETURN</button>
        </div>
      </div>
    `;

    document.getElementById('btn-rot-m45')?.addEventListener('click', () => this.rotateLotusPlate(-45));
    document.getElementById('btn-rot-m15')?.addEventListener('click', () => this.rotateLotusPlate(-15));
    document.getElementById('btn-rot-p15')?.addEventListener('click', () => this.rotateLotusPlate(15));
    document.getElementById('btn-rot-p45')?.addEventListener('click', () => this.rotateLotusPlate(45));

    document.getElementById('btn-engage-counterweight')?.addEventListener('click', () => {
      this.attemptEngageCounterweight();
    });

    document.getElementById('btn-lotus-back-hall')?.addEventListener('click', () => {
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
    });
  }

  public rotateLotusPlate(delta: number) {
    this.room2LotusAngle = (this.room2LotusAngle + delta) % 360;
    AudioEngine.playBrassNotchClick();

    const disc = document.getElementById('lotus-rotating-disc');
    const degLabel = document.getElementById('lotus-deg-label');
    const normalized = ((this.room2LotusAngle % 360) + 360) % 360;

    if (disc) {
      disc.style.transform = `rotate(${this.room2LotusAngle}deg)`;
    }
    if (degLabel) {
      degLabel.innerText = `${normalized}°`;
    }
  }

  public attemptEngageCounterweight() {
    const normalized = ((this.room2LotusAngle % 360) + 360) % 360;
    const isAligned = Math.abs(normalized - 135) <= 10 || normalized <= 10 || normalized >= 350;

    if (isAligned) {
      // SUCCESS!
      AudioEngine.playStoneSlide();
      this.room2PanelUnlocked = true;
      this.dom.closeupWhisperText.innerText =
        "✦ CLACK! The counterweight drops with a deep shudder. A blast of cold subterranean air pulls the lamp flames as the panel glides open!";
      
      setTimeout(() => {
        this.openHiddenStairCloseUp();
      }, 1600);
    } else {
      // Soft clunk, small puff of dust, no popup modal
      AudioEngine.playLatchSnap();
      this.dom.closeupWhisperText.innerText =
        "A soft clunk echoes inside the hollow timber. The counterweight does not release. The petal does not match the arrow groove.";
    }
  }

  // =========================================================================
  // CLOSE-UP 4: OUTER DOOR LATCH (ONE-WAY EXTERIOR DEAD-BOLT)
  // =========================================================================
  public openDoorLatchCloseUp() {
    this.currentCloseUpObject = 'door_latch';
    AudioEngine.playWoodCreak();
    this.dom.closeupImage.src = '/assets/room02_door_latch.jpg';
    this.dom.closeupObjectLabel.innerText = "CHAMBER OUTER DOOR LATCH · EXTERNAL DEAD-BOLT";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');
    this.dom.closeupWhisperText.innerText =
      "A massive forged iron slide-bolt is mounted exclusively on the OUTSIDE face of the frame. There is no release on the inside.";

    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="door-latch-view" style="background:rgba(20,15,10,0.95); border:2px solid var(--gold-regal); border-radius:12px; padding:24px; max-width:580px; margin:auto; text-align:center;">
        <div class="latch-title" style="font-family:var(--font-regal); font-size:1.1rem; color:#ffd700;">ONE-WAY EXTERNAL LOCK MECHANISM</div>
        <p class="latch-desc" style="font-size:0.85rem; color:#d8cbb5; margin:6px 0 16px 0;">Looking past the cedar door frame reveals a heavy iron slide-bolt mounted on the exterior face. Once thrown by Purochana's guards, the door cannot be opened from within.</p>
        
        <div style="margin:20px 0;">
          <button id="btn-test-bolt" class="btn-brush-enter">
            <span>🔒 TEST DOOR BOLT MOVEMENT</span>
          </button>
        </div>

        <div id="bolt-status-text" class="latch-feedback" style="background:rgba(0,0,0,0.5); padding:10px 14px; border-radius:6px; font-size:0.85rem;">
          Click above to test the forged iron bolt.
        </div>

        <button id="btn-latch-back-hall" class="btn-subtle" style="margin-top:16px;">RETURN TO CHAMBER</button>
      </div>
    `;

    document.getElementById('btn-test-bolt')?.addEventListener('click', () => {
      AudioEngine.playLatchSnap();
      GameState.setKnowledgeFlag('knowsExternalLock', true);
      const status = document.getElementById('bolt-status-text');
      if (status) {
        status.innerHTML = `<span style="color:#e05a47; font-weight:bold;">✦ [SCRAPE...] The bolt resists from without. Every portal can be sealed exclusively from the exterior corridor!</span>`;
      }
      this.dom.closeupWhisperText.innerText =
        "The bolts are all outside! Who locks guests in from without?";

      Tableau.addClueToTray({
        id: 'clue_outside_bolts',
        title: 'Exterior Iron Slide-Bolts',
        type: 'TRAP MECHANISM',
        desc: "All chamber doors are deadbolted from the outside corridor. The palace is engineered as an airtight pyre."
      });
    });

    document.getElementById('btn-latch-back-hall')?.addEventListener('click', () => {
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
    });

    this.dom.closeupModal.classList.remove('hidden');
  }

  // =========================================================================
  // CLOSE-UP 5: SANDALWOOD ALTAR CHEST (RED HERRING)
  // =========================================================================
  public openJewelryChestCloseUp() {
    this.currentCloseUpObject = 'camphor_chest';
    AudioEngine.playParchmentRustle();
    this.dom.closeupImage.src = '/assets/room02_jewelry_chest.jpg';
    this.dom.closeupObjectLabel.innerText = "SANDALWOOD ALTAR CHEST · AROMATIC OFFERINGS";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');
    this.dom.closeupWhisperText.innerText =
      "A cooling, pungent aroma of raw white camphor cakes wafts from the open altar box. Sweet incense smoke curls into the air.";

    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="camphor-chest-view" style="background:rgba(20,15,10,0.95); border:2px solid var(--gold-regal); border-radius:12px; padding:24px; max-width:580px; margin:auto; text-align:center;">
        <div class="chest-title" style="font-family:var(--font-regal); font-size:1.1rem; color:#ffd700;">SANDALWOOD OFFERING CHEST · PURE CAMPHOR</div>
        <p class="chest-desc" style="font-size:0.85rem; color:#d8cbb5; margin:6px 0 16px 0;">Square blocks of refined white camphor intended for evening temple aarti rituals. Highly volatile and flammable, yet purely ceremonial offerings.</p>
        
        <div class="camphor-tag-badge" style="display:inline-block; background:rgba(184,74,45,0.25); border:1px solid #b84a2d; color:#ff7b60; font-size:0.75rem; font-weight:bold; padding:4px 10px; border-radius:12px; margin-bottom:14px;">
          TAGGED: RED HERRING
        </div>

        <div style="margin:16px 0;">
          <button id="btn-inspect-camphor" class="btn-brush-enter">
            <span>📦 LOG CAMPHOR BLOCKS IN FOLIO</span>
          </button>
        </div>

        <div id="camphor-status" class="chest-feedback" style="font-size:0.85rem;"></div>

        <button id="btn-chest-back-hall" class="btn-subtle" style="margin-top:16px;">RETURN TO CHAMBER</button>
      </div>
    `;

    document.getElementById('btn-inspect-camphor')?.addEventListener('click', () => {
      AudioEngine.playDiscoveryChime();
      const status = document.getElementById('camphor-status');
      if (status) {
        status.innerHTML = `<span style="color:#d4af37;">✦ Logged in Folio: <strong>'Camphor, burns bright and fast'</strong> (Tagged RED HERRING).</span>`;
      }
      this.dom.closeupWhisperText.innerText =
        "Logged to Folio: Camphor blocks for evening aarti. Flammable, yet not the structural flue mechanism.";

      Tableau.addClueToTray({
        id: 'clue_camphor_cakes',
        title: 'Camphor, burns bright and fast',
        type: 'RED HERRING',
        desc: "Ceremonial camphor blocks for temple lamps. While highly flammable, this is not the secret structural mechanism."
      });
    });

    document.getElementById('btn-chest-back-hall')?.addEventListener('click', () => {
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
    });

    this.dom.closeupModal.classList.remove('hidden');
  }

  // =========================================================================
  // CLOSE-UP 6: CONCEALED SUBTERRANEAN STAIRWAY & BHIMA'S DECISION
  // =========================================================================
  public openHiddenStairCloseUp() {
    this.currentCloseUpObject = 'hidden_stair';
    AudioEngine.playFootstep();
    this.dom.closeupImage.src = '/assets/room02_hidden_stair.jpg';
    this.dom.closeupObjectLabel.innerText = "CONCEALED STAIRWAY · PASSAGE TO PALACE FOUNDATIONS";
    this.dom.btnInspectTallyShortcut.classList.add('hidden');
    this.dom.closeupWhisperText.innerText =
      "Cold air breathes up from the foundations. Cobwebs flutter in the subterranean draft.";

    this.dom.closeupInteractiveLayer.innerHTML = `
      <div class="hidden-stair-view" style="background:rgba(20,14,10,0.96); border:2px solid var(--gold-regal); border-radius:12px; padding:24px; max-width:620px; margin:auto; text-align:center;">
        <div class="stair-title" style="font-family:var(--font-regal); font-size:1.15rem; color:#ffd700;">THE CONCEALED SUBTERRANEAN DESCENT</div>
        <p class="stair-desc" style="font-size:0.88rem; color:#d8cbb5; margin:8px 0 20px 0;">A flight of damp stone steps vanishes into subterranean shadows. Bhima steps forward, muscles tensed: <em>'Let me break that door. Let me find what they hide.'</em></p>

        <div style="margin:24px 0;">
          <button id="btn-trigger-cellar-decision" class="btn-brush-enter">
            <span>⚖ CHOOSE COUNSEL (BHIMA'S URGE)</span>
          </button>
        </div>

        <button id="btn-stair-back-hall" class="btn-subtle" style="margin-top:16px;">RETURN TO CHAMBER</button>
      </div>
    `;

    document.getElementById('btn-trigger-cellar-decision')?.addEventListener('click', () => {
      this.triggerCellarDecision();
    });

    document.getElementById('btn-stair-back-hall')?.addEventListener('click', () => {
      this.dom.closeupModal.classList.add('hidden');
      this.currentCloseUpObject = null;
    });

    this.dom.closeupModal.classList.remove('hidden');
  }

  // Bhima & Cellar Door Canonical Decision
  public triggerCellarDecision() {
    AudioEngine.playDiscoveryChime();
    this.dom.decisionTitle.innerText = "Bhima and the Concealed Descent";
    this.dom.decisionDesc.innerText =
      "Bhima's knuckles crack as he steps before the dark flight of steps: 'Let me break that door. Let me find what they hide.' Yudhishthira counsels caution. What is your command?";

    this.dom.decisionOptions.innerHTML = `
      <button class="decision-choice-btn" id="btn-choice-restrain-bhima">
        <span class="choice-title">Restrain Bhima ('A caught snake bites once; a watched snake bites twice')</span>
        <span class="choice-consequence">Preserves secrecy (-10% Vigilance). Purochana relaxes, unaware his secret flues are discovered. Sets restrainedBhima.</span>
      </button>
      <button class="decision-choice-btn" id="btn-choice-strike-bhima">
        <span class="choice-title">Let Bhima Strike the Cellar Door</span>
        <span class="choice-consequence">Bhima kicks the door with thunderous force. Purochana rushes in alarmed, posting permanent guards (+25% Vigilance). Sets breakCellarEarly.</span>
      </button>
    `;

    document.getElementById('btn-choice-restrain-bhima')?.addEventListener('click', () => {
      this.dom.decisionModal.classList.add('hidden');
      this.room2DecisionMade = true;
      GameState.setKnowledgeFlag('restrainedBhima', true);
      GameState.setSuspicion(-10);
      this.dom.ambientTickerText.innerText = "Yudhishthira restrained Bhima with quiet wisdom. Purochana remains confident in his deception.";
      AudioEngine.triggerCaption("✦ [Bhima stands down · Purochana remains calm]");
      this.completeRoom2Breakthrough();
    });

    document.getElementById('btn-choice-strike-bhima')?.addEventListener('click', () => {
      this.dom.decisionModal.classList.add('hidden');
      this.room2DecisionMade = true;
      this.room2GuardStationedAtEastWall = true;
      GameState.setKnowledgeFlag('breakCellarEarly', true);
      GameState.setSuspicion(25);
      this.dom.ambientTickerText.innerText = "Bhima battered the cellar timber. Purochana arrived white-faced and posted sentries in the hall.";
      AudioEngine.triggerCaption("✦ [Bhima battered the door · Purochana alerted (+25% Vigilance)]");
      this.completeRoom2Breakthrough();
    });

    this.dom.decisionModal.classList.remove('hidden');
  }

  private completeRoom2Breakthrough() {
    this.dom.closeupModal.classList.add('hidden');
    this.currentCloseUpObject = null;
    FolioSketchbook.renderStudy(2, true);
    AudioEngine.playDiscoveryChime();

    // Show Room 2 Breakthrough screen
    this.dom.cinematicModal.classList.remove('hidden');
    const title = document.getElementById('cinematic-title');
    const text = document.getElementById('cinematic-text');
    const btn = document.getElementById('btn-cinematic-continue');

    if (title) title.innerText = "THE CONCEALED DESCENT UNLOCKED";
    if (text) text.innerText = "✦ The brass notches engaged. With a deep shudder and a burst of ancient cedar dust, the false wall glided aside. You have mapped the true layout of Lakshagriha. Ahead lies the chemical storage vault of Chamber 3.";
    if (btn) {
      btn.innerText = "DESCEND INTO THE SUBTERRANEAN VAULTS →";
      btn.onclick = () => {
        this.dom.cinematicModal.classList.add('hidden');
        alert("✦ CHAMBER 2 COMPLETE!\nYou have solved the Grand Chamber of Lakshagriha.\nTrue floor plan inked in Folio (Room 7 dependency secured).");
      };
    }
  }

  // =========================================================================
  // 4-TIER HINTS FOR ROOM 1 & ROOM 2
  // =========================================================================
  private updateRoom1HintUI() {
    const t1 = document.getElementById('hint-t1-text');
    const t2 = document.getElementById('hint-t2-text');
    const t3 = document.getElementById('hint-t3-text');
    const highlightBtn = document.getElementById('btn-highlight-tally');
    const showMeBtn = document.getElementById('btn-trigger-show-me');

    if (t1) t1.innerText = '"Three lines on the lid. Three things the city has been showing you."';
    if (t2) t2.innerText = '"Not every wagon is a part of the house. Compare what was promised with what was drawn. Look at what the gift\'s ring still hides."';
    if (t3) t3.innerText = '"Stamped wagons only. Folio minus the builder\'s word. Dark moons only. Write each in the merchant\'s marks, left to right."';
    if (highlightBtn) highlightBtn.innerText = "VIEW MERCHANT TALLY STONE";
    if (showMeBtn) showMeBtn.innerText = "SHOW ME WALKTHROUGH · DEMONSTRATE CIPHER";
  }

  private updateRoom2HintUI() {
    const t1 = document.getElementById('hint-t1-text');
    const t2 = document.getElementById('hint-t2-text');
    const t3 = document.getElementById('hint-t3-text');
    const highlightBtn = document.getElementById('btn-highlight-tally');
    const showMeBtn = document.getElementById('btn-trigger-show-me');

    if (t1) t1.innerText = '"A house is drawn before it is built. Does this one match its drawing?"';
    if (t2) t2.innerText = '"Count what the drawing promises and what the hall shows. The cord measures what the eye cannot."';
    if (t3) t3.innerText = '"One wall is thicker than it should be. Knock along it and listen for where the sound changes, then turn the lotus to follow the draft."';
    if (highlightBtn) highlightBtn.innerText = "HIGHLIGHT SURVEYOR'S TABLE";
    if (showMeBtn) showMeBtn.innerText = "SHOW ME WALKTHROUGH · UNSEAL EAST STAIR";
  }

  private triggerRoom2ShowMeWalkthrough() {
    this.dom.hintModal.classList.add('hidden');
    this.dom.closeupWhisperText.innerText = "✦ Vidura's disciple begins the Grand Chamber walkthrough...";

    // Step 1: Open plan table, measure 16 vs 12, ink gap
    setTimeout(() => {
      this.openSurveyorPlanTableCloseUp();
      this.dom.closeupWhisperText.innerText = "STEP 1: Measuring east wall: 16 knots on plan, 12 in hall. Difference = 4 knots.";
      AudioEngine.playCordTick();
    }, 800);

    setTimeout(() => {
      this.room2MeasuredGap = true;
      GameState.setKnowledgeFlag('houseLayoutMapped', true);
      this.dom.closeupWhisperText.innerText = "STEP 2: Inking 4-length hollow strip on the floor plan...";
      AudioEngine.playParchmentRustle();
    }, 3800);

    // Step 2: Open East Wall and tap zone 3 (hollow resonance)
    setTimeout(() => {
      this.openEastWallKnockCloseUp();
      const zone3 = document.querySelector('.knock-panel-zone[data-zone="3"]') as HTMLElement;
      if (zone3) {
        this.triggerKnockRipple(zone3, { clientX: 200, clientY: 100 } as any, true);
      }
      this.dom.closeupWhisperText.innerText = "STEP 3: Tapping Panel III: Resonant hollow ring! Draft felt.";
    }, 6200);

    // Step 3: Open Lotus plate, rotate to 135°, release counterweight
    setTimeout(() => {
      this.openLotusPlateCloseUp();
      this.rotateLotusPlate(135);
      this.dom.closeupWhisperText.innerText = "STEP 4: Rotating elongated petal #3 to align with 135° arrow groove...";
    }, 8500);

    setTimeout(() => {
      this.attemptEngageCounterweight();
      this.dom.closeupWhisperText.innerText = "STEP 5: Counterweight engaged! False timber panel glides open.";
      FolioSketchbook.renderStudy(2, true);
    }, 10500);
  }
}

// Instantiate and kick off application
function initApp() {
  const app = new ChakravyuhaApp();
  (window as any).app = app;
  app.init();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
