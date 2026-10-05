/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Spatial Audio Engine & Story Soundscape Director
 * ==========================================================================
 */

import { MusicState } from '../types';

export class AudioDirector {
  private static instance: AudioDirector;

  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public ambientGain: GainNode | null = null;
  public sfxGain: GainNode | null = null;
  public musicGain: GainNode | null = null;

  public voiceGain: GainNode | null = null;

  public volumes = {
    master: 0.75,
    music: 0.45,
    ambient: 0.65,
    sfx: 0.75,
    voice: 0.8,
  };

  public isMuted: boolean = false;
  public captionsEnabled: boolean = true;
  public currentRoomId: number = 1;
  public currentMusicState: MusicState = 'NORMAL';
  public activeNodes: AudioNode[] = [];
  public ambientOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  public isInitialized: boolean = false;
  private heartbeatInterval: any = null;

  private constructor() {
    this.loadSavedSettings();
  }

  public static getInstance(): AudioDirector {
    if (!AudioDirector.instance) {
      AudioDirector.instance = new AudioDirector();
    }
    return AudioDirector.instance;
  }

  public loadSavedSettings() {
    try {
      const saved = localStorage.getItem('chakravyuha_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.volumes) this.volumes = { ...this.volumes, ...parsed.volumes };
        if (typeof parsed.isMuted === 'boolean') this.isMuted = parsed.isMuted;
        if (typeof parsed.captionsEnabled === 'boolean') this.captionsEnabled = parsed.captionsEnabled;
      }
    } catch (_) {}
  }

  public saveSettings() {
    try {
      localStorage.setItem('chakravyuha_audio_settings', JSON.stringify({
        volumes: this.volumes,
        isMuted: this.isMuted,
        captionsEnabled: this.captionsEnabled,
      }));
    } catch (_) {}
  }

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Output
      this.masterGain = this.ctx.createGain();
      const masterTarget = this.isMuted ? 0 : this.volumes.master;
      this.masterGain.gain.setValueAtTime(masterTarget, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.volumes.ambient, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(this.volumes.voice, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startRoomAmbiance(this.currentRoomId);
    } catch (err) {
      console.warn("AudioContext init deferred until user gesture:", err);
    }
  }

  public toggleMute(): boolean {
    return this.setMute(!this.isMuted);
  }

