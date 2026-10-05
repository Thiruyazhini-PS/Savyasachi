/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * PixiJS v8 Living Environment FX Engine & Cinematic Camera System
 * ==========================================================================
 */

import { Application, Container, Sprite, Graphics, Assets } from 'pixi.js';
import gsap from 'gsap';
import { AudioEngine } from '../audio/SpatialAudio';
import { getAssetUrl } from '../utils/assets';

export interface WindVector {
  x: number;
  y: number;
  gust: number; // 0 to 1
  time: number;
}

interface FXParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  rot: number;
  vRot: number;
  color: number;
  type: 'petal' | 'pollen' | 'dust' | 'mist' | 'bokeh';
  turbulence: number;
  depth: number; // 0 (far) to 1 (near)
}

interface LensSpeck {
  x: number;
  y: number;
  size: number;
  alpha: number;
  wiped: boolean;
}

export class WorldRenderer {
  private static instance: WorldRenderer;

  public app: Application | null = null;
  public isInitialized: boolean = false;

  // Parallax Containers (7 Depth Planes)
  public rootContainer: Container | null = null;
  public layerSkyFar: Container | null = null;       // Plane 1: Far Sky & Ganga
  public layerGodRays: Container | null = null;      // Plane 2: Volumetric Light Shafts
  public layerMidPalace: Container | null = null;    // Plane 3: Grand Gates & Teak Architecture
  public layerStage: Container | null = null;        // Plane 4: Interactive Floor & Characters
  public layerAtmosphere: Container | null = null;   // Plane 5: Drifting Marigolds & Pollen
  public layerForeground: Container | null = null;   // Plane 6: Foreground Bokeh & Banners
  public layerLens: Container | null = null;         // Plane 7: Interactive Lens Droplets/Dust

  private skySprite: Sprite | null = null;
  private palaceSprite: Sprite | null = null;
  private atmosphereGfx: Graphics | null = null;
  private foregroundGfx: Graphics | null = null;
  private godRaysGfx: Graphics | null = null;
  private lensGfx: Graphics | null = null;

  // FX Simulation State
  private particles: FXParticle[] = [];
  private lensSpecks: LensSpeck[] = [];
  private time: number = 0;
  private gustIntensity: number = 0;
  private gustTimer: number = 0;
  private isCinematicPlaying: boolean = false;
  private cinematicTimeline: gsap.core.Timeline | null = null;

  // Panning & Parallax state (Left, Center, Right views)
  public cameraPanAngle: number = 0; // -1 (Left), 0 (Center), +1 (Right)
  public targetPanOffset: number = 0;
  public currentPanOffset: number = 0;

  // Cinematic Camera offsets
  public cinematicZoom: number = 1.0;
  public cinematicPanX: number = 0;
  public cinematicPanY: number = 0;

  private mouseXRatio: number = 0;
  private mouseYRatio: number = 0;
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;
  private lastCursorX: number = 0;
  private lastCursorY: number = 0;

  private constructor() {}

  public static getInstance(): WorldRenderer {
    if (!WorldRenderer.instance) {
      WorldRenderer.instance = new WorldRenderer();
    }
    return WorldRenderer.instance;
  }

