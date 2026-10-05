/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Monochrome Ink Sketchbook & Self-Drawing Canvas System
 * ==========================================================================
 */

class InkSketchbook {
  constructor() {
    this.canvas = document.getElementById('sketchbook-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.animationId = null;
    this.currentRoomIndex = 0;
    this.drawProgress = 0; // 0 to 1
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.getElementById('sketchbook-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    if (this.canvas) {
      this.canvas.width = 450;
      this.canvas.height = 420;
    }
  }

  // Draw or animate the room's architectural study
  renderStudy(roomIndex, animate = true) {
    this.init();
    if (!this.ctx) return;

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
    const duration = 2200; // 2.2 seconds self-drawing stroke animation

    const loop = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.drawProgress = Math.min(1.0, elapsed / duration);
      
      // Play occasional ink scratch audio
      if (Math.random() < 0.18 && window.StoryAudio) {
        window.StoryAudio.playInkStroke();
      }

      this.drawRoomSketch(roomIndex, this.drawProgress);

      if (this.drawProgress < 1.0) {
        this.animationId = requestAnimationFrame(loop);
      } else {
        // Draw final authentic ink splatter & paper absorption
        this.addInkSpatter(this.ctx);
      }
    };

    this.animationId = requestAnimationFrame(loop);
  }

