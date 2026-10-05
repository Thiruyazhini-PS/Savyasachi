/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Physical Clue Deduction Tableau & Dynamic Ink Yarn System
 * ==========================================================================
 */

import { ClueDefinition } from '../types';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/SpatialAudio';

interface BoardCard {
  id: string;
  title: string;
  type: string;
  desc: string;
  x: number;
  y: number;
  element: HTMLElement;
}

export class DeductionBoard {
  private static instance: DeductionBoard;

  private workspace: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private cardsLayer: HTMLElement | null = null;
  private trayContainer: HTMLElement | null = null;
  private emptyHint: HTMLElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private hypothesisSelect: HTMLSelectElement | null = null;
  private btnSynthesize: HTMLButtonElement | null = null;
  private countDisplay: HTMLElement | null = null;
  private stringsCounter: HTMLElement | null = null;
  private eurekaBadge: HTMLElement | null = null;
  private feedbackCard: HTMLElement | null = null;

  private availableClues: Map<string, ClueDefinition> = new Map();
  private cards: BoardCard[] = [];
  private connections: Array<[string, string]> = [];
  private activeDragCard: BoardCard | null = null;
  private dragOffset = { x: 0, y: 0 };
  private connectingFromCardId: string | null = null;

  private constructor() {}

  public static getInstance(): DeductionBoard {
    if (!DeductionBoard.instance) {
      DeductionBoard.instance = new DeductionBoard();
    }
    return DeductionBoard.instance;
  }

  public init() {
    this.workspace = document.getElementById('board-workspace');
    this.canvas = document.getElementById('deduction-canvas') as HTMLCanvasElement;
    this.cardsLayer = document.getElementById('board-cards-layer');
    this.trayContainer = document.getElementById('board-evidence-tray');
    this.emptyHint = document.getElementById('deduction-empty-hint');
    this.hypothesisSelect = document.getElementById('deduction-hypothesis-select') as HTMLSelectElement;
    this.btnSynthesize = document.getElementById('btn-synthesize') as HTMLButtonElement;
    this.countDisplay = document.getElementById('deduction-count');
    this.stringsCounter = document.getElementById('deduction-strings-counter');
    this.eurekaBadge = document.getElementById('deduction-eureka');
    this.feedbackCard = document.getElementById('deduction-feedback');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.bindEvents();
    this.loadPersistedState();
    this.updateBadgesAndCounters();
  }

  public resizeCanvas() {
    if (!this.workspace || !this.canvas) return;
    this.canvas.width = this.workspace.clientWidth;
    this.canvas.height = this.workspace.clientHeight;
    this.renderThreads();
  }

