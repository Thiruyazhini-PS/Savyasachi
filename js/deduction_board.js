/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Physical Investigation Tableau & Ink Deduction Board
 * ==========================================================================
 */

class DeductionBoard {
  constructor() {
    this.modal = document.getElementById('deduction-board-modal');
    this.workspace = document.getElementById('board-workspace');
    this.canvas = document.getElementById('deduction-canvas');
    this.cardsLayer = document.getElementById('board-cards-layer');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.btnSynthesize = document.getElementById('btn-synthesize');
    this.countDisplay = document.getElementById('deduction-count');
    this.eurekaBadge = document.getElementById('deduction-eureka');

    this.cards = []; // Discovered evidence cards
    this.connections = []; // Array of [cardId1, cardId2]
    this.activeDragCard = null;
    this.dragOffset = { x: 0, y: 0 };
    this.connectingFromCardId = null;

    this.discoveredDeductions = new Set();
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.getElementById('deduction-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindEvents();
  }

  resizeCanvas() {
    if (!this.workspace || !this.canvas) return;
    this.canvas.width = this.workspace.clientWidth;
    this.canvas.height = this.workspace.clientHeight;
    this.renderThreads();
  }

  bindEvents() {
    // Canvas mouse interactions for dragging connections
    this.workspace.addEventListener('mousemove', (e) => {
      if (this.activeDragCard) {
        const rect = this.workspace.getBoundingClientRect();
        const x = Math.max(10, Math.min(rect.width - 200, e.clientX - rect.left - this.dragOffset.x));
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
      this.activeDragCard = null;
      if (this.connectingFromCardId) {
        this.connectingFromCardId = null;
        this.renderThreads();
      }
    });

    // Clear connections
    document.getElementById('btn-clear-connections')?.addEventListener('click', () => {
      this.connections = [];
      this.checkDeductionPossibilities();
      this.renderThreads();
    });

    // Synthesize button
    this.btnSynthesize?.addEventListener('click', () => {
      this.executeSynthesis();
    });
  }

  // Add evidence to the board when inspected
  addEvidenceCard(clueData) {
    if (this.cards.some(c => c.id === clueData.id)) return; // Already on board

    const rect = this.workspace ? this.workspace.getBoundingClientRect() : { width: 800, height: 500 };
    // Distribute cards with slight random jitter
    const col = this.cards.length % 3;
    const row = Math.floor(this.cards.length / 3);
    const startX = 60 + col * 240 + (Math.random() * 20 - 10);
    const startY = 50 + row * 180 + (Math.random() * 20 - 10);

    const cardObj = {
      id: clueData.id,
      title: clueData.title,
      type: clueData.type,
      desc: clueData.desc,
      x: startX,
      y: startY,
      element: null
    };

    // Create DOM card element
    const el = document.createElement('div');
    el.className = 'evidence-card';
    el.id = `card_${clueData.id}`;
    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;

    el.innerHTML = `
      <div class="evidence-card-pin"></div>
      <div class="evidence-card-type">${clueData.type}</div>
      <div class="evidence-card-title">${clueData.title}</div>
      <div class="evidence-card-desc">${clueData.desc}</div>
      <div class="evidence-connector-dot" title="Drag thread to another evidence card" data-card-id="${clueData.id}"></div>
    `;

    // Dragging listeners
    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('evidence-connector-dot')) {
        e.stopPropagation();
        this.connectingFromCardId = clueData.id;
        return;
      }
      this.activeDragCard = cardObj;
      const cardRect = el.getBoundingClientRect();
      this.dragOffset.x = e.clientX - cardRect.left;
      this.dragOffset.y = e.clientY - cardRect.top;
      // Bring to front
      this.cardsLayer.appendChild(el);
    });

    // Connector dot drop target
    const dot = el.querySelector('.evidence-connector-dot');
    dot.addEventListener('mouseup', (e) => {
      e.stopPropagation();
      if (this.connectingFromCardId && this.connectingFromCardId !== clueData.id) {
        this.addConnection(this.connectingFromCardId, clueData.id);
        this.connectingFromCardId = null;
      }
    });

    this.cardsLayer.appendChild(el);
    cardObj.element = el;
    this.cards.push(cardObj);

    // Update deduction badge in HUD
    const badge = document.getElementById('deduction-badge');
    if (badge) badge.innerText = this.cards.length;

