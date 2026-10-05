/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Master Game Controller & 7-Layer Story Orchestration
 * ==========================================================================
 */

class ChakravyuhaGameEngine {
  constructor() {
    this.rooms = window.STORY_ROOMS || [];
    this.currentRoomIndex = 0;
    this.currentRoom = null;

    // Player State
    this.suspicion = 12; // 0 to 100%
    this.isDrishtiActive = false;
    this.discoveredClues = new Set();
    this.recordedDecisions = [];
    this.unlockedRooms = new Set([0]); // Room indices unlocked

    // Active inspection / puzzle state
    this.activeInspectedHotspot = null;
    this.activePuzzle = null;
    this.fireTimerInterval = null;
    this.fireTimeRemaining = 60;

    // DOM Elements
    this.dom = {};
  }

  init() {
    this.cacheDOM();
    this.bindEvents();

    // Start in Room 1
    this.loadRoom(0);

    // Init sub-engines
    if (window.LivingWorldRendererInstance) window.LivingWorldRendererInstance.init();
    if (window.DeductionBoardInstance) window.DeductionBoardInstance.init();
    if (window.InkSketchbookInstance) window.InkSketchbookInstance.init();
  }

  cacheDOM() {
    this.dom = {
      app: document.getElementById('game-app'),
      body: document.body,
      audioPrompt: document.getElementById('audio-init-prompt'),
      btnEnterStory: document.getElementById('btn-enter-story'),
      
      // HUD
      actTag: document.getElementById('act-tag'),
      chapterTitle: document.getElementById('chapter-title'),
      suspicionFill: document.getElementById('suspicion-fill'),
      suspicionVal: document.getElementById('suspicion-value'),
      urgencyWrapper: document.getElementById('urgency-timer-wrapper'),
      timerFill: document.getElementById('timer-fill'),
      timerVal: document.getElementById('timer-value'),
      
      btnDrishti: document.getElementById('btn-drishti'),
      btnDeduction: document.getElementById('btn-deduction'),
      btnJournal: document.getElementById('btn-journal'),
      btnSound: document.getElementById('btn-sound'),
      soundIcon: document.getElementById('sound-icon'),
      btnMap: document.getElementById('btn-map'),
      
      // Viewport & Overlays
      viewport: document.getElementById('viewport-stage'),
      interactiveScene: document.getElementById('interactive-scene'),
      drishtiOverlay: document.getElementById('drishti-overlay'),
      arrivalBanner: document.getElementById('arrival-banner'),
      arrivalLocation: document.getElementById('arrival-location'),
      arrivalSub: document.getElementById('arrival-sub'),
      ambientLog: document.getElementById('ambient-log'),
      ambientText: document.getElementById('ambient-text'),
      
      // NPC Bubble
      npcBubble: document.getElementById('npc-speech-bubble'),
      npcAvatar: document.getElementById('npc-avatar'),
      npcName: document.getElementById('npc-name'),
      npcStatus: document.getElementById('npc-status'),
      npcText: document.getElementById('npc-text'),

      // Modals
      inspectModal: document.getElementById('inspection-modal'),
      btnManipulate: document.getElementById('btn-manipulate'),
      btnSmell: document.getElementById('btn-smell'),
      btnListen: document.getElementById('btn-listen'),
      inspectTag: document.getElementById('inspect-tag'),
      inspectTitle: document.getElementById('inspect-title'),
      inspectDesc: document.getElementById('inspect-desc'),
      sensoryText: document.getElementById('sensory-text'),
      btnRecordClue: document.getElementById('btn-record-clue'),
      btnCloseInspect: document.getElementById('btn-close-inspect'),

      puzzleModal: document.getElementById('puzzle-modal'),
      puzzleTitle: document.getElementById('puzzle-title'),
      puzzleTag: document.getElementById('puzzle-type-tag'),
      puzzleInstruction: document.getElementById('puzzle-instruction'),
      puzzleStage: document.getElementById('puzzle-stage-container'),
      puzzleStatus: document.getElementById('puzzle-status'),
      btnPuzzleSolve: document.getElementById('btn-puzzle-solve'),
      btnPuzzleHint: document.getElementById('btn-puzzle-hint'),
      btnClosePuzzle: document.getElementById('btn-close-puzzle'),

      decisionModal: document.getElementById('decision-modal'),
      decisionTitle: document.getElementById('decision-title'),
      decisionDesc: document.getElementById('decision-desc'),
      decisionOptionsContainer: document.getElementById('decision-options-container'),

      cinematicOverlay: document.getElementById('cinematic-overlay'),
      cinematicHeading: document.getElementById('cinematic-heading'),
      cinematicNarrative: document.getElementById('cinematic-narrative'),
      btnContinueJourney: document.getElementById('btn-continue-journey'),

      deductionDrawer: document.getElementById('deduction-board-modal'),
      btnCloseDeduction: document.getElementById('btn-close-deduction'),

      journalDrawer: document.getElementById('journal-modal'),
      btnCloseJournal: document.getElementById('btn-close-journal'),
      btnPrevPage: document.getElementById('btn-prev-page'),
      btnNextPage: document.getElementById('btn-next-page'),
      folioPageNum: document.getElementById('folio-page-num'),
      journalRoomTitle: document.getElementById('journal-room-title'),
      journalText: document.getElementById('journal-narrative-text'),
      journalCluesList: document.getElementById('journal-clues-list'),
      journalDecisionsLog: document.getElementById('journal-decisions-log'),
      sketchCaption: document.getElementById('sketch-caption'),

      sagaMapModal: document.getElementById('saga-map-modal'),
      btnCloseMap: document.getElementById('btn-close-map'),
      chaptersGrid: document.getElementById('chapters-grid')
    };
  }

