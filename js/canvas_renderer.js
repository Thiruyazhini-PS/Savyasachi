/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Living World Canvas Rendering Engine: Atmospheric Lighting,
 * Dynamic Particles, Animated Silhouettes, & Environmental Physics
 * ==========================================================================
 */

class LivingWorldRenderer {
  constructor() {
    this.canvas = document.getElementById('world-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.ambientCreatures = [];
    this.animationId = null;
    this.currentRoomId = 1;
    this.time = 0;
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.getElementById('world-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.setupRoomParticles(this.currentRoomId);
  }

  setRoom(roomId) {
    this.currentRoomId = roomId;
    this.setupRoomParticles(roomId);
  }

  setupRoomParticles(roomId) {
    this.particles = [];
    this.ambientCreatures = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * (this.canvas ? this.canvas.width : 1200),
        y: Math.random() * (this.canvas ? this.canvas.height : 800),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.5,
        size: 1.5 + Math.random() * 3.5,
        alpha: 0.2 + Math.random() * 0.7,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.05
      });
    }

    // Add ambient background entities (birds, boat, rats, embers)
    if (roomId === 1 || roomId === 8 || roomId === 9) {
      for (let i = 0; i < 4; i++) {
        this.ambientCreatures.push({
          x: Math.random() * 1000,
          y: 80 + Math.random() * 140,
          vx: 1.2 + Math.random() * 0.8,
          wingPhase: Math.random() * Math.PI * 2,
          type: 'bird'
        });
      }
    } else if (roomId === 3) {
      // Scurrying shadow rats in the storage vaults
      for (let i = 0; i < 3; i++) {
        this.ambientCreatures.push({
          x: 200 + Math.random() * 600,
          y: window.innerHeight - 100,
          vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random()),
          type: 'rat'
        });
      }
    }
  }

  startLoop() {
    const render = () => {
      this.time += 0.016;
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    this.animationId = requestAnimationFrame(render);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Draw atmospheric dynamic background gradient according to room mood
    this.drawRoomAtmosphere(ctx, w, h);

    // 2. Draw architectural silhouettes & room backdrop features
    this.drawRoomBackdrop(ctx, w, h);

    // 3. Update & render ambient creatures
    this.drawAmbientCreatures(ctx, w, h);

    // 4. Update & render atmospheric living particles (petals, embers, dust, mist)
    this.drawParticles(ctx, w, h);

    // 5. Draw dynamic torchlight flickers & shadow cast
    this.drawDynamicLighting(ctx, w, h);
  }

  drawRoomAtmosphere(ctx, w, h) {
    const t = this.time;
    let grad;

    switch (this.currentRoomId) {
      case 1: // Varanavata: Warm golden sunset & marigold sky
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#3a2012');
        grad.addColorStop(0.5, '#75401d');
        grad.addColorStop(1, '#1b120c');
        break;

      case 2: // Lakshagriha: Grand interior, royal cedar tones
        grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 80, w * 0.5, h * 0.5, Math.max(w, h));
        grad.addColorStop(0, '#2c1e13');
        grad.addColorStop(0.6, '#170f0a');
        grad.addColorStop(1, '#090604');
        break;

      case 3: // Materials Vault: Ominous sulfur yellow-amber and dark stone
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a140a');
        grad.addColorStop(0.7, '#241a0b');
        grad.addColorStop(1, '#0c0804');
        break;

      case 4: // Vidura's Enigma: Meditative deep charcoal & warm solitary lamp
        grad = ctx.createRadialGradient(w * 0.58, h * 0.48, 40, w * 0.5, h * 0.5, Math.max(w, h));
        grad.addColorStop(0, '#332415');
        grad.addColorStop(0.4, '#15100c');
        grad.addColorStop(1, '#070504');
        break;

      case 5: // The Tunnel: Subterranean earthy brown, dripping stalactite darkness
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#100c0a');
        grad.addColorStop(0.6, '#1e140d');
        grad.addColorStop(1, '#080503');
        break;

      case 6: // Banquet Night: Restless stormy dusk, dark violet & amber torches
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1d1224');
        grad.addColorStop(0.5, '#2e1919');
        grad.addColorStop(1, '#100908');
        break;

      case 7: // The Inferno: Blazing violent orange, crimson, and rolling black smoke
        grad = ctx.createLinearGradient(0, 0, 0, h);
        const flicker = Math.sin(t * 12) * 0.05;
        grad.addColorStop(0, `rgba(255, 60, 0, ${0.45 + flicker})`);
        grad.addColorStop(0.4, `rgba(180, 20, 0, ${0.6 + flicker})`);
        grad.addColorStop(1, '#1c0803');
        break;

      case 8: // Ganga at Midnight: Deep moonlit sapphire, silver ripples
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a1524');
        grad.addColorStop(0.5, '#0e2238');
        grad.addColorStop(1, '#050b12');
        break;

      case 9: // Forest: Ancient emerald-tinted misty dawn
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#12251a');
        grad.addColorStop(0.5, '#193324');
        grad.addColorStop(1, '#09130d');
        break;

      default:
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#241a12');
        grad.addColorStop(1, '#0a0806');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawRoomBackdrop(ctx, w, h) {
    const t = this.time;
    ctx.save();

    if (this.currentRoomId === 1) {
      // Distant Varanavata palace spires & celebratory pennants
      ctx.fillStyle = 'rgba(20, 14, 10, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.7);
      ctx.lineTo(w * 0.25, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.7);
      ctx.lineTo(w * 0.75, h * 0.4);
      ctx.lineTo(w, h * 0.65);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Swaying silk garlands
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const sway = Math.sin(t * 1.5 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(w * (i * 0.33), 40);
        ctx.quadraticCurveTo(w * (i * 0.33 + 0.16), 110 + sway, w * (i * 0.33 + 0.33), 40);
        ctx.stroke();
      }
    } else if (this.currentRoomId === 2) {
      // Lakshagriha majestic columns
      ctx.fillStyle = 'rgba(16, 12, 9, 0.65)';
      const colWidth = 60;
      for (let x = 80; x < w; x += 220) {
        ctx.fillRect(x, 0, colWidth, h * 0.85);
        // Column capitals
        ctx.fillRect(x - 15, 0, colWidth + 30, 35);
      }
    } else if (this.currentRoomId === 5) {
      // Subterranean rough shale walls
      ctx.fillStyle = 'rgba(12, 9, 7, 0.8)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 80) {
        ctx.lineTo(x, 60 + Math.sin(x * 0.02) * 20);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.currentRoomId === 8) {
      // Silver full moon & rippling water
      ctx.fillStyle = '#e8f2fc';
      ctx.shadowColor = '#8bc34a';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.22, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // River surface lines
      ctx.strokeStyle = 'rgba(214, 235, 255, 0.15)';
      ctx.lineWidth = 1.5;
      for (let y = h * 0.65; y < h; y += 18) {
        const wave = Math.sin(t * 2 + y * 0.05) * 12;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.lineTo(w, y + wave);
        ctx.stroke();
      }
    } else if (this.currentRoomId === 9) {
      // Peepal & Banyan tree silhouettes
      ctx.fillStyle = 'rgba(6, 15, 8, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.3);
      ctx.quadraticCurveTo(w * 0.2, h * 0.15, w * 0.35, h * 0.45);
      ctx.lineTo(w * 0.35, h);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, h);
      ctx.lineTo(w, h * 0.25);
      ctx.quadraticCurveTo(w * 0.75, h * 0.1, w * 0.65, h * 0.4);
      ctx.lineTo(w * 0.65, h);
      ctx.fill();
    }

    ctx.restore();
  }

  drawAmbientCreatures(ctx, w, h) {
    const t = this.time;
    ctx.save();
    this.ambientCreatures.forEach(c => {
      if (c.type === 'bird') {
        c.x += c.vx;
        if (c.x > w + 50) c.x = -50;
        const wing = Math.sin(t * 8 + c.wingPhase) * 6;

        ctx.strokeStyle = 'rgba(25, 18, 14, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c.x - 8, c.y + wing);
        ctx.quadraticCurveTo(c.x, c.y - 2, c.x + 8, c.y + wing);
        ctx.stroke();
      } else if (c.type === 'rat') {
        c.x += c.vx;
        if (c.x < 100 || c.x > w - 100) c.vx *= -1;

        ctx.fillStyle = 'rgba(10, 8, 6, 0.8)';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  drawParticles(ctx, w, h) {
    ctx.save();
    const isFireRoom = this.currentRoomId === 7;
    const isGangaRoom = this.currentRoomId === 8;
    const isForestRoom = this.currentRoomId === 9;

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;

      // Wrap around bounds
      if (p.y < -20) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -20) p.x = w + 10;
      if (p.x > w + 20) p.x = -10;

      if (isFireRoom) {
        // Floating incandescent sparks & embers
        ctx.fillStyle = Math.random() > 0.3 ? '#ff9800' : '#ff3d00';
        ctx.shadowColor = '#ff5722';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (isGangaRoom) {
        // Drifting river mist or fireflies
        ctx.fillStyle = `rgba(180, 220, 255, ${p.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (isForestRoom) {
        // Falling emerald peepal leaves
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(100, 160, 110, ${p.alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Golden dust motes & flower petals
        ctx.fillStyle = `rgba(240, 210, 140, ${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  drawDynamicLighting(ctx, w, h) {
    const t = this.time;
    ctx.save();

    // Torch / Lantern light source in center-right
    const lampX = w * 0.65;
    const lampY = h * 0.45;
    const flicker = Math.sin(t * 15) * 15 + Math.sin(t * 23) * 8;
    const radius = 260 + flicker;

    const radial = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, radius);
    if (this.currentRoomId === 7) {
      radial.addColorStop(0, 'rgba(255, 120, 30, 0.45)');
      radial.addColorStop(0.7, 'rgba(200, 40, 10, 0.2)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (this.currentRoomId === 8) {
      radial.addColorStop(0, 'rgba(180, 220, 255, 0.25)');
      radial.addColorStop(0.8, 'rgba(30, 60, 100, 0.1)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      radial.addColorStop(0, 'rgba(255, 200, 100, 0.35)');
      radial.addColorStop(0.6, 'rgba(200, 130, 50, 0.15)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(lampX, lampY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.LivingWorldRendererInstance = new LivingWorldRenderer();