  // Master switch for monochrome architectural drawings
  drawRoomSketch(index, progress) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear with aged white paper background
    ctx.fillStyle = '#faf6ed';
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grain & border
    ctx.strokeStyle = 'rgba(40, 32, 24, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Set ink stroke style (Monochrome black ink, graphite, charcoal wash)
    ctx.strokeStyle = '#181412';
    ctx.fillStyle = '#181412';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (index) {
      case 0:
        this.drawVaranavataGates(ctx, progress, w, h);
        break;
      case 1:
        this.drawLakshagrihaCrossSection(ctx, progress, w, h);
        break;
      case 2:
        this.drawMaterialsStudy(ctx, progress, w, h);
        break;
      case 3:
        this.drawViduraPorcupineEnigma(ctx, progress, w, h);
        break;
      case 4:
        this.drawTunnelStruts(ctx, progress, w, h);
        break;
      case 5:
        this.drawBanquetVeranda(ctx, progress, w, h);
        break;
      case 6:
        this.drawInfernoStructuralCollapse(ctx, progress, w, h);
        break;
      case 7:
        this.drawGangaMoonlitSkiff(ctx, progress, w, h);
        break;
      case 8:
        this.drawForestCanopyFolio(ctx, progress, w, h);
        break;
      default:
        this.drawVaranavataGates(ctx, progress, w, h);
    }
  }

  // 1. Varanavata Gates & City Elevation
  drawVaranavataGates(ctx, p, w, h) {
    ctx.save();
    // Foundation stone
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 340);
    ctx.lineTo(30 + 390 * Math.min(p * 2, 1), 340);
    ctx.stroke();

    // Twin Pillars
    if (p > 0.2) {
      const pCol = Math.min((p - 0.2) / 0.4, 1);
      ctx.lineWidth = 3;
      // Left pillar
      ctx.strokeRect(70, 340 - 200 * pCol, 35, 200 * pCol);
      // Right pillar
      ctx.strokeRect(345, 340 - 200 * pCol, 35, 200 * pCol);
    }

    // Carved Vedic Eaves / Archway
    if (p > 0.5) {
      const pArch = Math.min((p - 0.5) / 0.3, 1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 140);
      ctx.quadraticCurveTo(225, 80, 400 * pArch, 140);
      ctx.stroke();

      // Top Cupola
      ctx.beginPath();
      ctx.arc(225, 90, 25 * pArch, 0, Math.PI, true);
      ctx.stroke();
    }

    // Charcoal Wash & Annotations
    if (p > 0.8) {
      ctx.fillStyle = 'rgba(25, 20, 15, 0.08)';
      ctx.fillRect(70, 140, 35, 200);
      ctx.fillRect(345, 140, 35, 200);

      // Handwriting annotation
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#3a3026';
      ctx.fillText('Folio 1: Varanavata royal gates. Heavy resin wagons unobserved.', 50, 375);
    }
    ctx.restore();
  }

  // 2. Lakshagriha Architectural Cross-Section with Hidden Hollow Flues
  drawLakshagrihaCrossSection(ctx, p, w, h) {
    ctx.save();
    // Exterior palace outline
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 330);
    ctx.lineTo(50 + 350 * Math.min(p * 1.5, 1), 330);
    ctx.stroke();

    // Palace Roof Gable
    if (p > 0.2) {
      const pRoof = Math.min((p - 0.2) / 0.4, 1);
      ctx.beginPath();
      ctx.moveTo(50, 180);
      ctx.lineTo(225, 180 - 80 * pRoof);
      ctx.lineTo(400, 180);
      ctx.stroke();
    }

    // Cutaway: The Hollow Lac Flues in center
    if (p > 0.5) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#2b2118';
      // Internal flues
      ctx.strokeRect(190, 140, 70, 190);
      
      // Cross-hatching for lac resin packing
      ctx.lineWidth = 1;
      for (let y = 150; y < 320; y += 12) {
        if (Math.random() < p) {
          ctx.beginPath();
          ctx.moveTo(195, y);
          ctx.lineTo(255, y + 8);
          ctx.stroke();
        }
      }

      // Airflow arrows
      ctx.beginPath();
      ctx.moveTo(225, 310);
      ctx.lineTo(225, 170);
      ctx.stroke();
      // Arrowhead
      ctx.lineTo(220, 185);
      ctx.moveTo(225, 170);
      ctx.lineTo(230, 185);
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#8a1c14';
      ctx.fillText('CRITICAL: Internal hollow core acts as a chimney flue for flame.', 50, 365);
    }
    ctx.restore();
  }

  // 3. Chemical Material Studies: Lac, Bitumen & Amphorae
  drawMaterialsStudy(ctx, p, w, h) {
    ctx.save();
    // Jars & vessels
    ctx.lineWidth = 2;
    if (p > 0.1) {
      // Ghee Amphora
      ctx.beginPath();
      ctx.ellipse(140, 240, 45, 65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(125, 155, 30, 20);
    }

    if (p > 0.4) {
      // Wood cross-section showing lac seeping
      ctx.strokeRect(260, 160, 110, 140);
      // Wood grain lines
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(315, 230, 15 + i * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Chemical equation annotations
    if (p > 0.7) {
      ctx.font = '13px "Cinzel", serif';
      ctx.fillStyle = '#1e1814';
      ctx.fillText('LAKSHA (Tree Lac) + SARPI (Ghee) + TAILA (Bitumen)', 40, 90);

      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#554232';
      ctx.fillText('Flashpoint: Immediate. Smoke: High toxicity asphyxiant.', 70, 350);
      ctx.fillText('Liquefies at 75°C into clinging molten resin.', 70, 370);
    }
    ctx.restore();
  }

  // 4. Vidura's Porcupine Cipher & Lamp Shadow Alignment
  drawViduraPorcupineEnigma(ctx, p, w, h) {
    ctx.save();
    const cx = 225;
    const cy = 210;

    // Concentric Copper Disc Circles
    ctx.lineWidth = 1.8;
    [30, 60, 95, 130].forEach((r, idx) => {
      if (p > idx * 0.15) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 8 Ray Notches
    if (p > 0.5) {
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95);
        ctx.lineTo(cx + Math.cos(a) * 130, cy + Math.sin(a) * 130);
        ctx.stroke();
      }

      // Porcupine central emblem (stylized bristles)
      ctx.lineWidth = 1.5;
      for (let i = -20; i <= 20; i += 6) {
        ctx.beginPath();
        ctx.moveTo(cx + i, cy + 10);
        ctx.lineTo(cx + i * 1.4, cy - 20);
        ctx.stroke();
      }
    }

    if (p > 0.75) {
      // 135 degree shadow vector
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
      ctx.fillText('Vidura: "The porcupine lives subterranean while the tree burns."', 45, 380);
    }
    ctx.restore();
  }

  // 5. Khanitra's Tunnel Shoring & Stratigraphy
  drawTunnelStruts(ctx, p, w, h) {
    ctx.save();
    // Ground level line
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 100);
    ctx.lineTo(420 * Math.min(p * 1.5, 1), 100);
    ctx.stroke();

    // Strata hatching (Earth above)
    if (p > 0.3) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(40,30,20,0.4)';
      for (let x = 40; x < 410; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 105);
        ctx.lineTo(x + 15, 130);
        ctx.stroke();
      }
    }

    // Tunnel Shaft
    if (p > 0.4) {
      ctx.strokeStyle = '#181412';
      ctx.lineWidth = 2.5;
      // Shaft excavation
      ctx.strokeRect(60, 160, 330, 140);

      // Timber Shoring frames
      [100, 180, 260, 340].forEach(tx => {
        ctx.strokeRect(tx, 160, 16, 140);
        // Cross brace
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

  // 6. Banquet Veranda with Sleeping Guards & Torches
  drawBanquetVeranda(ctx, p, w, h) {
    ctx.save();
    ctx.lineWidth = 2;
    // Dining table & goblets
    if (p > 0.2) {
      ctx.strokeRect(60, 260, 330, 35);
      // Goblets
      [100, 160, 220, 280, 340].forEach(gx => {
        ctx.beginPath();
        ctx.moveTo(gx, 260);
        ctx.lineTo(gx - 6, 240);
        ctx.lineTo(gx + 6, 240);
        ctx.closePath();
        ctx.stroke();
      });
    }

    // Torch on pillar primed with wick
    if (p > 0.5) {
      ctx.strokeRect(340, 100, 20, 160);
      // Torch bracket
      ctx.beginPath();
      ctx.arc(350, 90, 12, 0, Math.PI * 2);
      ctx.stroke();
      // Smoke wisps
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(350, 75);
      ctx.quadraticCurveTo(365, 50, 350, 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#8a1c14';
      ctx.fillText('Fourteenth Night: The trap is sprung against its architect.', 60, 360);
    }
    ctx.restore();
  }

  // 7. Structural Collapse in the Inferno
  drawInfernoStructuralCollapse(ctx, p, w, h) {
    ctx.save();
    // Angular collapsing timber frames
    ctx.lineWidth = 3;
    if (p > 0.2) {
      ctx.beginPath();
      ctx.moveTo(60, 320);
      ctx.lineTo(240, 150); // Fallen beam
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(380, 320);
      ctx.lineTo(190, 180); // Crossed diagonal beam
      ctx.stroke();
    }

    // Charcoal smoke wash & flame contour hatching
    if (p > 0.5) {
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const fx = 80 + Math.random() * 280;
        const fy = 120 + Math.random() * 180;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + (Math.random() - 0.5) * 20, fy - 25);
        ctx.stroke();
      }

      // Safe escape hatch circle
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(280, 290, 28, 0, Math.PI * 2);
      ctx.stroke();
      // Arrow into hatch
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

  // 8. Ganga Moonlit Skiff & Water Reflections
  drawGangaMoonlitSkiff(ctx, p, w, h) {
    ctx.save();
    // River Horizon & Moon
    ctx.lineWidth = 1.5;
    if (p > 0.2) {
      ctx.beginPath();
      ctx.arc(360, 80, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Water lines
      for (let y = 180; y < 340; y += 18) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.bezierCurveTo(150, y - 5, 270, y + 5, 410, y);
        ctx.stroke();
      }
    }

    // The Skiff Hull
    if (p > 0.5) {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(110, 245);
      ctx.quadraticCurveTo(225, 280, 340, 240);
      ctx.lineTo(315, 260);
      ctx.quadraticCurveTo(225, 290, 130, 260);
      ctx.closePath();
      ctx.stroke();

      // Oar
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(210, 220);
      ctx.lineTo(290, 295);
      ctx.stroke();
    }

    if (p > 0.8) {
      ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#222830';
      ctx.fillText('Ganga at Midnight: Across the silver tides to freedom.', 65, 370);
    }
    ctx.restore();
  }

  // 9. Forest Canopy & The Pandava Vow
  drawForestCanopyFolio(ctx, p, w, h) {
    ctx.save();
    // Colossal Banyan Trunk & Roots
    ctx.lineWidth = 3;
    if (p > 0.2) {
      // Main trunk left
      ctx.beginPath();
      ctx.moveTo(90, 40);
      ctx.bezierCurveTo(80, 160, 60, 280, 40, 340);
      ctx.stroke();

      // Trunk right
      ctx.beginPath();
      ctx.moveTo(360, 40);
      ctx.bezierCurveTo(370, 160, 390, 280, 410, 340);
      ctx.stroke();
    }

    // Dense Canopy Vine Arches
    if (p > 0.5) {
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 5; r++) {
        ctx.beginPath();
        ctx.arc(225, 60 + r * 15, 120 + r * 20, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();
      }

      // Small central sacred fire in the forest
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(210, 310);
      ctx.lineTo(240, 310);
      ctx.stroke();
      // Little flame
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

  // Add realistic ink droplets and organic paper bleed
  addInkSpatter(ctx) {
    for (let i = 0; i < 6; i++) {
      const sx = 30 + Math.random() * 390;
      const sy = 40 + Math.random() * 340;
      const r = 0.8 + Math.random() * 2.2;
      ctx.fillStyle = 'rgba(24, 18, 14, ' + (0.15 + Math.random() * 0.35) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

window.InkSketchbookInstance = new InkSketchbook();