  bindEvents() {
    // Initial Audio Unlock
    this.dom.btnEnterStory?.addEventListener('click', () => {
      this.dom.audioPrompt.classList.add('faded');
      if (window.StoryAudio) {
        window.StoryAudio.init();
        window.StoryAudio.startRoomAmbiance(this.currentRoom.id);
      }
    });

    // Sound Toggle
    this.dom.btnSound?.addEventListener('click', () => {
      if (window.StoryAudio) {
        const isMuted = window.StoryAudio.toggleMute();
        this.dom.soundIcon.innerText = isMuted ? '🔇' : '🔊';
      }
    });

    // Drishti Mode
    this.dom.btnDrishti?.addEventListener('click', () => {
      this.toggleDrishti();
    });

    // Modals & Drawers
    this.dom.btnDeduction?.addEventListener('click', () => {
      this.dom.deductionDrawer.classList.remove('hidden');
      if (window.DeductionBoardInstance) window.DeductionBoardInstance.resizeCanvas();
    });
    this.dom.btnCloseDeduction?.addEventListener('click', () => {
      this.dom.deductionDrawer.classList.add('hidden');
    });

    this.dom.btnJournal?.addEventListener('click', () => {
      this.openJournal(this.currentRoomIndex);
    });
    this.dom.btnCloseJournal?.addEventListener('click', () => {
      this.dom.journalDrawer.classList.add('hidden');
    });

    this.dom.btnPrevPage?.addEventListener('click', () => {
      if (this.journalViewIndex > 0) this.openJournal(this.journalViewIndex - 1);
    });
    this.dom.btnNextPage?.addEventListener('click', () => {
      if (this.journalViewIndex < this.rooms.length - 1) this.openJournal(this.journalViewIndex + 1);
    });

    this.dom.btnMap?.addEventListener('click', () => {
      this.openSagaMap();
    });
    this.dom.btnCloseMap?.addEventListener('click', () => {
      this.dom.sagaMapModal.classList.add('hidden');
    });

    // Inspection Buttons
    this.dom.btnCloseInspect?.addEventListener('click', () => {
      this.dom.inspectModal.classList.add('hidden');
    });
    this.dom.btnManipulate?.addEventListener('click', () => {
      this.performSensoryAction('touch');
    });
    this.dom.btnSmell?.addEventListener('click', () => {
      this.performSensoryAction('smell');
    });
    this.dom.btnListen?.addEventListener('click', () => {
      this.performSensoryAction('listen');
    });
    this.dom.btnRecordClue?.addEventListener('click', () => {
      this.recordActiveClue();
    });

    // Puzzle & Breakthrough Buttons
    this.dom.btnClosePuzzle?.addEventListener('click', () => {
      this.dom.puzzleModal.classList.add('hidden');
    });
    this.dom.btnContinueJourney?.addEventListener('click', () => {
      this.advanceToNextRoom();
    });
  }