  public setMute(muted: boolean): boolean {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const target = this.isMuted ? 0.0001 : this.volumes.master;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08); // ~300ms smooth fade
    }
    this.saveSettings();
    return this.isMuted;
  }

  public setBusVolume(bus: 'master' | 'music' | 'ambient' | 'sfx' | 'voice', value: number) {
    const val = Math.max(0, Math.min(1, value));
    this.volumes[bus] = val;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      switch (bus) {
        case 'master':
          if (!this.isMuted && this.masterGain) this.masterGain.gain.setTargetAtTime(val, now, 0.05);
          break;
        case 'music':
          if (this.musicGain) this.musicGain.gain.setTargetAtTime(val, now, 0.05);
          break;
        case 'ambient':
          if (this.ambientGain) this.ambientGain.gain.setTargetAtTime(val, now, 0.05);
          break;
        case 'sfx':
          if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(val, now, 0.05);
          break;
        case 'voice':
          if (this.voiceGain) this.voiceGain.gain.setTargetAtTime(val, now, 0.05);
          break;
      }
    }
    this.saveSettings();
  }

  public setCaptionsEnabled(enabled: boolean) {
    this.captionsEnabled = enabled;
    this.saveSettings();
  }

  public triggerCaption(text: string) {
    if (!this.captionsEnabled) return;
    window.dispatchEvent(new CustomEvent('audio-caption', { detail: { text } }));
  }

  public playPaperTurn() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playInkClick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public playHeartbeat() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Lub (first beat: 60Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(58, now);
    osc1.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Dub (second beat: 50Hz, slightly quieter, 180ms later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(50, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(32, now + 0.32);
    gain2.gain.setValueAtTime(0.24, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.36);

    this.triggerCaption("✦ [Heartbeat quickens with rising danger]");
  }

  public setHeartbeatActive(active: boolean) {
    if (active) {
      if (!this.heartbeatInterval) {
        this.playHeartbeat();
        this.heartbeatInterval = setInterval(() => {
          this.playHeartbeat();
        }, 1200);
      }
    } else {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }

  public startRoomAmbiance(roomId: number) {
    if (!this.ctx || !this.ambientGain) return;
    this.currentRoomId = roomId;

    // Gracefully fade out existing ambient generators
    this.ambientOscillators.forEach((node) => {
      try {
        if ('stop' in node) node.stop(this.ctx!.currentTime + 0.6);
      } catch (_) {}
    });
    this.ambientOscillators = [];

    // Synthesize room-specific acoustic world
    switch (roomId) {
      case 1: // Varanavata - Royal festival, tambura drone, warm breeze
        this.createTamburaDrone([146.83, 220.0, 293.66], 0.25);
        this.createWindAmbiance(220, 0.1);
        break;

      case 2: // Lakshagriha - Reverberant grand palace, subtle tension pulse
        this.createPalaceResonance(110, 0.3);
        this.createWindAmbiance(180, 0.12);
        break;

      case 3: // Materials Vault - Ominous subterranean chemical hum, quiet stillness
        this.createSubtleDrone(73.42, 0.35);
        this.createCracklingTexture(0.04);
        break;

      case 4: // Vidura's Enigma - Temple bell resonance, ancient parchment wind
        this.createBellEchoes();
        this.createSubtleDrone(98.0, 0.25);
        break;

      case 5: // The Tunnel - Subterranean drip, deep subterranean hum
        this.createSubtleDrone(55.0, 0.4);
        this.createWaterDrips();
        break;

      case 6: // Last Night - Tense banquet drone, accelerated faint heartbeat
        this.createTenseHeartbeat();
        this.createTamburaDrone([110, 164.81], 0.2);
        break;

      case 7: // The Inferno - Roaring flames, rising wind, crackling embers
        this.createInfernoNoise();
        break;

      case 8: // Ganga at Midnight - Gentle river wave laps, nocturnal crickets, moonlit breeze
        this.createRiverWaves();
        this.createNightInsects();
        break;

      case 9: // Forest - Rustling ancient canopy, deep silence, dawn birds
        this.createForestWind();
        break;

      default:
        this.createSubtleDrone(110, 0.2);
    }
  }

  // 3D Spatial Panner (HRTF Left/Right/Distance)
  public createSpatialPanner(xPan: number = 0): StereoPannerNode | GainNode {
    if (!this.ctx) return {} as any;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, xPan)), this.ctx.currentTime);
      return panner;
    }
    return this.ctx.createGain();
  }

  // Sound as a Clue: Wall Tap Resonance (Hollow vs Solid)
  public playWallTap(isHollow: boolean = false, xPos: number = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.createSpatialPanner(xPos);

    if (isHollow) {
      // Deep hollow resonance with longer decaying body (75Hz-140Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + 0.38);

      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      this.triggerCaption("(hollow knock)");
    } else {
      // Flat solid cedar thud (30Hz-90Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      this.triggerCaption("(dull knock)");
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.48);
  }

  // Tactile Cord Knot Tick
  public playCordTick() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Tactile Brass Notch Click (Lotus Plate Rotation)
  public playBrassNotchClick() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
    this.triggerCaption("✦ [brass notch clicks]");
  }

  // Parchment Rustle
  public playParchmentRustle() {
    this.playPaperTurn();
    this.triggerCaption("✦ [parchment unrolls]");
  }

  // Spatial Footsteps
  public playFootstep(xPos: number = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.createSpatialPanner(xPos);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Ink Scratch Sound
  public playInkStroke() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800 + Math.random() * 300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  // Discovery Chime
  public playDiscoveryChime() {
    if (!this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.22, this.ctx!.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(this.ctx!.currentTime + idx * 0.08);
      osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.7);
    });
  }

  // Room Breakthrough Rumble
  public playBreakthroughSound() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  // Mechanical Tumbler Click (Sharp, metallic, tactile)
  public playMechanicalClick(detune: number = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Transient click pulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2600 + detune, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);

    // Subtle metallic brass resonance ring
    const ring = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(3200 + detune, now);

    ringGain.gain.setValueAtTime(0.18, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    ring.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ring.start(now);
    ring.stop(now + 0.09);
  }

  // Heavy Wood Creak (Crate lid opening, timber stress)
  public playWoodCreak() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);
    osc.frequency.linearRampToValueAtTime(80, now + 0.55);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Heavy Brass Latch Snap (Lock release)
  public playLatchSnap() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Deep metal impact
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    thumpGain.gain.setValueAtTime(0.7, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    thump.connect(thumpGain);
    thumpGain.connect(this.sfxGain);
    thump.start(now);
    thump.stop(now + 0.16);

    // Brass spring ring
    const ring = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(1650, now);

    ringGain.gain.setValueAtTime(0.35, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    ring.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ring.start(now);
    ring.stop(now + 0.45);
  }

  // Spatial Wind Gust Whoosh
  public playWindGustWhoosh(panStart: number = -0.7, panEnd: number = 0.7) {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.8;
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(220, now + 1.9);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : this.ctx.createGain();
    if ('pan' in panner) {
      panner.pan.setValueAtTime(panStart, now);
      panner.pan.linearRampToValueAtTime(panEnd, now + 2.0);
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.ambientGain);

    noise.start(now);
    noise.stop(now + 2.1);
  }

  // Ceremonial Conch Horn (Shankha) Blast
  public playConchBlast() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(215, now);
    osc.frequency.exponentialRampToValueAtTime(285, now + 0.7);
    osc.frequency.linearRampToValueAtTime(270, now + 3.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.linearRampToValueAtTime(950, now + 0.8);
    filter.frequency.linearRampToValueAtTime(500, now + 3.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 3.6);
  }

  // Resonant Temple Bell
  public playTempleBell(freq: number = 660) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [freq, freq * 1.5, freq * 2.2].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.2 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8 + i * 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 2.4);
    });
  }


  // Heavy Stone Sliding Open / Counterweight Drop
  public playStoneSlide() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy low rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(55, now);
    rumble.frequency.linearRampToValueAtTime(85, now + 0.6);
    rumble.frequency.linearRampToValueAtTime(40, now + 1.2);

    rumbleGain.gain.setValueAtTime(0.4, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);
    rumble.start(now);
    rumble.stop(now + 1.35);

    // Counterweight clank at 0.5s
    setTimeout(() => {
      if (this.ctx && this.sfxGain) {
        this.playLatchSnap();
      }
    }, 500);

    this.triggerCaption("(counterweight releases · panel glides open)");
  }

  // The SILENCE Mechanic (music drops, crowd muffled, breath & wood remain)
  public triggerDramaticSilence(durationSeconds: number = 2.5) {
    if (!this.ctx || !this.ambientGain) return;
    const prevVol = this.ambientGain.gain.value;
    this.ambientGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 0.08);

    setTimeout(() => {
      if (this.ctx && this.ambientGain) {
        this.ambientGain.gain.setTargetAtTime(prevVol, this.ctx.currentTime, 0.6);
      }
    }, durationSeconds * 1000);
  }

  // Synthesizers
  private createTamburaDrone(pitches: number[], vol: number) {
    if (!this.ctx || !this.ambientGain) return;
    pitches.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx!.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(vol / pitches.length, this.ctx!.currentTime + 2.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain!);

      osc.start();
      this.ambientOscillators.push(osc);
    });
  }

  private createPalaceResonance(freq: number, vol: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start();
    this.ambientOscillators.push(osc);
  }

  private createWindAmbiance(cutoff: number, vol: number) {
    if (!this.ctx || !this.ambientGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2.0);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    whiteNoise.start();
    this.ambientOscillators.push(whiteNoise);
  }

  private createSubtleDrone(freq: number, vol: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start();
    this.ambientOscillators.push(osc);
  }

  private createCracklingTexture(vol: number) {
    if (!this.ctx || !this.ambientGain) return;
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() > 0.985 ? Math.random() * 2 - 1 : 0;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);

    noise.connect(gain);
    gain.connect(this.ambientGain);
    noise.start();
    this.ambientOscillators.push(noise);
  }

  private createWaterDrips() {
    const interval = setInterval(() => {
      if (this.currentRoomId !== 5 || !this.ctx) {
        clearInterval(interval);
        return;
      }
      if (Math.random() > 0.4) {
        this.playDripSound((Math.random() - 0.5) * 1.6);
      }
    }, 1800);
  }

  private playDripSound(panX: number = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.createSpatialPanner(panX);

    const freq = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  private createBellEchoes() {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 4.0);
  }

  private createTenseHeartbeat() {
    const beatInterval = setInterval(() => {
      if (this.currentRoomId !== 6 || !this.ctx) {
        clearInterval(beatInterval);
        return;
      }
      this.playHeartThump();
      setTimeout(() => this.playHeartThump(0.7), 240);
    }, 1200);
  }

  private playHeartThump(scale: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.4 * scale, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  private createInfernoNoise() {
    if (!this.ctx || !this.ambientGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const flameNoise = this.ctx.createBufferSource();
    flameNoise.buffer = noiseBuffer;
    flameNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    flameNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    flameNoise.start();
    this.ambientOscillators.push(flameNoise);

    this.createCracklingTexture(0.22);
  }

  private createRiverWaves() {
    this.createWindAmbiance(320, 0.25);
  }

  private createNightInsects() {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4500, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start();
    this.ambientOscillators.push(osc);
  }

  private createForestWind() {
    this.createWindAmbiance(240, 0.28);
  }
}

export const AudioEngine = AudioDirector.getInstance();
