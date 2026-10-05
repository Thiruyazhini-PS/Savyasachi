/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Monochrome Ink Sketchbook & Self-Drawing Canvas System
 * ==========================================================================
 */

import { AudioEngine } from '../audio/SpatialAudio';
import { GameState } from '../core/GameState';
import { getAssetUrl } from '../utils/assets';

export class InkSketchbook {
  private static instance: InkSketchbook;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  public currentRoomIndex: number = 0;
  public drawProgress: number = 0;

  private constructor() {}

  public static getInstance(): InkSketchbook {
    if (!InkSketchbook.instance) {
      InkSketchbook.instance = new InkSketchbook();
    }
    return InkSketchbook.instance;
  }

  public init() {
    this.canvas = document.getElementById('sketchbook-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = 450;
      this.canvas.height = 420;
    }
  }

  public renderStudy(roomIndex: number, animate: boolean = true) {
    this.init();
    if (!this.ctx || !this.canvas) return;

    this.currentRoomIndex = roomIndex;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (!animate) {
      this.drawProgress = 1.0;
      this.drawRoomSketch(roomIndex, 1.0);
      return;
    }

    this.drawProgress = 0;
    const startTime = performance.now();
    const duration = 2400; // 2.4s self-drawing stroke animation

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      this.drawProgress = Math.min(1.0, elapsed / duration);

      if (Math.random() < 0.16) {
        AudioEngine.playInkStroke();
      }

      this.drawRoomSketch(roomIndex, this.drawProgress);

      if (this.drawProgress < 1.0) {
        this.animationId = requestAnimationFrame(loop);
      } else {
        this.addInkSpatter(this.ctx!);
      }
    };