  // =========================================================================
  // LAYER 1 & 2: ARRIVAL & LIVING WORLD
  // =========================================================================
  loadRoom(index) {
    this.currentRoomIndex = index;
    this.currentRoom = this.rooms[index];
    this.unlockedRooms.add(index);

    // Apply color evolution theme class
    this.dom.body.className = this.currentRoom.themeClass;

    // Update HUD
    this.dom.actTag.innerText = this.currentRoom.act;
    this.dom.chapterTitle.innerText = this.currentRoom.title;

    // Update Living Canvas & Audio
    if (window.LivingWorldRendererInstance) {
      window.LivingWorldRendererInstance.setRoom(this.currentRoom.id);
    }
    if (window.StoryAudio && window.StoryAudio.isInitialized) {
      window.StoryAudio.startRoomAmbiance(this.currentRoom.id);
    }

    // Trigger Layer 1 Arrival Banner
    this.dom.arrivalLocation.innerText = this.currentRoom.location;
    this.dom.arrivalSub.innerText = this.currentRoom.arrival.sub;
    this.dom.arrivalBanner.classList.add('visible');
    setTimeout(() => {
      this.dom.arrivalBanner.classList.remove('visible');
    }, 6000);

    // Update Ambient Ticker
    this.dom.ambientText.innerText = this.currentRoom.ambientLog;

    // Render Layer 2 Living Scene Hotspots & Dynamic NPCs
    this.renderInteractiveScene();

    // Check if Room 7: Start Live Inferno Timer
    if (this.currentRoom.id === 7) {
      this.startInfernoTimer();
    } else {
      this.stopInfernoTimer();
    }
  }

  renderInteractiveScene() {
    this.dom.interactiveScene.innerHTML = '';
    this.dom.npcBubble.classList.add('hidden');

    // 1. Render NPCs with routine movements & dialogues
    this.currentRoom.npcs.forEach(npc => {
      const npcEl = document.createElement('div');
      npcEl.className = 'scene-npc';
      npcEl.style.left = `${npc.initialX}%`;
      npcEl.style.top = `${npc.initialY}%`;
      npcEl.innerHTML = `
        <div class="npc-avatar-badge">${npc.avatar}</div>
        <div class="npc-tag-badge">${npc.name}</div>
      `;

      npcEl.addEventListener('click', () => {
        this.interactWithNPC(npc);
      });

      this.dom.interactiveScene.appendChild(npcEl);
    });

    // 2. Render Interactive Hotspots & Clues
    this.currentRoom.hotspots.forEach(spot => {
      const spotEl = document.createElement('div');
      spotEl.className = `scene-hotspot ${this.isDrishtiActive ? 'drishti-reveal' : ''}`;
      spotEl.id = `hotspot_${spot.id}`;
      spotEl.style.left = `${spot.x}%`;
      spotEl.style.top = `${spot.y}%`;
      spotEl.innerHTML = `
        <div class="hotspot-halo">${spot.icon}</div>
        <div class="hotspot-label">${spot.title}</div>
      `;

      spotEl.addEventListener('click', () => {
        this.openHotspotInspection(spot);
      });

      this.dom.interactiveScene.appendChild(spotEl);
    });

    // 3. Render Escape Puzzle Trigger Altar
    const puzzleTrigger = document.createElement('div');
    puzzleTrigger.className = 'scene-hotspot';
    puzzleTrigger.style.left = '50%';
    puzzleTrigger.style.top = '82%';
    puzzleTrigger.innerHTML = `
      <div class="hotspot-halo" style="border-color:#ff9800; color:#ff9800;">⚙</div>
      <div class="hotspot-label" style="border-color:#ff9800;">CHAMBER CHALLENGE: ${this.currentRoom.puzzle.title}</div>
    `;
    puzzleTrigger.addEventListener('click', () => {
      this.openRoomPuzzle();
    });
    this.dom.interactiveScene.appendChild(puzzleTrigger);
  }