  public async init(canvasElement: HTMLCanvasElement) {
    if (this.isInitialized) return;

    this.app = new Application();
    await this.app.init({
      canvas: canvasElement,
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Build Depth Planes
    this.rootContainer = new Container();
    this.layerSkyFar = new Container();
    this.layerGodRays = new Container();
    this.layerMidPalace = new Container();
    this.layerStage = new Container();
    this.layerAtmosphere = new Container();
    this.layerForeground = new Container();
    this.layerLens = new Container();

    this.rootContainer.addChild(this.layerSkyFar);
    this.rootContainer.addChild(this.layerGodRays);
    this.rootContainer.addChild(this.layerMidPalace);
    this.rootContainer.addChild(this.layerStage);
    this.rootContainer.addChild(this.layerAtmosphere);
    this.rootContainer.addChild(this.layerForeground);
    this.rootContainer.addChild(this.layerLens);
    this.app.stage.addChild(this.rootContainer);

    this.godRaysGfx = new Graphics();
    this.layerGodRays.addChild(this.godRaysGfx);

    this.atmosphereGfx = new Graphics();
    this.layerAtmosphere.addChild(this.atmosphereGfx);

    this.foregroundGfx = new Graphics();
    this.layerForeground.addChild(this.foregroundGfx);

    this.lensGfx = new Graphics();
    this.layerLens.addChild(this.lensGfx);

    await this.loadPainterlyAssets();
    this.initParticleEngine();
    this.initLensSpecks();
    this.bindInteractions();

    // 60fps Master FX Clock & Parallax Ticker
    this.app.ticker.add((ticker) => {
      const dt = ticker.deltaTime;
      this.time += dt * 0.016;
      this.updateWindSystem(dt);
      this.updateParallax(dt);
      this.updateFXParticles(dt);
      this.drawGodRays();
      this.drawLensEffects();
    });

    this.isInitialized = true;
  }

  public currentRoomScene: number = 1;

  public async setRoomScene(roomNumber: number) {
    this.currentRoomScene = roomNumber;
    try {
      if (roomNumber === 2) {
        const hallTexture = await Assets.load(getAssetUrl('assets/room02_hall_wide.jpg'));
        if (!this.skySprite && this.layerSkyFar) {
          this.skySprite = new Sprite(hallTexture);
          this.skySprite.anchor.set(0.5, 0.5);
          this.layerSkyFar.addChild(this.skySprite);
        } else if (this.skySprite) {
          this.skySprite.texture = hallTexture;
          this.skySprite.visible = true;
          this.skySprite.alpha = 1.0;
        }
        if (this.palaceSprite) {
          this.palaceSprite.visible = false;
          this.palaceSprite.alpha = 0;
        }
      } else {
        const skyTexture = await Assets.load(getAssetUrl('assets/varanavata_sky_far.jpg'));
        const palaceTexture = await Assets.load(getAssetUrl('assets/varanavata_mid_palace.jpg'));
        if (this.skySprite) {
          this.skySprite.texture = skyTexture;
          this.skySprite.visible = true;
          this.skySprite.alpha = 1.0;
        }
        if (this.palaceSprite) {
          this.palaceSprite.texture = palaceTexture;
          this.palaceSprite.visible = true;
          this.palaceSprite.alpha = 1.0;
        }
      }
      this.resizeSprites();
    } catch (err) {
      console.warn("Could not swap painterly plate textures:", err);
    }
  }

  private async loadPainterlyAssets() {
    try {
      const skyTexture = await Assets.load(getAssetUrl('assets/varanavata_sky_far.jpg'));
      const palaceTexture = await Assets.load(getAssetUrl('assets/varanavata_mid_palace.jpg'));

      this.skySprite = new Sprite(skyTexture);
      this.skySprite.anchor.set(0.5, 0.5);
      this.layerSkyFar?.addChild(this.skySprite);

      this.palaceSprite = new Sprite(palaceTexture);
      this.palaceSprite.anchor.set(0.5, 0.5);
      this.layerMidPalace?.addChild(this.palaceSprite);

      this.resizeSprites();
      window.addEventListener('resize', () => this.resizeSprites());
    } catch (err) {
      console.warn("Could not load painterly plates directly, fallback to dynamic canvas:", err);
    }
  }

  public resizeSprites() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (this.skySprite) {
      const scale = Math.max((w * 1.35) / this.skySprite.texture.width, (h * 1.25) / this.skySprite.texture.height);
      this.skySprite.scale.set(scale);
      this.skySprite.x = w / 2;
      this.skySprite.y = h / 2;
    }

    if (this.palaceSprite) {
      const scale = Math.max((w * 1.28) / this.palaceSprite.texture.width, (h * 1.18) / this.palaceSprite.texture.height);
      this.palaceSprite.scale.set(scale);
      this.palaceSprite.x = w / 2;
      this.palaceSprite.y = h / 2 + 25;
    }
  }

  private bindInteractions() {
    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      this.mouseXRatio = (e.clientX - cx) / cx;
      this.mouseYRatio = (e.clientY - cy) / cy;

      // Wipe lens specks if mouse moves near them
      this.wipeLensAt(e.clientX, e.clientY);
      this.lastCursorX = e.clientX;
      this.lastCursorY = e.clientY;
    });
  }

  // =========================================================================
  // UNIFIED WIND & ATMOSPHERE ENGINE
  // =========================================================================
  private updateWindSystem(dt: number) {
    this.gustTimer += dt * 0.016;

    // Periodic wind gust wave every 7.5 seconds
    if (this.gustTimer > 7.5) {
      this.gustTimer = 0;
      // Trigger spatial whoosh
      AudioEngine.playWindGustWhoosh(-0.6, 0.6);
      gsap.to(this, {
        gustIntensity: 1.0,
        duration: 1.2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }
  }

  public getWindVector(): WindVector {
    const baseSpeed = 1.4;
    const gustBoost = this.gustIntensity * 3.2;
    const wx = (baseSpeed + gustBoost) * (1 + Math.sin(this.time * 2.5) * 0.25);
    const wy = 0.5 * Math.cos(this.time * 1.8);
    return {
      x: wx,
      y: wy,
      gust: this.gustIntensity,
      time: this.time,
    };
  }

  private initParticleEngine() {
    this.particles = [];
    const count = 90;
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: 'petal' | 'pollen' | 'dust' | 'bokeh' = 'dust';
      let size = 1.5;
      let alpha = 0.4;
      let color = 0xffd54f;

      if (rand < 0.45) {
        type = 'petal';
        size = 3.5 + Math.random() * 4.5;
        alpha = 0.65 + Math.random() * 0.35;
        color = Math.random() > 0.4 ? 0xf58220 : 0xe65100; // Marigold orange & saffron
      } else if (rand < 0.75) {
        type = 'pollen';
        size = 1.2 + Math.random() * 2.0;
        alpha = 0.35 + Math.random() * 0.45;
        color = 0xffeb3b; // Golden pollen
      } else if (rand < 0.90) {
        type = 'bokeh';
        size = 14.0 + Math.random() * 18.0; // Large out-of-focus foreground bokeh
        alpha = 0.12 + Math.random() * 0.18;
        color = 0xff9800;
      } else {
        type = 'dust';
        size = 1.0 + Math.random() * 1.8;
        alpha = 0.3 + Math.random() * 0.3;
        color = 0xfff9c4;
      }

      this.particles.push({
        x: Math.random() * (w + 200) - 100,
        y: Math.random() * (h + 100) - 50,
        vx: 0.6 + Math.random() * 1.2,
        vy: 0.4 + Math.random() * 1.0,
        size,
        alpha,
        baseAlpha: alpha,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.05,
        color,
        type,
        turbulence: Math.random() * 10,
        depth: type === 'bokeh' ? 0.95 : Math.random(),
      });
    }
  }

  private initLensSpecks() {
    this.lensSpecks = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 18; i++) {
      this.lensSpecks.push({
        x: 40 + Math.random() * (w - 80),
        y: 40 + Math.random() * (h - 80),
        size: 2.0 + Math.random() * 4.5,
        alpha: 0.15 + Math.random() * 0.25,
        wiped: false,
      });
    }
  }

  private wipeLensAt(cx: number, cy: number) {
    this.lensSpecks.forEach((speck) => {
      if (speck.wiped) return;
      const dist = Math.hypot(speck.x - cx, speck.y - cy);
      if (dist < 45) {
        speck.wiped = true;
        // Slowly regenerate somewhere else after 10s
        setTimeout(() => {
          speck.x = 40 + Math.random() * (window.innerWidth - 80);
          speck.y = 40 + Math.random() * (window.innerHeight - 80);
          speck.alpha = 0.15 + Math.random() * 0.25;
          speck.wiped = false;
        }, 10000);
      }
    });
  }

  private updateFXParticles(dt: number) {
    if (!this.atmosphereGfx || !this.foregroundGfx) return;
    this.atmosphereGfx.clear();
    this.foregroundGfx.clear();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const wind = this.getWindVector();

    this.particles.forEach((p) => {
      // Wind acceleration influenced by particle depth and gust
      const depthMultiplier = 0.5 + p.depth * 0.8;
      p.x += (wind.x * depthMultiplier + Math.sin(this.time + p.turbulence) * 0.6) * dt;
      p.y += (wind.y * depthMultiplier + p.vy) * dt;
      p.rot += (p.vRot + wind.gust * 0.05) * dt;

      // Wrap around edges seamlessly
      if (p.x > w + 40) p.x = -30;
      if (p.x < -40) p.x = w + 30;
      if (p.y > h + 40) p.y = -30;

      // Target graphics context based on layer
      const targetGfx = p.type === 'bokeh' ? this.foregroundGfx : this.atmosphereGfx;

      if (p.type === 'petal') {
        // Asymmetric marigold petal shape
        targetGfx!.ellipse(p.x, p.y, p.size, p.size * 0.55);
        targetGfx!.fill({ color: p.color, alpha: p.alpha * (1 + wind.gust * 0.3) });
      } else if (p.type === 'bokeh') {
        // Soft glowing out-of-focus foreground bokeh circle
        targetGfx!.circle(p.x, p.y, p.size);
        targetGfx!.fill({ color: p.color, alpha: p.alpha * (0.8 + Math.sin(this.time * 2 + p.turbulence) * 0.2) });
      } else {
        // Pollen or dust mote
        targetGfx!.circle(p.x, p.y, p.size);
        targetGfx!.fill({ color: p.color, alpha: p.alpha });
      }
    });
  }

  private drawGodRays() {
    if (!this.godRaysGfx) return;
    this.godRaysGfx.clear();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const pulse = 0.08 + Math.sin(this.time * 0.8) * 0.03;

    // 3 Golden Volumetric Sunbeams piercing through the palace gateway from the top-right
    const rays = [
      { startX: w * 0.85, widthTop: 45, widthBottom: 190, targetX: w * 0.25 },
      { startX: w * 0.72, widthTop: 35, widthBottom: 160, targetX: w * 0.12 },
      { startX: w * 0.95, widthTop: 55, widthBottom: 230, targetX: w * 0.42 },
    ];

    rays.forEach((ray) => {
      this.godRaysGfx!.moveTo(ray.startX, 0);
      this.godRaysGfx!.lineTo(ray.startX + ray.widthTop, 0);
      this.godRaysGfx!.lineTo(ray.targetX + ray.widthBottom, h);
      this.godRaysGfx!.lineTo(ray.targetX, h);
      this.godRaysGfx!.closePath();
      this.godRaysGfx!.fill({ color: 0xffe082, alpha: pulse });
    });
  }

  private drawLensEffects() {
    if (!this.lensGfx) return;
    this.lensGfx.clear();

    this.lensSpecks.forEach((speck) => {
      if (speck.wiped) return;
      // Soft translucent lens droplet or dust speck
      this.lensGfx!.circle(speck.x, speck.y, speck.size);
      this.lensGfx!.fill({ color: 0xfff8e1, alpha: speck.alpha });
    });
  }

  // =========================================================================
  // CAMERA PANNING, PARALLAX & CINEMATIC PUSH-IN
  // =========================================================================
  public panCamera(direction: number) {
    this.cameraPanAngle = Math.max(-1, Math.min(1, this.cameraPanAngle + direction));
    const panRange = window.innerWidth * 0.22;
    this.targetPanOffset = -this.cameraPanAngle * panRange;
  }

  private updateParallax(delta: number) {
    this.currentMouseX += (this.mouseXRatio - this.currentMouseX) * 0.05 * delta;
    this.currentMouseY += (this.mouseYRatio - this.currentMouseY) * 0.05 * delta;
    this.currentPanOffset += (this.targetPanOffset - this.currentPanOffset) * 0.08 * delta;

    const maxMouseShift = 28;

    // Apply Root Container Camera Transform (combines pan + cinematic zoom)
    if (this.rootContainer) {
      this.rootContainer.scale.set(this.cinematicZoom);
      this.rootContainer.pivot.x = window.innerWidth / 2;
      this.rootContainer.pivot.y = window.innerHeight / 2;
      this.rootContainer.x = window.innerWidth / 2 + this.cinematicPanX;
      this.rootContainer.y = window.innerHeight / 2 + this.cinematicPanY;
    }

    // Plane 1: Far Sky & Ganga (Subtle parallax)
    if (this.layerSkyFar) {
      this.layerSkyFar.x = this.currentPanOffset * 0.2 + this.currentMouseX * maxMouseShift * 0.2;
      this.layerSkyFar.y = this.currentMouseY * maxMouseShift * 0.2;
    }

    // Plane 2: God Rays (Follows sky)
    if (this.layerGodRays) {
      this.layerGodRays.x = this.currentPanOffset * 0.35 + this.currentMouseX * maxMouseShift * 0.3;
    }

    // Plane 3: Palace Gate Architecture (Medium parallax)
    if (this.layerMidPalace) {
      this.layerMidPalace.x = this.currentPanOffset * 0.65 + this.currentMouseX * maxMouseShift * 0.65;
      this.layerMidPalace.y = this.currentMouseY * maxMouseShift * 0.5;
    }

    // Plane 4: Interactive Floor & Characters
    if (this.layerStage) {
      this.layerStage.x = this.currentPanOffset * 1.0 + this.currentMouseX * maxMouseShift * 1.0;
      this.layerStage.y = this.currentMouseY * maxMouseShift * 0.8;
    }

    // Plane 6: Foreground Bokeh (High parallax drift)
    if (this.layerForeground) {
      this.layerForeground.x = this.currentPanOffset * 1.35 + this.currentMouseX * maxMouseShift * 1.4;
    }
  }

  // =========================================================================
  // ROOM 1 ENTRANCE CINEMATIC (5-10s, skippable)
  // =========================================================================
  public playEntranceCinematic(onComplete: () => void) {
    this.isCinematicPlaying = true;

    // Start with conch horn blast
    AudioEngine.playConchBlast();
    setTimeout(() => {
      AudioEngine.playTempleBell(587.33); // D5
    }, 1200);

    // Initial cinematic camera placement (low angle, pushed in on Ganga riverbank)
    this.cinematicZoom = 1.32;
    this.cinematicPanX = -120;
    this.cinematicPanY = 45;

    this.cinematicTimeline = gsap.timeline({
      onComplete: () => {
        this.isCinematicPlaying = false;
        this.cinematicTimeline = null;
        onComplete();
      },
    });

    // 1. Slow cinematic crane and push: gliding across riverbank toward the palace gates
    this.cinematicTimeline.to(this, {
      cinematicZoom: 1.0,
      cinematicPanX: 0,
      cinematicPanY: 0,
      duration: 6.8,
      ease: 'power2.inOut',
    });

    // 2. Midpoint signature FX: Sudden wind gust flurry of marigolds across screen
    this.cinematicTimeline.call(
      () => {
        AudioEngine.playWindGustWhoosh(-0.7, 0.7);
        gsap.to(this, { gustIntensity: 1.0, duration: 1.0, yoyo: true, repeat: 1 });
      },
      [],
      2.5
    );
  }

  public skipEntranceCinematic() {
    if (this.cinematicTimeline) {
      this.cinematicTimeline.kill();
      this.cinematicTimeline = null;
    }
    this.cinematicZoom = 1.0;
    this.cinematicPanX = 0;
    this.cinematicPanY = 0;
    this.isCinematicPlaying = false;
  }

  // =========================================================================
  // ROOM 2 ENTRANCE CINEMATIC (6s, skippable)
  // Shot by Shot:
  // 0.0s: Heavy cedar doors ease open
  // 0.5s: Floor camera slow rise
  // 1.5s: Hall reveal, light shafts, dust motes, curtains swell inward east
  // 2.5s: Leaning lamp flames to Kunti touching pillar
  // 3.5s: Pan up to gallery: Purochana smiles down
  // 4.5s: Quick eye-line cut toward east wall
  // 5.5s: Camera settles to player starting view, handover
  // =========================================================================
  public playRoom2EntranceCinematic(onComplete: () => void) {
    this.isCinematicPlaying = true;

    // 0.0s Sound of heavy cedar doors easing open
    AudioEngine.playWoodCreak();
    setTimeout(() => AudioEngine.playLatchSnap(), 300);

    // Initial low angle
    this.cinematicZoom = 1.35;
    this.cinematicPanX = -45;
    this.cinematicPanY = 55;

    this.cinematicTimeline = gsap.timeline({
      onComplete: () => {
        this.isCinematicPlaying = false;
        this.cinematicTimeline = null;
        onComplete();
      },
    });

    // 0.5s - 1.5s: Camera rises from floor level into hall
    this.cinematicTimeline.to(this, {
      cinematicPanY: 10,
      cinematicZoom: 1.15,
      duration: 1.5,
      ease: 'power2.out',
    });

    // 1.5s - 2.8s: Pan toward leaning lamp flame and east wall curtains
    this.cinematicTimeline.to(this, {
      cinematicPanX: 75,
      duration: 1.3,
      ease: 'sine.inOut',
    });

    // Eastward draft whoosh
    this.cinematicTimeline.call(() => {
      AudioEngine.playWindGustWhoosh(0.6, 0.4);
      gsap.to(this, { gustIntensity: 0.9, duration: 0.8, yoyo: true, repeat: 1 });
    }, [], 2.0);

    // 2.8s - 4.5s: Pan up to upper gallery mezzanine (Purochana looking down)
    this.cinematicTimeline.to(this, {
      cinematicPanY: -40,
      cinematicPanX: 25,
      cinematicZoom: 1.05,
      duration: 1.7,
      ease: 'power1.inOut',
    });

    // 4.5s - 5.5s: Settle down to default view
    this.cinematicTimeline.to(this, {
      cinematicPanX: 0,
      cinematicPanY: 0,
      cinematicZoom: 1.0,
      duration: 1.0,
      ease: 'power2.out',
    });
  }

  public skipRoom2EntranceCinematic() {
    if (this.cinematicTimeline) {
      this.cinematicTimeline.kill();
      this.cinematicTimeline = null;
    }
    this.cinematicZoom = 1.0;
    this.cinematicPanX = 0;
    this.cinematicPanY = 0;
    this.isCinematicPlaying = false;
  }
}

export const WorldEngine = WorldRenderer.getInstance();
