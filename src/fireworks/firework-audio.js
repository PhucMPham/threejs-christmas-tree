/**
 * FireworkAudio - WebAudio synthesis for firework sound effects
 * Provides per-type audio with lazy AudioContext initialization
 * Integrates with existing localStorage mute pattern
 */

import { FIREWORK_TYPE } from './firework-types.js';

// Storage key matching existing audio pattern
const STORAGE_KEY = 'fireworkAudioMuted';
const DEFAULT_VOLUME = 0.3;
const MAX_CONCURRENT_SOUNDS = 10;

/**
 * FireworkAudio class - singleton audio manager for fireworks
 */
export class FireworkAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.activeSounds = 0;

    // Load saved mute state
    this.loadMuteState();
  }

  /**
   * Lazy initialize AudioContext
   * Call on first user interaction to avoid autoplay restrictions
   */
  init() {
    if (this.isInitialized) return true;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('WebAudio not supported');
        return false;
      }

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // Set initial volume based on mute state
      this.masterGain.gain.value = this.isMuted ? 0 : DEFAULT_VOLUME;

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('AudioContext init failed:', err);
      return false;
    }
  }

  /**
   * Resume AudioContext (required for iOS Safari)
   * Call on user gesture when context is suspended
   */
  async resume() {
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }
  }

  /**
   * Play sound for firework type
   * @param {number} type - FIREWORK_TYPE enum value
   */
  play(type) {
    if (!this.isInitialized || this.isMuted) return;
    if (this.activeSounds >= MAX_CONCURRENT_SOUNDS) return;

    // Resume if suspended (iOS Safari)
    if (this.ctx.state === 'suspended') {
      this.resume();
      return;
    }

    switch (type) {
      case FIREWORK_TYPE.BLOOM:
        this.playBloom();
        break;
      case FIREWORK_TYPE.SPARK:
        this.playSpark();
        break;
      case FIREWORK_TYPE.DRIFT:
        this.playDrift();
        break;
      case FIREWORK_TYPE.SCATTER:
        this.playScatter();
        break;
      case FIREWORK_TYPE.SPARKLER:
        this.playSparkler();
        break;
      default:
        this.playSpark();
    }
  }

  /**
   * Bloom sound - soft shimmer (sine sweep 3000-5000Hz, 0.3s)
   */
  playBloom() {
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.exponentialRampToValueAtTime(5000, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.trackSound();
    osc.onended = () => this.releaseSound();

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Spark sound - sharp pop (noise impulse, 0.1s decay)
   */
  playSpark() {
    const now = this.ctx.currentTime;

    // Create impulse using noise buffer
    const sampleRate = this.ctx.sampleRate;
    const bufferLength = Math.floor(sampleRate * 0.1);
    const buffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    // Exponential decay noise
    for (let i = 0; i < bufferLength; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.02));
    }

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    source.connect(gain);
    gain.connect(this.masterGain);

    this.trackSound();
    source.onended = () => this.releaseSound();

    source.start(now);
  }

  /**
   * Drift sound - floating whistle (frequency modulation, 0.5s)
   */
  playDrift() {
    const now = this.ctx.currentTime;

    // Main oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    // LFO for frequency modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    // LFO setup - slow wobble
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    lfoGain.gain.value = 200; // Modulation depth

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Main oscillator - whistle tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    // Envelope
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    oscGain.gain.setValueAtTime(0.15, now + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    this.trackSound();
    osc.onended = () => this.releaseSound();

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.55);
    osc.stop(now + 0.55);
  }

  /**
   * Scatter sound - crackling burst (layered short pops)
   */
  playScatter() {
    const now = this.ctx.currentTime;

    // Multiple short pops with random offsets
    for (let i = 0; i < 5; i++) {
      const offset = Math.random() * 0.1;
      this.scheduleCrackle(now + offset, 0.15 - i * 0.02);
    }
  }

  /**
   * Schedule a single crackle pop
   * @param {number} time - Start time
   * @param {number} volume - Relative volume
   */
  scheduleCrackle(time, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 200 + Math.random() * 400;

    gain.gain.setValueAtTime(Math.max(0.01, volume), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.trackSound();
    osc.onended = () => this.releaseSound();

    osc.start(time);
    osc.stop(time + 0.04);
  }

  /**
   * Sparkler sound - continuous fizzle (noise with periodic crackles)
   */
  playSparkler() {
    const now = this.ctx.currentTime;
    const duration = 0.4;

    // White noise base
    const sampleRate = this.ctx.sampleRate;
    const bufferLength = Math.floor(sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    // Generate fizzle noise with crackle overlay
    for (let i = 0; i < bufferLength; i++) {
      // Base noise
      let sample = (Math.random() * 2 - 1) * 0.3;

      // Periodic crackle spikes
      if (Math.random() < 0.005) {
        sample += (Math.random() - 0.5) * 1.5;
      }

      // Slight fade out
      const envelope = 1 - (i / bufferLength) * 0.5;
      noiseData[i] = sample * envelope;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter for fizzy character
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    this.trackSound();
    noiseSource.onended = () => this.releaseSound();

    noiseSource.start(now);
  }

  /**
   * Track active sound count
   */
  trackSound() {
    this.activeSounds++;
  }

  /**
   * Release sound slot
   */
  releaseSound() {
    this.activeSounds = Math.max(0, this.activeSounds - 1);
  }

  /**
   * Set master volume (0-1)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    if (!this.masterGain) return;
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Mute audio
   */
  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
    this.saveMuteState();
  }

  /**
   * Unmute audio
   */
  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = DEFAULT_VOLUME;
    }
    this.saveMuteState();
  }

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  /**
   * Load mute state from localStorage
   */
  loadMuteState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.isMuted = saved === 'true';
    } catch (err) {
      // localStorage not available
      this.isMuted = false;
    }
  }

  /**
   * Save mute state to localStorage
   */
  saveMuteState() {
    try {
      localStorage.setItem(STORAGE_KEY, String(this.isMuted));
    } catch (err) {
      // localStorage not available
    }
  }

  /**
   * Get mute state
   * @returns {boolean}
   */
  getMuted() {
    return this.isMuted;
  }

  /**
   * Dispose audio resources
   */
  dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.isInitialized = false;
    this.activeSounds = 0;
  }
}

// Singleton instance
let instance = null;

/**
 * Get singleton FireworkAudio instance
 * @returns {FireworkAudio}
 */
export function getFireworkAudio() {
  if (!instance) {
    instance = new FireworkAudio();
  }
  return instance;
}

/**
 * Initialize audio on user interaction
 * Call from click/touch event handler
 */
export function initFireworkAudio() {
  const audio = getFireworkAudio();
  audio.init();
  audio.resume();
  return audio;
}