  // =========================================================================
  // LAYER 3: INVESTIGATION & DRISHTI SIGHT
  // =========================================================================
  toggleDrishti() {
    this.isDrishtiActive = !this.isDrishtiActive;
    if (this.isDrishtiActive) {
      this.dom.btnDrishti.classList.add('active');
      this.dom.drishtiOverlay.classList.remove('hidden');
      if (window.StoryAudio) window.StoryAudio.startDrishtiSound();
    } else {
      this.dom.btnDrishti.classList.remove('active');
      this.dom.drishtiOverlay.classList.add('hidden');
      if (window.StoryAudio) window.StoryAudio.stopDrishtiSound();
    }

    // Refresh hotspots for visual drishti reveal
    document.querySelectorAll('.scene-hotspot').forEach(el => {
      if (this.isDrishtiActive) el.classList.add('drishti-reveal');
      else el.classList.remove('drishti-reveal');
    });
  }

  interactWithNPC(npc) {
    if (window.StoryAudio) window.StoryAudio.playFootstep();

    this.dom.npcAvatar.innerText = npc.avatar;
    this.dom.npcName.innerText = npc.name;
    this.dom.npcStatus.innerText = `${npc.role} · ${npc.state}`;
    this.dom.npcText.innerText = `"${npc.dialogue}"`;
    this.dom.npcBubble.classList.remove('hidden');

    // Auto-dismiss bubble after 7 seconds
    clearTimeout(this.npcTimeout);
    this.npcTimeout = setTimeout(() => {
      this.dom.npcBubble.classList.add('hidden');
    }, 7000);
  }

  openHotspotInspection(spot) {
    this.activeInspectedHotspot = spot;
    this.dom.inspectTag.innerText = spot.tag;
    this.dom.inspectTitle.innerText = spot.title;
    this.dom.inspectDesc.innerText = spot.description;
    this.dom.sensoryText.innerText = spot.sensory;

    // Render detailed visual on inspection mini-canvas
    this.renderInspectCanvas(spot);

    this.dom.inspectModal.classList.remove('hidden');
  }