    this.animationId = requestAnimationFrame(loop);
  }

  private drawRoomSketch(index: number, progress: number) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Aged White Paper Background
    ctx.fillStyle = '#faf6ed';
    ctx.fillRect(0, 0, w, h);

    // Light Graphite Margin
    ctx.strokeStyle = 'rgba(40, 32, 24, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Monochrome Ink & Graphite Styling
    ctx.strokeStyle = '#181412';
    ctx.fillStyle = '#181412';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (index) {
      case 0:
        this.drawVaranavataGates(ctx, progress);
        break;
      case 1:
        this.drawLakshagrihaCrossSection(ctx, progress);
        break;
      case 2:
        this.drawMaterialsStudy(ctx, progress);
        break;
      case 3:
        this.drawViduraPorcupineEnigma(ctx, progress);
        break;
      case 4:
        this.drawTunnelStruts(ctx, progress);
        break;
      case 5:
        this.drawBanquetVeranda(ctx, progress);
        break;
      case 6:
        this.drawInfernoCollapse(ctx, progress);
        break;
      case 7:
        this.drawGangaSkiff(ctx, progress);
        break;
      case 8:
        this.drawForestCanopy(ctx, progress);
        break;
      default:
        this.drawVaranavataGates(ctx, progress);
    }
  }

  // 1. Varanavata Gates
  private drawVaranavataGates(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 340);
    ctx.lineTo(30 + 390 * Math.min(p * 2, 1), 340);
    ctx.stroke();

    if (p > 0.2) {
      const pCol = Math.min((p - 0.2) / 0.4, 1);
      ctx.lineWidth = 3;
      ctx.strokeRect(70, 340 - 200 * pCol, 35, 200 * pCol);
      ctx.strokeRect(345, 340 - 200 * pCol, 35, 200 * pCol);
    }

    if (p > 0.5) {
      const pArch = Math.min((p - 0.5) / 0.3, 1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 140);
      ctx.quadraticCurveTo(225, 80, 400 * pArch, 140);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(225, 90, 25 * pArch, 0, Math.PI, true);
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.fillStyle = 'rgba(25, 20, 15, 0.08)';
      ctx.fillRect(70, 140, 35, 200);
      ctx.fillRect(345, 140, 35, 200);

      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#3a3026';
      ctx.fillText('Folio 1: Varanavata gates & convoy. 4 lac wagons weeping amber; 7 doors drawn vs 5 sworn.', 30, 375);
    }
    ctx.restore();
  }

  // 2. Lakshagriha Cutaway
  // 2. Lakshagriha True Floor Plan & East Wall Flue (P13 Self-Drawing Ink Sketch)
  private drawLakshagrihaCrossSection(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#181412';
    ctx.fillStyle = '#181412';

    // Outer Perimeter Walls
    ctx.beginPath();
    ctx.strokeRect(50, 80, 340, 220);

    // Header title
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.fillText('P13: TRUE FLOOR PLAN · EAST WALL HOLLOW RECONSTRUCTION', 55, 68);

    if (p > 0.15) {
      // Room Partitions
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Central Court vertical lines
      ctx.moveTo(150, 80);
      ctx.lineTo(150, 300);
      ctx.moveTo(270, 80);
      ctx.lineTo(270, 300);
      // Horizontal division
      ctx.moveTo(50, 190);
      ctx.lineTo(390, 190);
      ctx.stroke();

      // Room Labels
      ctx.font = '9px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('WEST CORRIDOR', 60, 135);
      ctx.fillText('CENTRAL HALL', 170, 135);
      ctx.fillText('EAST HALL (12 HALL / 16 PLAN)', 278, 135);
      ctx.fillText('BEDCHAMBERS', 60, 245);
      ctx.fillText('BANQUET VAULT', 170, 245);
      ctx.fillText('REAR VERANDA', 280, 245);
    }

    if (p > 0.35) {
      // 5 Built Doors (solid) vs 2 Missing Doors (dashed)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#8a1c14';
      // Built Doors (5)
      ctx.strokeRect(46, 125, 8, 20); // Door 1
      ctx.strokeRect(195, 76, 30, 8); // Door 2
      ctx.strokeRect(340, 76, 25, 8); // Door 3
      ctx.strokeRect(195, 296, 30, 8); // Door 4
      ctx.strokeRect(46, 235, 8, 20); // Door 5

      // Missing Doors (2) - dotted in red
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(386, 125, 8, 20); // Missing Door 6
      ctx.strokeRect(386, 235, 8, 20); // Missing Door 7
      ctx.setLineDash([]);
      ctx.strokeStyle = '#181412';
    }

    if (p > 0.55) {
      // The 4-Length Hollow Strip Hatched on East Wall
      ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
      ctx.fillRect(350, 80, 40, 220);
      ctx.strokeRect(350, 80, 40, 220);

      // Hatching lines for hollow cavity
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#b84a2d';
      for (let y = 85; y < 295; y += 10) {
        ctx.beginPath();
        ctx.moveTo(350, y);
        ctx.lineTo(390, y + 10);
        ctx.stroke();
      }
      ctx.strokeStyle = '#181412';

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#8a1c14';
      ctx.fillText('★ 4-UNIT HOLLOW CAVITY', 270, 285);
    }

    if (p > 0.75) {
      // Lotus Plate Medallion Sketch at (135°)
      ctx.beginPath();
      ctx.arc(100, 340, 18, 0, Math.PI * 2);
      ctx.stroke();
      // 8 Petals
      for (let i = 0; i < 8; i++) {
        const a = (i * 45) * Math.PI / 180;
        const r = (i === 3) ? 17 : 12; // Petal index 3 is elongated
        ctx.beginPath();
        ctx.moveTo(100, 340);
        ctx.lineTo(100 + r * Math.cos(a), 340 + r * Math.sin(a));
        ctx.stroke();
      }
      // Arrow at 135 degrees
      const arrowA = 135 * Math.PI / 180;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#8a1c14';
      ctx.beginPath();
      ctx.moveTo(100, 340);
      ctx.lineTo(100 + 24 * Math.cos(arrowA), 340 + 24 * Math.sin(arrowA));
      ctx.stroke();
      ctx.strokeStyle = '#181412';
      ctx.lineWidth = 1;

      ctx.font = 'italic 10px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#181412';
      ctx.fillText('Lotus Plate: Long Petal aligned to 135° Arrow unlatches hidden stair.', 130, 340);

      // Outside bolt notation
      ctx.fillText('Outer Door: Iron bolt mounted on outside of frame. Locked from without.', 130, 355);
    }

    ctx.restore();
  }

  // 3. Materials Study
  private drawMaterialsStudy(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 2;
    if (p > 0.1) {
      ctx.beginPath();
      ctx.ellipse(140, 240, 45, 65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(125, 155, 30, 20);
    }

    if (p > 0.4) {
      ctx.strokeRect(260, 160, 110, 140);
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(315, 230, 15 + i * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (p > 0.7) {
      ctx.font = '13px "Cinzel", serif';
      ctx.fillStyle = '#1e1814';
      ctx.fillText('LAKSHA (Tree Lac) + SARPI (Ghee) + TAILA (Bitumen)', 40, 90);

      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#554232';
      ctx.fillText('Flashpoint: Immediate. Smoke: Toxic asphyxiant.', 70, 350);
      ctx.fillText('Liquefies at 75°C into clinging napalm.', 70, 370);
    }
    ctx.restore();
  }

  // 4. Vidura's Porcupine Enigma
  private drawViduraPorcupineEnigma(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    const cx = 225;
    const cy = 210;

    ctx.lineWidth = 1.8;
    [30, 60, 95, 130].forEach((r, idx) => {
      if (p > idx * 0.15) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    if (p > 0.5) {
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95);
        ctx.lineTo(cx + Math.cos(a) * 130, cy + Math.sin(a) * 130);
        ctx.stroke();
      }

      ctx.lineWidth = 1.5;
      for (let i = -20; i <= 20; i += 6) {
        ctx.beginPath();
        ctx.moveTo(cx + i, cy + 10);
        ctx.lineTo(cx + i * 1.4, cy - 20);
        ctx.stroke();
      }
    }

    if (p > 0.75) {
      ctx.strokeStyle = '#8a1c14';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(2.35) * 150, cy + Math.sin(2.35) * 150);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#221a14';
      ctx.fillText('Vidura: "The porcupine burrows subterranean while the tree burns."', 45, 380);
    }
    ctx.restore();
  }

  // 5. Tunnel Struts
  private drawTunnelStruts(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 100);
    ctx.lineTo(420 * Math.min(p * 1.5, 1), 100);
    ctx.stroke();

    if (p > 0.4) {
      ctx.lineWidth = 2.5;
      ctx.strokeRect(60, 160, 330, 140);

      [100, 180, 260, 340].forEach((tx) => {
        ctx.strokeRect(tx, 160, 16, 140);
        ctx.beginPath();
        ctx.moveTo(tx + 16, 160);
        ctx.lineTo(tx + 50, 200);
        ctx.stroke();
      });
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#3a2e22';
      ctx.fillText('Khanitra Sapper Tunnel: Depth 14 cubits, exiting at Ganga Banyan.', 50, 360);
    }
    ctx.restore();
  }

  // 6. Banquet Veranda
  private drawBanquetVeranda(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 2;
    if (p > 0.2) {
      ctx.strokeRect(60, 260, 330, 35);
      [100, 160, 220, 280, 340].forEach((gx) => {
        ctx.beginPath();
        ctx.moveTo(gx, 260);
        ctx.lineTo(gx - 6, 240);
        ctx.lineTo(gx + 6, 240);
        ctx.closePath();
        ctx.stroke();
      });
    }

    if (p > 0.5) {
      ctx.strokeRect(340, 100, 20, 160);
      ctx.beginPath();
      ctx.arc(350, 90, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#8a1c14';
      ctx.fillText('Fourteenth Night: The trap is sprung against its architect.', 60, 360);
    }
    ctx.restore();
  }

  // 7. Inferno Collapse
  private drawInfernoCollapse(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 3;
    if (p > 0.2) {
      ctx.beginPath();
      ctx.moveTo(60, 320);
      ctx.lineTo(240, 150);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(380, 320);
      ctx.lineTo(190, 180);
      ctx.stroke();
    }

    if (p > 0.5) {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(280, 290, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(280, 240);
      ctx.lineTo(280, 280);
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#1c1510';
      ctx.fillText('The Lakshagriha implodes. Pandavas navigate beneath the embers.', 50, 370);
    }
    ctx.restore();
  }

  // 8. Ganga Skiff
  private drawGangaSkiff(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 1.5;
    if (p > 0.2) {
      ctx.beginPath();
      ctx.arc(360, 80, 22, 0, Math.PI * 2);
      ctx.stroke();

      for (let y = 180; y < 340; y += 18) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.bezierCurveTo(150, y - 5, 270, y + 5, 410, y);
        ctx.stroke();
      }
    }

    if (p > 0.5) {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(110, 245);
      ctx.quadraticCurveTo(225, 280, 340, 240);
      ctx.lineTo(315, 260);
      ctx.quadraticCurveTo(225, 290, 130, 260);
      ctx.closePath();
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#222830';
      ctx.fillText('Ganga at Midnight: Across the silver tides to freedom.', 65, 370);
    }
    ctx.restore();
  }

  // 9. Forest Canopy
  private drawForestCanopy(ctx: CanvasRenderingContext2D, p: number) {
    ctx.save();
    ctx.lineWidth = 3;
    if (p > 0.2) {
      ctx.beginPath();
      ctx.moveTo(90, 40);
      ctx.bezierCurveTo(80, 160, 60, 280, 40, 340);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(360, 40);
      ctx.bezierCurveTo(370, 160, 390, 280, 410, 340);
      ctx.stroke();
    }

    if (p > 0.5) {
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(210, 310);
      ctx.lineTo(240, 310);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(225, 310);
      ctx.quadraticCurveTo(232, 290, 225, 280);
      ctx.quadraticCurveTo(218, 290, 225, 310);
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.font = 'italic 13px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#1c221a';
      ctx.fillText('Hidimbavana: The trials of fire yield the seeds of Dharma.', 55, 370);
    }
    ctx.restore();
  }

  private addInkSpatter(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < 6; i++) {
      const sx = 30 + Math.random() * 390;
      const sy = 40 + Math.random() * 340;
      const r = 0.8 + Math.random() * 2.2;
      ctx.fillStyle = `rgba(24, 18, 14, ${0.15 + Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const FolioSketchbook = InkSketchbook.getInstance();

export class FolioJournal {
  private static instance: FolioJournal;

  private currentFolioPage: number = 0; // 0 to 8 (9 rooms)
  private activeTab: 'notes' | 'sketches' | 'hints' | 'people' | 'map' = 'notes';
  private drawnPages: Set<number> = new Set();
  private notesDebounceTimer: any = null;

  private readonly ROOM_TITLES = [
    "I. Varanavata & The Royal Mandate",
    "II. Lakshagriha & The Inverted Flues",
    "III. Materials Vault & Combustible Admixtures",
    "IV. Vidura's Enigma & The Burrowing Porcupine",
    "V. Subterranean Mine & The Silent Chisel",
    "VI. The Last Banquet & The Feast of Seeds",
    "VII. The Conflagration & The Consuming Flame",
    "VIII. Ganga at Midnight & The Silver Skiff",
    "IX. The Ancient Forest & The Shadow of Hidimba"
  ];

  private readonly ROOM_NARRATIVES = [
    "The grand city was bathed in marigold garlands. Builder Purochana swore he raised 'a house of five doors.' Yet the town surveyor's plan drafts seven doors (7 - 5 = 2), and four heavy convoy wagons weep amber lac resin under Hastinapura's secret marks.",
    "The hall is beautiful. Too beautiful. Every board has been oiled. Seven doors drawn. Five built. Where are the other two? East room: 16 on the plan, 12 in the hall. Four missing. The east wall rings hollow. A hidden space lies behind it. Every bolt is on the outside. Who locks guests in?",
    "Deep in the storehouses beneath the courtyard: barrels of boiled shellac, unrefined earth-pitch (naphtha), and hemp soaked in resin. A structural incendiary payload.",
    "Vidura's ascetic emissary slipped us the copper porcupine cipher: 'The wildfire spares only the creature that burrows.' Salvation lies beneath the earth, not through the gates.",
    "Under cover of midnight, Vidura's master miner begins subterranean excavation. The sound of iron must remain muffled; one misplaced strike against stone would alert Purochana.",
    "Purochana hosts a grand feast of roasted meats and sweet wine to dull the Pandavas' wits. Kunti serves the stewards while Bhima counts the footsteps of the watch.",
    "Midnight strikes. The dry grasses catch. With a roar like Pashupati's wrath, Lakshagriha becomes an incandescent pyre. We descend into the darkness of the earth.",
    "Emerging on the silent banks of the Ganga under moonlight. A disguised helmsman awaits with a wooden skiff, whistling Vidura's confidential warbler call.",
    "Deep within the primeval canopy beyond the river. Exhausted and soot-stained, the family seeks shelter under the roots of a giant banyan as dawn filters through leaves."
  ];

  private constructor() {}

  public static getInstance(): FolioJournal {
    if (!FolioJournal.instance) {
      FolioJournal.instance = new FolioJournal();
    }
    return FolioJournal.instance;
  }

  public init() {
    this.bindTabButtons();
    this.bindPageNavigation();
    this.bindNotesAutosave();
    this.loadSavedNotes();
    this.updatePageDisplay();
  }

  private bindTabButtons() {
    const tabs = document.querySelectorAll('.ribbon-tab, .folio-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab') as any;
        if (targetTab) {
          this.switchTab(targetTab);
        }
      });
    });
  }

  public switchTab(tabName: 'notes' | 'sketches' | 'hints' | 'people' | 'map') {
    this.activeTab = tabName;
    AudioEngine.playPaperTurn();

    // Clear unread dot on ribbon if switching to notes
    if (tabName === 'notes') {
      const dot = document.getElementById('ribbon-dot-notes');
      if (dot) dot.classList.add('hidden');
    }

    // Update active tab buttons & ribbons
    document.querySelectorAll('.ribbon-tab, .folio-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    // Update active tab pane
    document.querySelectorAll('.folio-tab-pane').forEach((pane) => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`tab-pane-${tabName}`);
    if (activePane) {
      activePane.classList.add('active');
    }

    if (tabName === 'sketches') {
      const shouldAnimate = !this.drawnPages.has(this.currentFolioPage);
      FolioSketchbook.renderStudy(this.currentFolioPage, shouldAnimate);
      this.drawnPages.add(this.currentFolioPage);
    }
  }

  public prevPage() {
    if (this.currentFolioPage > 0) {
      this.currentFolioPage--;
      AudioEngine.playPaperTurn();
      this.updatePageDisplay();
    }
  }

  public nextPage() {
    if (this.currentFolioPage < 8) {
      this.currentFolioPage++;
      AudioEngine.playPaperTurn();
      this.updatePageDisplay();
    }
  }

  private bindPageNavigation() {
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
      this.prevPage();
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
      this.nextPage();
    });
  }

  public updatePageDisplay() {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];
    const leftNum = document.getElementById('folio-page-num-left');
    const rightNum = document.getElementById('folio-page-num-right');
    if (leftNum) {
      const leftIdx = this.currentFolioPage * 2;
      leftNum.innerText = `Folio ${romanNumerals[leftIdx] || (leftIdx + 1)}`;
    }
    if (rightNum) {
      const rightIdx = this.currentFolioPage * 2 + 1;
      rightNum.innerText = `Folio ${romanNumerals[rightIdx] || (rightIdx + 1)}`;
    }

    const titleEl = document.getElementById('folio-title');
    if (titleEl) {
      titleEl.innerText = this.ROOM_TITLES[this.currentFolioPage] || '';
    }

    const descEl = document.getElementById('folio-text');
    if (descEl) {
      const rawText = this.ROOM_NARRATIVES[this.currentFolioPage] || '';
      if (rawText.length > 0) {
        const firstLetter = rawText.charAt(0);
        const rest = rawText.slice(1);
        descEl.innerHTML = `<span class="narrative-drop-cap">${firstLetter}</span>${rest}`;
      } else {
        descEl.innerHTML = '';
      }
    }

    if (this.activeTab === 'sketches') {
      const shouldAnimate = !this.drawnPages.has(this.currentFolioPage);
      FolioSketchbook.renderStudy(this.currentFolioPage, shouldAnimate);
      this.drawnPages.add(this.currentFolioPage);
    }
  }

  private bindNotesAutosave() {
    const textarea = document.getElementById('player-notes-textarea') as HTMLTextAreaElement;
    const indicator = document.getElementById('notes-save-indicator');

    if (textarea) {
      textarea.addEventListener('input', () => {
        if (this.notesDebounceTimer) clearTimeout(this.notesDebounceTimer);
        this.notesDebounceTimer = setTimeout(() => {
          try {
            localStorage.setItem('chakravyuha_player_notes', textarea.value);
            if (indicator) {
              indicator.classList.add('visible');
              setTimeout(() => indicator.classList.remove('visible'), 1600);
            }
          } catch (_) {}
        }, 400);
      });
    }
  }

  private loadSavedNotes() {
    try {
      const saved = localStorage.getItem('chakravyuha_player_notes');
      const textarea = document.getElementById('player-notes-textarea') as HTMLTextAreaElement;
      if (saved && textarea) {
        textarea.value = saved;
      }
    } catch (_) {}
  }

  public renderEvidenceCards() {
    const listEl = document.getElementById('folio-clues-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const evidenceItems = [
      {
        thumb: getAssetUrl('assets/closeup_crate.jpg'),
        title: 'Convoy Wagons (4 Weeping Lac)',
        obs: 'Exactly 4 wagons weep amber pitch with lac guild stamps. 1 festival cart drips honey as a red herring.'
      },
      {
        thumb: getAssetUrl('assets/closeup_tally_board.jpg'),
        title: 'Town Surveyor\'s Folio Plan',
        obs: 'Architectural blueprint shows 7 doors. Purochana swore a house of 5 doors (7 - 5 = 2).'
      },
      {
        thumb: getAssetUrl('assets/closeup_copper_disc.jpg'),
        title: 'Vidura\'s Moon Count Disc',
        obs: 'A ring of 9 moons: 6 carved lit, 3 dark remaining. Counts nights until the planned fire.'
      },
      {
        thumb: getAssetUrl('assets/closeup_tally_board.jpg'),
        title: 'Merchant Tally Tablet',
        obs: 'Notched counting slate equating counting notches 1–9 to Sanskrit numerals १–९.'
      }
    ];

    if (GameState.knowledge.sawLacShipment) {
      evidenceItems.push({
        thumb: getAssetUrl('assets/closeup_crate.jpg'),
        title: 'Amber blocks packed in cedar, smelling of ghee',
        obs: 'Raw, translucent blocks of lac resin packed secretly beneath cedar wood shavings, smelling heavily of clarified ghee.'
      });
    }

    if (GameState.knowledge.noticedDoorMismatch) {
      evidenceItems.push({
        thumb: getAssetUrl('assets/room02_plan_table.jpg'),
        title: 'Door Count Mismatch',
        obs: 'Seven doors drawn on surveyor\'s folio, but only five built in the palace hall. A discrepancy of two doors.'
      });
    }

    if (GameState.knowledge.houseLayoutMapped) {
      evidenceItems.push({
        thumb: getAssetUrl('assets/room02_east_wall.jpg'),
        title: 'East Wall Strip',
        obs: 'Measuring cord proves the east wing is 16 lengths on the plan, but only 12 in the hall. Four lengths are hidden within the wall.'
      });
    }

    if (GameState.knowledge.knowsHollowFlues) {
      evidenceItems.push({
        thumb: getAssetUrl('assets/room02_lotus_plate.jpg'),
        title: 'Hollow Resonance',
        obs: 'Tapping the east cedar frieze produces a deep hollow ring. An 8-petal brass lotus plate with petal #3 elongated unseals the stair.'
      });
    }

    if (GameState.knowledge.knowsExternalLock) {
      evidenceItems.push({
        thumb: getAssetUrl('assets/room02_door_latch.jpg'),
        title: 'Outside Bolts',
        obs: 'Every chamber door has its heavy iron slide-bolt mounted exclusively on the exterior frame, locking the Pandavas in from without.'
      });
    }

    if (GameState.clues.some(c => c.id === 'clue_camphor_cakes')) {
      evidenceItems.push({
        thumb: getAssetUrl('assets/room02_jewelry_chest.jpg'),
        title: 'Camphor, burns bright and fast [RED HERRING]',
        obs: 'Ceremonial white camphor cakes on the stone altar. Highly flammable but purely ceremonial ritual offerings.'
      });
    }

    evidenceItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'evidence-mini-card';
      card.innerHTML = `
        <img src="${getAssetUrl(item.thumb)}" alt="${item.title}" class="evidence-ink-thumb" onerror="this.style.display='none'">
        <div class="evidence-card-body">
          <div class="evidence-card-title">${item.title}</div>
          <p class="evidence-card-obs">${item.obs}</p>
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  public showNewEvidenceDot() {
    const dot = document.getElementById('ribbon-dot-notes');
    if (dot) {
      dot.classList.remove('hidden');
    }
  }

  public onOpen() {
    this.updatePageDisplay();
    this.renderEvidenceCards();
    if (this.activeTab === 'notes') {
      const dot = document.getElementById('ribbon-dot-notes');
      if (dot) dot.classList.add('hidden');
    }
  }
}

export const Folio = FolioJournal.getInstance();