    this.renderThreads();
  }

  // Add thread connection between two cards
  addConnection(cardId1, cardId2) {
    const exists = this.connections.some(c => 
      (c[0] === cardId1 && c[1] === cardId2) || (c[0] === cardId2 && c[1] === cardId1)
    );
    if (!exists) {
      this.connections.push([cardId1, cardId2]);
      if (window.StoryAudio) window.StoryAudio.playWallTap(true);
      this.checkDeductionPossibilities();
      this.renderThreads();
    }
  }

  // Draw the red yarn / ink threads connecting cards
  renderThreads(mouseEvent = null) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render existing established threads
    this.connections.forEach(([c1Id, c2Id]) => {
      const c1 = this.cards.find(c => c.id === c1Id);
      const c2 = this.cards.find(c => c.id === c2Id);
      if (c1 && c2) {
        const x1 = c1.x + 95;
        const y1 = c1.y + 160;
        const x2 = c2.x + 95;
        const y2 = c2.y + 160;

        // Draw crimped red yarn
        ctx.strokeStyle = '#c92a2a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 + 25; // gravity sag
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Pin dots
        ctx.fillStyle = '#fcc419';
        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render in-progress connecting line
    if (this.connectingFromCardId && mouseEvent) {
      const fromCard = this.cards.find(c => c.id === this.connectingFromCardId);
      if (fromCard) {
        const rect = this.workspace.getBoundingClientRect();
        const startX = fromCard.x + 95;
        const startY = fromCard.y + 160;
        const targetX = mouseEvent.clientX - rect.left;
        const targetY = mouseEvent.clientY - rect.top;

        ctx.strokeStyle = '#e03131';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Check if player has physically connected a lethal truth
  checkDeductionPossibilities() {
    // Recipe 1: Lac Pillars + Crude Oil + Lac Mats = Extreme Fire Trap
    const hasLac = this.cards.some(c => c.id === 'clue_lac_pillars');
    const hasOil = this.cards.some(c => c.id === 'clue_crude_oil');
    const hasMats = this.cards.some(c => c.id === 'clue_lac_mats');

    const connectedOilLac = this.areCardsConnected('clue_lac_pillars', 'clue_crude_oil');
    const connectedLacMats = this.areCardsConnected('clue_crude_oil', 'clue_lac_mats') || this.areCardsConnected('clue_lac_pillars', 'clue_lac_mats');

    if (hasLac && hasOil && hasMats && connectedOilLac && connectedLacMats) {
      if (!this.discoveredDeductions.has('DEDUCTION_FIRE_TRAP')) {
        this.btnSynthesize.disabled = false;
        this.eurekaBadge.classList.remove('hidden');
        return;
      }
    }

    // Recipe 2: Isolated Palace + Target Date = Orchestrated Ambush
    const connectedIsolationDate = this.areCardsConnected('clue_isolated_palace', 'clue_fire_date');
    if (connectedIsolationDate && !this.discoveredDeductions.has('DEDUCTION_AMBUSH_DATE')) {
      this.btnSynthesize.disabled = false;
      this.eurekaBadge.classList.remove('hidden');
      return;
    }

    this.btnSynthesize.disabled = true;
    this.eurekaBadge.classList.add('hidden');
  }

  areCardsConnected(id1, id2) {
    return this.connections.some(c => 
      (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1)
    );
  }

  executeSynthesis() {
    if (window.StoryAudio) {
      window.StoryAudio.playDiscoveryChime();
      window.StoryAudio.triggerDramaticSilence(2.5);
    }

    if (!this.discoveredDeductions.has('DEDUCTION_FIRE_TRAP')) {
      this.discoveredDeductions.add('DEDUCTION_FIRE_TRAP');
      alert("✦ CRITICAL DEDUCTION SYNTHESIZED!\n\nEXTREME COMBUSTION HAZARD:\nLacquer-stuffed pillars + Adulterated petroleum ghee + Lac-soaked reed partitions.\n\nConclusion: Lakshagriha was engineered to turn into an inescapable blast furnace on the night of the dark moon!");
    } else if (!this.discoveredDeductions.has('DEDUCTION_AMBUSH_DATE')) {
      this.discoveredDeductions.add('DEDUCTION_AMBUSH_DATE');
      alert("✦ STRATEGIC DEDUCTION SYNTHESIZED!\n\nTHE CONSPIRACY TIMELINE:\nThe palace location prevents civilian water-brigades from intervening, synchronized precisely with the gale-force dry westerly winds of Amavasya.");
    }

    this.countDisplay.innerText = `${this.discoveredDeductions.size} Synthesized`;
    this.btnSynthesize.disabled = true;
    this.eurekaBadge.classList.add('hidden');

    // Notify master game loop if on Room 3
    if (window.ChakravyuhaGame && window.ChakravyuhaGame.currentRoom.id === 3) {
      window.ChakravyuhaGame.onDeductionSynthesized();
    }
  }
}

window.DeductionBoardInstance = new DeductionBoard();