  renderInspectCanvas(spot) {
    const canvas = document.getElementById('inspect-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 380;
    canvas.height = 280;

    ctx.fillStyle = '#120e0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw central stylized object illustration
    ctx.strokeStyle = '#d4af37';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(190, 140, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Large Icon
    ctx.font = '54px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spot.icon, 190, 140);
  }

  performSensoryAction(actionType) {
    if (!this.activeInspectedHotspot) return;
    const spot = this.activeInspectedHotspot;

    if (actionType === 'listen') {
      if (window.StoryAudio) {
        window.StoryAudio.playWallTap(spot.hollow);
      }
      this.dom.sensoryText.innerText = spot.hollow 
        ? "✦ RESONANCE DETECTED! Tapping produces a deep, echoing hollow vibration."
        : "You tap firmly. The material produces a dull, solid, dense thud.";
    } else if (actionType === 'smell') {
      if (this.isDrishtiActive && spot.drishtiHint) {
        this.dom.sensoryText.innerText = `👁‍🗨 DRISHTI INSIGHT: ${spot.drishtiHint}`;
      } else {
        this.dom.sensoryText.innerText = spot.sensory;
      }
    } else if (actionType === 'touch') {
      this.dom.sensoryText.innerText = spot.sensory;
    }
  }

  recordActiveClue() {
    if (!this.activeInspectedHotspot || !this.activeInspectedHotspot.clue) return;
    const clue = this.activeInspectedHotspot.clue;

    if (window.StoryAudio) window.StoryAudio.playDiscoveryChime();

    this.discoveredClues.add(clue.id);

    // Add to Deduction Tableau
    if (window.DeductionBoardInstance) {
      window.DeductionBoardInstance.addEvidenceCard(clue);
    }

    // Add to Journal Folio
    const badge = document.getElementById('journal-badge');
    if (badge) badge.innerText = this.discoveredClues.size;

    this.dom.inspectModal.classList.add('hidden');
    alert(`✦ EVIDENCE RECORDED TO FOLIO:\n"${clue.title}"\nAdded to your deduction tableau.`);
  }

  // =========================================================================
  // LAYER 4: ESCAPE CHALLENGE (STORY-INTEGRATED PUZZLES)
  // =========================================================================
  openRoomPuzzle() {
    const puzzle = this.currentRoom.puzzle;
    this.activePuzzle = puzzle;

    this.dom.puzzleTag.innerText = puzzle.tag;
    this.dom.puzzleTitle.innerText = puzzle.title;
    this.dom.puzzleInstruction.innerText = puzzle.instruction;
    this.dom.puzzleStatus.innerText = "Awaiting true alignment...";

    this.renderPuzzleStage(puzzle);
    this.dom.puzzleModal.classList.remove('hidden');
  }

  renderPuzzleStage(puzzle) {
    this.dom.puzzleStage.innerHTML = '';

    if (puzzle.type === 'DEDUCTIVE SEQUENCE') {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '0.75rem';
      container.style.width = '100%';

      this.currentSequence = [...puzzle.elements];
      this.renderSequenceItems(container);
      this.dom.puzzleStage.appendChild(container);

      this.dom.btnPuzzleSolve.onclick = () => {
        const isMatch = this.currentSequence.every((item, idx) => item.id === puzzle.correctOrder[idx]);
        if (isMatch) {
          this.onPuzzleSolved();
        } else {
          this.dom.puzzleStatus.innerText = "The sequence does not form the full truth. Rearrange the observations.";
          if (window.StoryAudio) window.StoryAudio.playWallTap(false);
        }
      };
    } else if (puzzle.type === 'ACOUSTIC RESONANCE') {
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      grid.style.gap = '1rem';
      grid.style.width = '100%';

      puzzle.elements.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'decision-card-btn';
        btn.innerHTML = `
          <div class="decision-card-title">${item.name}</div>
          <div class="decision-card-effect">Tap to test acoustic density</div>
        `;
        btn.onclick = () => {
          if (window.StoryAudio) window.StoryAudio.playWallTap(item.isHollow);
          btn.querySelector('.decision-card-effect').innerText = item.sound;
          if (item.id === puzzle.correctSelection) {
            btn.style.borderColor = '#00e5ff';
            this.selectedPillar = item.id;
          }
        };
        grid.appendChild(btn);
      });
      this.dom.puzzleStage.appendChild(grid);

      this.dom.btnPuzzleSolve.onclick = () => {
        if (this.selectedPillar === puzzle.correctSelection) {
          this.onPuzzleSolved();
        } else {
          this.dom.puzzleStatus.innerText = "This column does not resonate with subterranean air. Keep listening!";
        }
      };
    } else if (puzzle.type === 'DEDUCTION TABLEAU') {
      const info = document.createElement('div');
      info.style.textAlign = 'center';
      info.innerHTML = `
        <p style="font-size:1.1rem; color:#f0e4d0; margin-bottom:1rem;">
          Open the <strong style="color:#d4af37;">Investigation Tableau</strong> and connect the evidence cards with red yarn to synthesize the fire equation.
        </p>
        <button id="btn-goto-board" class="btn-primary">OPEN DEDUCTION BOARD</button>
      `;
      this.dom.puzzleStage.appendChild(info);
      document.getElementById('btn-goto-board').onclick = () => {
        this.dom.puzzleModal.classList.add('hidden');
        this.dom.deductionDrawer.classList.remove('hidden');
        if (window.DeductionBoardInstance) window.DeductionBoardInstance.resizeCanvas();
      };
      this.dom.btnPuzzleSolve.onclick = () => {
        if (window.DeductionBoardInstance.discoveredDeductions.has('DEDUCTION_FIRE_TRAP')) {
          this.onPuzzleSolved();
        } else {
          this.dom.puzzleStatus.innerText = "Connect the three chemical evidence cards on the board first!";
        }
      };
    } else if (puzzle.type === 'LIGHT AND SHADOW') {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '1.2rem';
      wrapper.style.width = '100%';

      wrapper.innerHTML = `
        <div style="font-size:3rem; transform:rotate(${puzzle.currentAngle}deg);" id="lamp-icon">🪔</div>
        <input type="range" id="lamp-slider" min="0" max="360" value="${puzzle.currentAngle}" style="width:75%; cursor:pointer;">
        <span id="lamp-angle-val" style="font-family:monospace; color:#ffd54f;">Angle: ${puzzle.currentAngle}°</span>
      `;
      this.dom.puzzleStage.appendChild(wrapper);

      const slider = document.getElementById('lamp-slider');
      const icon = document.getElementById('lamp-icon');
      const val = document.getElementById('lamp-angle-val');

      slider.oninput = (e) => {
        const deg = parseInt(e.target.value);
        icon.style.transform = `rotate(${deg}deg)`;
        val.innerText = `Angle: ${deg}°`;
        if (Math.abs(deg - puzzle.targetAngle) < 10) {
          val.innerText = `Angle: ${deg}° — ✦ ALIGNMENT TRUE!`;
          val.style.color = '#00e5ff';
        } else {
          val.style.color = '#ffd54f';
        }
      };

      this.dom.btnPuzzleSolve.onclick = () => {
        if (Math.abs(parseInt(slider.value) - puzzle.targetAngle) < 10) {
          this.onPuzzleSolved();
        } else {
          this.dom.puzzleStatus.innerText = "The shadow beam does not pierce the porcupine notch at this angle.";
        }
      };
    } else {
      // Default interactive challenge
      const simpleBtn = document.createElement('button');
      simpleBtn.className = 'btn-primary';
      simpleBtn.innerText = "COORDINATE CHAMBER ACTION";
      simpleBtn.onclick = () => this.onPuzzleSolved();
      this.dom.puzzleStage.appendChild(simpleBtn);
      this.dom.btnPuzzleSolve.onclick = () => this.onPuzzleSolved();
    }
  }

