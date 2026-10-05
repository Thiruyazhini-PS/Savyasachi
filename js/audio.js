/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Spatial & Narrative Web Audio Engine
 * ==========================================================================
 */

class StoryAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    
    this.isMuted = false;
    this.currentRoomId = 1;
    this.currentMood = 'NORMAL';
    this.activeNodes = [];
    this.ambientOscillators = [];
    
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startRoomAmbiance(this.currentRoomId);
    } catch (e) {
      console.warn("Web Audio could not initialize directly:", e);
    }
  }

  toggleMute() {
    if (!this.ctx) return false;
    this.isMuted = !this.isMuted;
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    return this.isMuted;
  }

  // Set the narrative room soundscape
  startRoomAmbiance(roomId) {
    if (!this.ctx) return;
    this.currentRoomId = roomId;

    // Fade out and clear existing ambient nodes
    this.ambientOscillators.forEach(node => {
      try {
        if (node.stop) node.stop(this.ctx.currentTime + 0.8);
      } catch (err) {}
    });
    this.ambientOscillators = [];

    // Synthesize room-specific acoustic world
    const now = this.ctx.currentTime;
    
    switch (roomId) {
      case 1: // Varanavata - Royal festival, tambura drone, warm breeze
        this.createTamburaDrone([146.83, 220, 293.66], 0.25);
        this.createWindAmbiance(220, 0.1);
        break;

      case 2: // Lakshagriha - Reverberant grand palace, subtle tension pulse
        this.createPalaceResonance(110, 0.3);
        this.createWindAmbiance(180, 0.12);
        break;

      case 3: // Materials - Ominous subterranean chemical hum, quiet stillness
        this.createSubtleDrone(73.42, 0.35); // Deep D
        this.createCracklingTexture(0.04);
        break;

      case 4: // Vidura's Enigma - Temple bell resonance, ancient parchment wind
        this.createBellEchoes();
        this.createSubtleDrone(98.0, 0.25);
        break;

      case 5: // The Tunnel - Subterranean drip, deep subterranean hum, spatial draft
        this.createSubterraneanEcho();
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

      case 9: // Forest - Rustling ancient canopy, deep silence, distant echoes
        this.createForestWind();
        break;

      default:
        this.createSubtleDrone(110, 0.2);
    }
  }

  // Procedural Sound Generator: Tambura Drone
  createTamburaDrone(pitches, vol) {
    pitches.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol / pitches.length, this.ctx.currentTime + 2.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start();
      this.ambientOscillators.push(osc);
    });
  }

  // Procedural Sound Generator: Palace Resonance
  createPalaceResonance(freq, vol) {
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

  // Procedural Sound Generator: Wind Ambiance
  createWindAmbiance(cutoff, vol) {
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

  // Procedural Sound Generator: Subterranean deep drone
  createSubtleDrone(freq, vol) {
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

  // Procedural Sound Generator: Crackling Embers & Texture
  createCracklingTexture(vol) {
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() > 0.985 ? (Math.random() * 2 - 1) : 0;
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

  // Procedural Sound Generator: Underground Water Drips
  createWaterDrips() {
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

  playDripSound(panX = 0) {
    if (!this.ctx) return;
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

  // Procedural Sound Generator: Temple Bell Echoes
  createBellEchoes() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, this.ctx.currentTime); // Solfeggio frequency

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 4.0);
  }

  // Procedural Sound Generator: Tense Heartbeat
  createTenseHeartbeat() {
    const beatInterval = setInterval(() => {
      if (this.currentRoomId !== 6 || !this.ctx) {
        clearInterval(beatInterval);
        return;
      }
      this.playHeartThump();
      setTimeout(() => this.playHeartThump(0.7), 240);
    }, 1200);
  }

  playHeartThump(scale = 1.0) {
    if (!this.ctx) return;
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

  // Procedural Sound Generator: Roaring Inferno
  createInfernoNoise() {
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

  // Procedural Sound Generator: Ganga River Waves
  createRiverWaves() {
    this.createWindAmbiance(320, 0.25);
  }

  // Procedural Sound Generator: Nocturnal Crickets
  createNightInsects() {
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

  // Procedural Sound Generator: Forest Wind
  createForestWind() {
    this.createWindAmbiance(240, 0.28);
  }

  createSubterraneanEcho() {
    this.createSubtleDrone(55, 0.4);
  }

  // 3D Spatial Panner helper
  createSpatialPanner(xPan = 0) {
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, xPan)), this.ctx.currentTime);
      return panner;
    }
    // Fallback gain
    return this.ctx.createGain();
  }

  // SFX: Tap Wall & Listen for Hollow vs Solid Resonance
  playWallTap(isHollow = false, xPos = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.createSpatialPanner(xPos);

    if (isHollow) {
      // Hollow resonant drum-like pitch with decaying echo
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    } else {
      // Dull solid thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  // SFX: Spatial NPC Footsteps
  playFootstep(xPos = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.createSpatialPanner(xPos);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // SFX: Ink Pen stroke / manuscript scratching
  playInkStroke() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800 + Math.random() * 300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  // SFX: Clue Discovery Chime
  playDiscoveryChime() {
    if (!this.ctx) return;
    const pitches = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C arpeggio
    pitches.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.7);
    });
  }

  // SFX: Room Breakthrough Thunderous Mechanism
  playBreakthroughSound() {
    if (!this.ctx) return;
    // Low rumble + metallic scrape
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  // Silence as a Gameplay Mechanic (sudden hush when critical truth is uncovered)
  triggerDramaticSilence(durationSeconds = 2.5) {
    if (!this.ctx) return;
    const prevVol = this.ambientGain.gain.value;
    this.ambientGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 0.1);

    setTimeout(() => {
      if (this.ctx) {
        this.ambientGain.gain.setTargetAtTime(prevVol, this.ctx.currentTime, 0.5);
      }
    }, durationSeconds * 1000);
  }

  // Drishti Mode Sound: High frequency acoustic hum
  startDrishtiSound() {
    if (!this.ctx) return;
    this.drishtiOsc = this.ctx.createOscillator();
    this.drishtiGain = this.ctx.createGain();

    this.drishtiOsc.type = 'sine';
    this.drishtiOsc.frequency.setValueAtTime(880, this.ctx.currentTime);
    this.drishtiOsc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.5);

    this.drishtiGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.drishtiGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.3);

    this.drishtiOsc.connect(this.drishtiGain);
    this.drishtiGain.connect(this.sfxGain);
    this.drishtiOsc.start();
  }

  stopDrishtiSound() {
    if (this.drishtiGain && this.ctx) {
      this.drishtiGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      setTimeout(() => {
        try { if (this.drishtiOsc) this.drishtiOsc.stop(); } catch(e){}
      }, 250);
    }
  }
}

window.StoryAudio = new StoryAudioEngine();