  private bindEvents() {
    if (!this.workspace) return;

    // Board Mouse Move (dragging card or thread)
    this.workspace.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.activeDragCard && this.workspace) {
        const rect = this.workspace.getBoundingClientRect();
        const x = Math.max(10, Math.min(rect.width - 206, e.clientX - rect.left - this.dragOffset.x));
        const y = Math.max(10, Math.min(rect.height - 180, e.clientY - rect.top - this.dragOffset.y));

        this.activeDragCard.element.style.left = `${x}px`;
        this.activeDragCard.element.style.top = `${y}px`;
        this.activeDragCard.x = x;
        this.activeDragCard.y = y;

        this.renderThreads();
      } else if (this.connectingFromCardId) {
        this.renderThreads(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.activeDragCard) {
        this.activeDragCard = null;
        this.savePersistedState();
      }
      if (this.connectingFromCardId) {
        this.connectingFromCardId = null;
        this.renderThreads();
      }
    });

    // Clear Yarn Threads
    document.getElementById('btn-clear-yarn')?.addEventListener('click', () => {
      AudioEngine.playInkClick();
      this.connections = [];
      this.savePersistedState();
      this.renderThreads();
      this.updateBadgesAndCounters();
      this.evaluateHypothesisReadiness();
    });

    // Hypothesis Select Change
    this.hypothesisSelect?.addEventListener('change', () => {
      this.evaluateHypothesisReadiness();
      if (this.feedbackCard) {
        this.feedbackCard.classList.add('hidden');
        this.feedbackCard.innerHTML = '';
      }
    });

    // Synthesize Deduction Button
    this.btnSynthesize?.addEventListener('click', () => {
      this.executeSynthesis();
    });
  }

  public addClueToTray(clue: ClueDefinition) {
    if (!this.availableClues.has(clue.id)) {
      this.availableClues.set(clue.id, clue);
      this.renderTray();
      this.updateBadgesAndCounters();
    }
  }

  public renderTray() {
    if (!this.trayContainer) return;
    this.trayContainer.innerHTML = '';

    const boardCardIds = new Set(this.cards.map((c) => c.id));

    this.availableClues.forEach((clue) => {
      if (!boardCardIds.has(clue.id)) {
        const item = document.createElement('div');
        item.className = 'tray-card';
        item.draggable = true;
        item.title = `Drag or click to place "${clue.title}" on the board`;
        item.innerHTML = `
          <div class="tray-card-icon">${clue.icon || '📜'}</div>
          <div class="tray-card-info">
            <div class="tray-card-type">${clue.type}</div>
            <div class="tray-card-title">${clue.title}</div>
          </div>
        `;

        // Click or Drag to place on board
        item.addEventListener('click', () => {
          this.placeClueOnBoard(clue);
        });

        item.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', clue.id);
        });

        this.trayContainer?.appendChild(item);
      }
    });

    // Workspace Drag-and-Drop listener
    if (this.workspace && !(this.workspace as any)._hasTrayDropBound) {
      (this.workspace as any)._hasTrayDropBound = true;
      this.workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      this.workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        const clueId = e.dataTransfer?.getData('text/plain');
        if (clueId && this.availableClues.has(clueId)) {
          const clue = this.availableClues.get(clueId)!;
          const rect = this.workspace!.getBoundingClientRect();
          const dropX = Math.max(20, Math.min(rect.width - 200, e.clientX - rect.left - 80));
          const dropY = Math.max(20, Math.min(rect.height - 180, e.clientY - rect.top - 30));
          this.placeClueOnBoard(clue, dropX, dropY);
        }
      });
    }
  }

  public placeClueOnBoard(clue: ClueDefinition, defaultX?: number, defaultY?: number) {
    if (this.cards.some((c) => c.id === clue.id) || !this.cardsLayer) return;

    AudioEngine.playPaperTurn();

    const col = this.cards.length % 3;
    const row = Math.floor(this.cards.length / 3);
    const startX = defaultX ?? (50 + col * 220 + (Math.random() * 20 - 10));
    const startY = defaultY ?? (40 + row * 160 + (Math.random() * 20 - 10));

    const el = document.createElement('div');
    el.className = 'evidence-card';
    el.id = `card_${clue.id}`;
    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;

    el.innerHTML = `
      <div class="evidence-card-pin" title="Drag thread to link evidence" data-card-id="${clue.id}"></div>
      <button class="evidence-card-remove" title="Return clue to tray" aria-label="Remove">✕</button>
      <div class="evidence-card-badge">
        <span class="evidence-card-icon">${clue.icon || '📜'}</span>
        <span class="evidence-card-type">${clue.type}</span>
      </div>
      <div class="evidence-card-title">${clue.title}</div>
      <div class="evidence-card-desc">${clue.desc}</div>
      <div class="evidence-connector-dot" title="Drag thread to link evidence" data-card-id="${clue.id}"></div>
    `;

    const cardObj: BoardCard = {
      id: clue.id,
      title: clue.title,
      type: clue.type,
      desc: clue.desc,
      x: startX,
      y: startY,
      element: el,
    };

    // Remove button handler
    const removeBtn = el.querySelector('.evidence-card-remove');
    removeBtn?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.removeCardFromBoard(clue.id);
    });

    // Start thread dragging from either pin or connector dot
    const startLink = (e: MouseEvent) => {
      e.stopPropagation();
      this.connectingFromCardId = clue.id;
      AudioEngine.playInkClick();
    };

    const pin = el.querySelector('.evidence-card-pin');
    const dot = el.querySelector('.evidence-connector-dot');

    pin?.addEventListener('mousedown', startLink as EventListener);
    dot?.addEventListener('mousedown', startLink as EventListener);

    // Drop thread to link clues
    const finishLink = (e: Event) => {
      if (this.connectingFromCardId && this.connectingFromCardId !== clue.id) {
        e.stopPropagation();
        this.addConnection(this.connectingFromCardId, clue.id);
        this.connectingFromCardId = null;
      }
    };

    pin?.addEventListener('mouseup', finishLink);
    dot?.addEventListener('mouseup', finishLink);
    el.addEventListener('mouseup', finishLink);

    // Card movement
    el.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.classList.contains('evidence-connector-dot') ||
        target.classList.contains('evidence-card-pin') ||
        target.classList.contains('evidence-card-remove')
      ) {
        return;
      }
      this.activeDragCard = cardObj;
      const cardRect = el.getBoundingClientRect();
      this.dragOffset.x = e.clientX - cardRect.left;
      this.dragOffset.y = e.clientY - cardRect.top;
      this.cardsLayer?.appendChild(el); // Bring to top
    });

    this.cardsLayer.appendChild(el);
    this.cards.push(cardObj);

    this.emptyHint?.classList.add('hidden');
    this.renderTray();
    this.updateBadgesAndCounters();
    this.renderThreads();
    this.savePersistedState();
    this.evaluateHypothesisReadiness();
  }

  public removeCardFromBoard(cardId: string) {
    const cardIndex = this.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const card = this.cards[cardIndex];
    card.element.remove();
    this.cards.splice(cardIndex, 1);

    // Remove any connections involving this card
    this.connections = this.connections.filter(
      ([c1, c2]) => c1 !== cardId && c2 !== cardId
    );

    AudioEngine.playPaperTurn();

    if (this.cards.length === 0) {
      this.emptyHint?.classList.remove('hidden');
    }

    this.renderTray();
    this.updateBadgesAndCounters();
    this.renderThreads();
    this.savePersistedState();
    this.evaluateHypothesisReadiness();
  }

  public addConnection(c1Id: string, c2Id: string) {
    const exists = this.connections.some(
      (c) => (c[0] === c1Id && c[1] === c2Id) || (c[0] === c2Id && c[1] === c1Id)
    );
    if (!exists) {
      this.connections.push([c1Id, c2Id]);
      AudioEngine.playWallTap(true);
      AudioEngine.triggerCaption("✦ [Red yarn thread pinned between clues]");
      this.updateBadgesAndCounters();
      this.evaluateHypothesisReadiness();
      this.savePersistedState();

      // Brush animation on new thread
      this.startBrushAnimation(c1Id, c2Id);
    }
  }

  private startBrushAnimation(c1Id: string, c2Id: string) {
    const startTime = performance.now();
    const duration = 240;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      this.renderThreads(null, { c1Id, c2Id, progress });
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.renderThreads();
      }
    };
    requestAnimationFrame(step);
  }

  public renderThreads(
    mouseEvent: MouseEvent | null = null,
    animatingLink: { c1Id: string; c2Id: string; progress: number } | null = null
  ) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Existing threads with catenary sag & rich yarn texture
    this.connections.forEach(([c1Id, c2Id]) => {
      const c1 = this.cards.find((c) => c.id === c1Id);
      const c2 = this.cards.find((c) => c.id === c2Id);
      if (c1 && c2) {
        // Pin centers (top of card)
        const x1 = c1.x + 98;
        const y1 = c1.y;
        const x2 = c2.x + 98;
        const y2 = c2.y;

        const dist = Math.hypot(x2 - x1, y2 - y1);
        const sag = Math.min(50, 14 + dist * 0.08);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 + sag;

        const isAnimating = animatingLink && animatingLink.c1Id === c1Id && animatingLink.c2Id === c2Id;
        const p = isAnimating ? animatingLink.progress : 1;

        const q1x = (1 - p) * x1 + p * midX;
        const q1y = (1 - p) * y1 + p * midY;
        const q2x = (1 - p) * (1 - p) * x1 + 2 * (1 - p) * p * midX + p * p * x2;
        const q2y = (1 - p) * (1 - p) * y1 + 2 * (1 - p) * p * midY + p * p * y2;

        // 1. Soft Shadow on Corkboard
        ctx.save();
        ctx.shadowColor = 'rgba(50, 30, 15, 0.35)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 4;

        // 2. Base Red Yarn
        ctx.strokeStyle = '#b84a2d';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(q1x, q1y, q2x, q2y);
        ctx.stroke();
        ctx.restore();

        // 3. Highlight Twist Strand
        ctx.strokeStyle = '#d96c50';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(q1x, q1y, q2x, q2y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Brass Pin Heads
        this.drawPinHead(ctx, x1, y1);
        if (p >= 0.9) {
          this.drawPinHead(ctx, x2, y2);
        }
      }
    });

    // In-progress dynamic thread when dragging
    if (this.connectingFromCardId && mouseEvent && this.workspace) {
      const fromCard = this.cards.find((c) => c.id === this.connectingFromCardId);
      if (fromCard) {
        const rect = this.workspace.getBoundingClientRect();
        const startX = fromCard.x + 98;
        const startY = fromCard.y;
        const targetX = mouseEvent.clientX - rect.left;
        const targetY = mouseEvent.clientY - rect.top;

        ctx.strokeStyle = '#b84a2d';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        this.drawPinHead(ctx, startX, startY);
      }
    }
  }

  private drawPinHead(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.shadowColor = 'rgba(30, 15, 5, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 6);
    grad.addColorStop(0, '#fff4cc');
    grad.addColorStop(0.35, '#e5b94c');
    grad.addColorStop(0.8, '#996f1b');
    grad.addColorStop(1, '#573d0a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public getUnlinkedCardsCount(): number {
    const linkedSet = new Set<string>();
    this.connections.forEach(([c1, c2]) => {
      linkedSet.add(c1);
      linkedSet.add(c2);
    });
    // Cards on board not yet linked + cards in tray
    const unlinkedOnBoard = this.cards.filter((c) => !linkedSet.has(c.id)).length;
    const trayCount = Array.from(this.availableClues.keys()).filter(
      (id) => !this.cards.some((c) => c.id === id)
    ).length;
    return unlinkedOnBoard + trayCount;
  }

  public updateBadgesAndCounters() {
    const unlinked = this.getUnlinkedCardsCount();
    const badge = document.getElementById('deduction-badge');
    if (badge) {
      badge.innerText = `${unlinked}`;
      badge.classList.toggle('hidden', unlinked === 0);
    }

    if (this.stringsCounter) {
      this.stringsCounter.innerText = `Strings: ${this.connections.length}`;
    }

    if (this.countDisplay) {
      const synthesized = GameState.synthesizedDeductions.size;
      this.countDisplay.innerText = `${synthesized} Formed`;
    }
  }

  private evaluateHypothesisReadiness() {
    const val = this.hypothesisSelect?.value;
    if (!val || this.cards.length < 2) {
      if (this.btnSynthesize) this.btnSynthesize.disabled = true;
      this.eurekaBadge?.classList.add('hidden');
      return;
    }

    if (this.btnSynthesize) this.btnSynthesize.disabled = false;
    if (this.connections.length >= 1) {
      this.eurekaBadge?.classList.remove('hidden');
    } else {
      this.eurekaBadge?.classList.add('hidden');
    }
  }

  public areConnected(id1: string, id2: string): boolean {
    return this.connections.some(
      (c) => (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1)
    );
  }

  public executeSynthesis() {
    const selectedHypothesis = this.hypothesisSelect?.value;
    if (!selectedHypothesis || !this.feedbackCard) return;

    this.feedbackCard.classList.remove('hidden');

    if (selectedHypothesis === 'fire_trap') {
      // Check if player has placed key incendiary clues and linked them
      const cardIds = new Set(this.cards.map((c) => c.id));
      const hasMaterials = cardIds.has('clue_crate_resins') || cardIds.has('clue_lac_pillars') || cardIds.has('clue_crude_oil');
      const hasCipherOrTally = cardIds.has('clue_tally_stone') || cardIds.has('clue_copper_disc') || cardIds.has('item_copper_disc');
      const hasAnyLink = this.connections.length >= 1;

      if (hasMaterials && hasCipherOrTally && hasAnyLink) {
        // Valid conclusion reached!
        AudioEngine.playDiscoveryChime();
        AudioEngine.triggerDramaticSilence(2.0);

        GameState.synthesizedDeductions.add('DEDUCTION_FIRE_TRAP');
        GameState.unlockKnowledge('knowsHouseIsDangerous');
        GameState.unlockKnowledge('knowsCombustibleMaterials');

        this.feedbackCard.className = 'deduction-feedback-card success';
        this.feedbackCard.innerHTML = `
          <strong>✦ DEDUCTION CONFIRMED: THE ARCHITECT'S PYRE</strong>
          <p style="margin: 4px 0 0 0;">
            The evidence converges indisputably. Cedar timber steeped in volatile shellac and sealed with crude bitumen: Lakshagriha is not a palace of rest, but an engineered incinerator built to consume without iron.
          </p>
        `;
        AudioEngine.triggerCaption("✦ [Deduction Confirmed: Lakshagriha is an engineered fire trap]");
      } else {
        // Soft, respectful, non-shaming guidance
        AudioEngine.playPaperTurn();
        this.feedbackCard.className = 'deduction-feedback-card gentle-nudge';
        this.feedbackCard.innerHTML = `
          <strong>❧ OBSERVATION NOTED</strong>
          <p style="margin: 4px 0 0 0;">
            The hypothesis is astute, but the yarn threads currently woven on the parchment do not yet link the physical materials (the resin crate) with the cipher coordinates. Draw a thread between them to substantiate the deduction.
          </p>
        `;
      }
    } else if (selectedHypothesis === 'safe_residence') {
      AudioEngine.playPaperTurn();
      this.feedbackCard.className = 'deduction-feedback-card gentle-nudge';
      this.feedbackCard.innerHTML = `
        <strong>❧ CONSIDER THE ANOMALIES</strong>
        <p style="margin: 4px 0 0 0;">
          While timber coating resists moisture, it leaves unexplained the high proportion of boiled shellac and the secret porcupine talisman warning of subterranean escape. The risk remains unmitigated.
        </p>
      `;
    } else if (selectedHypothesis === 'festival_display') {
      AudioEngine.playPaperTurn();
      this.feedbackCard.className = 'deduction-feedback-card gentle-nudge';
      this.feedbackCard.innerHTML = `
        <strong>❧ CONSIDER THE ANOMALIES</strong>
        <p style="margin: 4px 0 0 0;">
          The spring festival celebrated along the Ganga features marigolds and conch blasts, yet the wagons conceal structural bitumen rather than festive powders. The architectural placement suggests deliberate immolation.
        </p>
      `;
    }

    this.updateBadgesAndCounters();
    this.savePersistedState();

    const evt = new CustomEvent('deduction-synthesized', { detail: { count: GameState.synthesizedDeductions.size } });
    window.dispatchEvent(evt);
  }

  private savePersistedState() {
    try {
      const data = {
        cards: this.cards.map((c) => ({ id: c.id, x: c.x, y: c.y })),
        connections: this.connections,
        synthesized: Array.from(GameState.synthesizedDeductions),
        selectedHypothesis: this.hypothesisSelect?.value || '',
      };
      localStorage.setItem('chakravyuha_deduction_state', JSON.stringify(data));
    } catch (_) {}
  }

  private loadPersistedState() {
    try {
      // Default initial clues if empty
      const defaultClues: ClueDefinition[] = [
        {
          id: 'clue_crate_resins',
          title: 'Cedar Crate of Shellac & Bitumen',
          type: 'MATERIAL',
          desc: 'Wagons carrying volatile naphtha and raw lac under festival canvas.',
          icon: '📦',
          roomId: 0,
        },
        {
          id: 'clue_tally_stone',
          title: 'Merchant Tally Tablet',
          type: 'CIPHER',
          desc: 'Count notches establishing numerical equivalence: २=2, ४=4, ७=7.',
          icon: '🪨',
          roomId: 0,
        },
        {
          id: 'clue_copper_disc',
          title: 'Vidura’s Porcupine Talisman',
          type: 'ENIGMA',
          desc: 'Quill points to subterranean salvation: only burrowing creatures survive fire.',
          icon: '🪙',
          roomId: 0,
        }
      ];

      defaultClues.forEach((c) => this.availableClues.set(c.id, c));

      const saved = localStorage.getItem('chakravyuha_deduction_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.cards)) {
          parsed.cards.forEach((savedCard: { id: string; x: number; y: number }) => {
            const def = this.availableClues.get(savedCard.id);
            if (def) {
              this.placeClueOnBoard(def, savedCard.x, savedCard.y);
            }
          });
        }
        if (Array.isArray(parsed.connections)) {
          this.connections = parsed.connections;
        }
        if (Array.isArray(parsed.synthesized)) {
          parsed.synthesized.forEach((s: string) => GameState.synthesizedDeductions.add(s));
        }
        if (parsed.selectedHypothesis && this.hypothesisSelect) {
          this.hypothesisSelect.value = parsed.selectedHypothesis;
        }
      }

      this.renderTray();
      if (this.cards.length === 0) {
        this.emptyHint?.classList.remove('hidden');
      } else {
        this.emptyHint?.classList.add('hidden');
      }

      this.renderThreads();
      this.updateBadgesAndCounters();
    } catch (_) {}
  }
}

export const Tableau = DeductionBoard.getInstance();