  renderSequenceItems(container) {
    container.innerHTML = '';
    this.currentSequence.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'decision-card-btn';
      row.style.cursor = 'move';
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span><strong>${index + 1}.</strong> ${item.text}</span>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-small" ${index === 0 ? 'disabled' : ''} data-dir="-1">▲</button>
            <button class="btn-small" ${index === this.currentSequence.length - 1 ? 'disabled' : ''} data-dir="1">▼</button>
          </div>
        </div>
      `;

      row.querySelectorAll('button').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const dir = parseInt(btn.dataset.dir);
          const target = index + dir;
          const temp = this.currentSequence[index];
          this.currentSequence[index] = this.currentSequence[target];
          this.currentSequence[target] = temp;
          this.renderSequenceItems(container);
        };
      });

      container.appendChild(row);
    });
  }

  onPuzzleSolved() {
    this.dom.puzzleModal.classList.add('hidden');
    if (window.StoryAudio) window.StoryAudio.playDiscoveryChime();

    // Trigger Layer 5: Decision / Consequence before breakthrough
    this.openDecisionModal();
  }

  onDeductionSynthesized() {
    if (this.currentRoom.id === 3) {
      this.openDecisionModal();
    }
  }

  // =========================================================================
  // LAYER 5: DECISION & SACRIFICE SYSTEM
  // =========================================================================
  openDecisionModal() {
    const dec = this.currentRoom.decision;
    this.dom.decisionTitle.innerText = dec.title;
    this.dom.decisionDesc.innerText = dec.desc;

    this.dom.decisionOptionsContainer.innerHTML = '';
    dec.options.forEach(opt => {
      const optEl = document.createElement('div');
      optEl.className = 'decision-card-btn';
      optEl.innerHTML = `
        <div class="decision-card-title">${opt.title}</div>
        <div class="decision-card-effect">${opt.effect}</div>
        <div class="sacrifice-warning">Consequence will be recorded in Folio</div>
      `;

      optEl.addEventListener('click', () => {
        this.selectDecision(opt);
      });

      this.dom.decisionOptionsContainer.appendChild(optEl);
    });

    this.dom.decisionModal.classList.remove('hidden');
  }

  selectDecision(option) {
    this.dom.decisionModal.classList.add('hidden');
    this.suspicion = Math.max(0, Math.min(100, this.suspicion + (option.suspicionDelta || 0)));
    this.updateSuspicionDisplay();

    this.recordedDecisions.push({
      roomId: this.currentRoom.id,
      note: option.recordedNote
    });

    // Trigger Layer 6 & 7: Room Breakthrough & Cinematic
    this.triggerBreakthrough();
  }

  updateSuspicionDisplay() {
    this.dom.suspicionFill.style.width = `${this.suspicion}%`;
    this.dom.suspicionVal.innerText = `${this.suspicion}%`;
    if (this.suspicion > 70) {
      this.dom.suspicionFill.style.background = 'linear-gradient(90deg, #ff9800, #ff1744)';
    } else {
      this.dom.suspicionFill.style.background = 'linear-gradient(90deg, #d4af37, #c85a32)';
    }
  }

  // =========================================================================
  // LAYER 6 & 7: ROOM BREAKTHROUGH & CINEMATIC TRANSITION
  // =========================================================================
  triggerBreakthrough() {
    const bt = this.currentRoom.breakthrough;
    if (window.StoryAudio) window.StoryAudio.playBreakthroughSound();

    this.dom.cinematicHeading.innerText = bt.heading;
    this.dom.cinematicNarrative.innerText = bt.narrative;
    this.dom.btnContinueJourney.innerHTML = `<span>${bt.buttonText}</span> →`;

    this.dom.cinematicOverlay.classList.remove('hidden');
    this.dom.cinematicOverlay.classList.add('visible');

    // Run self-drawing ink wash animation on cinematic canvas
    this.renderCinematicInkWash();
  }

  renderCinematicInkWash() {
    const canvas = document.getElementById('cinematic-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let radius = 10;
    const animateWash = () => {
      radius += 20;
      ctx.fillStyle = 'rgba(10, 8, 6, 0.08)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.fill();

      if (radius < Math.max(canvas.width, canvas.height) * 1.2) {
        requestAnimationFrame(animateWash);
      }
    };
    animateWash();
  }

  advanceToNextRoom() {
    this.dom.cinematicOverlay.classList.remove('visible');
    this.dom.cinematicOverlay.classList.add('hidden');

    if (this.currentRoomIndex < this.rooms.length - 1) {
      this.loadRoom(this.currentRoomIndex + 1);
    } else {
      // Completed all 9 rooms! Open full journal folio
      this.openJournal(8);
      alert("✦ JAYATU DHARMA! You have completed all 9 chambers of the Chakravyuha from Lakshagriha!");
    }
  }

  // =========================================================================
  // ROOM 7: LIVE INFERNO SURVIVAL TIMER
  // =========================================================================
  startInfernoTimer() {
    this.dom.urgencyWrapper.classList.remove('hidden');
    this.fireTimeRemaining = 60;
    this.updateTimerDisplay();

    clearInterval(this.fireTimerInterval);
    this.fireTimerInterval = setInterval(() => {
      this.fireTimeRemaining--;
      this.updateTimerDisplay();
      if (this.fireTimeRemaining <= 0) {
        clearInterval(this.fireTimerInterval);
        alert("The heat overwhelms the corridor! Bhima gathers the family and leaps through the side screen!");
        this.openRoomPuzzle();
      }
    }, 1000);
  }

  stopInfernoTimer() {
    this.dom.urgencyWrapper.classList.add('hidden');
    clearInterval(this.fireTimerInterval);
  }

  updateTimerDisplay() {
    const pct = (this.fireTimeRemaining / 60) * 100;
    this.dom.timerFill.style.width = `${pct}%`;
    this.dom.timerVal.innerText = `${this.fireTimeRemaining}s`;
  }

  // =========================================================================
  // FOLIO / JOURNAL VIEWER & MONOCHROME SKETCH ANIMATION
  // =========================================================================
  openJournal(roomIndex) {
    this.journalViewIndex = roomIndex;
    const room = this.rooms[roomIndex];

    this.dom.folioPageNum.innerText = `FOLIO ${roomIndex + 1} / ${this.rooms.length}`;
    this.dom.journalRoomTitle.innerText = room.title;
    this.dom.journalText.innerText = room.arrival.sub;

    // Discovered evidence bullet list
    this.dom.journalCluesList.innerHTML = '';
    room.hotspots.forEach(spot => {
      if (spot.clue && this.discoveredClues.has(spot.clue.id)) {
        const li = document.createElement('li');
        li.innerText = `${spot.clue.title}: ${spot.clue.desc}`;
        this.dom.journalCluesList.appendChild(li);
      }
    });
    if (this.dom.journalCluesList.children.length === 0) {
      const li = document.createElement('li');
      li.innerText = "No clues inscribed on this folio yet. Explore the chamber!";
      this.dom.journalCluesList.appendChild(li);
    }

    // Decisions logged
    const decisionLog = this.recordedDecisions.filter(d => d.roomId === room.id);
    if (decisionLog.length > 0) {
      this.dom.journalDecisionsLog.innerText = decisionLog.map(d => d.note).join(' ');
    } else {
      this.dom.journalDecisionsLog.innerText = "No critical choices recorded on this page.";
    }

    this.dom.sketchCaption.innerText = `Archival Folio ${roomIndex + 1}: ${room.title}`;

    this.dom.journalDrawer.classList.remove('hidden');

    // Trigger self-drawing sketch animation on right parchment page
    if (window.InkSketchbookInstance) {
      window.InkSketchbookInstance.renderStudy(roomIndex, true);
    }
  }

  // =========================================================================
  // SAGA MAP CHAPTER NAVIGATOR
  // =========================================================================
  openSagaMap() {
    this.dom.chaptersGrid.innerHTML = '';
    this.rooms.forEach((room, idx) => {
      const isUnlocked = this.unlockedRooms.has(idx);
      const isActive = idx === this.currentRoomIndex;

      const tile = document.createElement('div');
      tile.className = `chapter-tile ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}`;
      tile.innerHTML = `
        <div class="tile-number">PASSAGE ${idx + 1}</div>
        <div class="tile-title">${room.title}</div>
        <div class="tile-status">${isActive ? '● CURRENT CHAMBER' : (isUnlocked ? 'AVAILABLE TO REVISIT' : '🔒 LOCKED')}</div>
      `;

      if (isUnlocked) {
        tile.addEventListener('click', () => {
          this.dom.sagaMapModal.classList.add('hidden');
          this.loadRoom(idx);
        });
      }

      this.dom.chaptersGrid.appendChild(tile);
    });

    this.dom.sagaMapModal.classList.remove('hidden');
  }
}

// Instantiate and start master game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.ChakravyuhaGame = new ChakravyuhaGameEngine();
  window.ChakravyuhaGame.init();
});
