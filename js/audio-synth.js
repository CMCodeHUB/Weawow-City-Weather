/* ==========================================================================
   PIXEL ART CITY WEATHER DASHBOARD - AUDIO SYNTHESIZER
   Procedural Web Audio API Sound Generation (No external files needed)
   ========================================================================== */

class WeatherAudioSynth {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;
    
    // Ambient sound nodes
    this.rainSource = null;
    this.rainGain = null;
    this.rainFilter = null;
    
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.droneFilter = null;
    
    this.windSource = null;
    this.windGain = null;
    this.windFilter = null;

    this.isInitialized = false;
    this.currentWeatherType = 'clear';
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
      this.setupAmbientGenerators();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupAmbientGenerators() {
    if (!this.ctx) return;

    // --- 1. PROCEDURAL RAIN GENERATOR (Pink/Brown noise with Low-Pass filter) ---
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainSource.start();

    // --- 2. PROCEDURAL LO-FI CITY DRONE / SYNTH AMBIENCE ---
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // E2 fifth

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // --- 3. PROCEDURAL WIND GENERATOR ---
    const windBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      windData[i] = (Math.random() * 2 - 1) * 0.05;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = windBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windSource.start();

    // Gently modulate wind filter frequency for natural breeze gusts
    this.animateWindBreeze();
  }

  animateWindBreeze() {
    if (!this.ctx || !this.windFilter) return;
    const now = this.ctx.currentTime;
    const targetFreq = 300 + Math.random() * 500;
    this.windFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + 3 + Math.random() * 4);
    setTimeout(() => {
      if (this.ctx) this.animateWindBreeze();
    }, 4000);
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.35, now + 0.15);
    }
    return !this.isMuted;
  }

  setVolume(vol) {
    if (!this.masterGain || !this.ctx) return;
    if (!this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  updateWeatherSound(condition, windSpeed = 10) {
    if (!this.ctx || !this.isInitialized) return;
    this.currentWeatherType = condition;
    const now = this.ctx.currentTime;

    // Rain intensity
    if (['rain', 'thunderstorm', 'drizzle'].includes(condition)) {
      const targetRainGain = condition === 'thunderstorm' ? 0.35 : condition === 'drizzle' ? 0.12 : 0.25;
      const targetFilter = condition === 'thunderstorm' ? 1800 : 950;
      this.rainGain.gain.linearRampToValueAtTime(targetRainGain, now + 1.5);
      this.rainFilter.frequency.linearRampToValueAtTime(targetFilter, now + 1.5);
    } else {
      this.rainGain.gain.linearRampToValueAtTime(0, now + 1.0);
    }

    // Wind intensity
    const windNormalized = Math.min(1, windSpeed / 40);
    const targetWindGain = condition === 'thunderstorm' ? 0.28 : windNormalized * 0.15;
    this.windGain.gain.linearRampToValueAtTime(targetWindGain, now + 1.5);
  }

  // --- INTERACTIVE SFX: WINDOW CLICK CHIME ---
  playWindowClick(isOn) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Pentatonic scale frequencies for charming retro sound
    const tones = isOn ? [523.25, 659.25, 783.99, 1046.50] : [783.99, 659.25, 523.25, 392.00];
    const freq = tones[Math.floor(Math.random() * tones.length)];
    
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * (isOn ? 1.05 : 0.95), now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- INTERACTIVE SFX: STREET LAMP FLICKER / CLICK ---
  playLampClick() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // --- INTERACTIVE SFX: PIXEL CAT MEOW ---
  playCatMeow() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(750, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.48);
  }

  // --- INTERACTIVE SFX: THUNDER CLAP & RUMBLE ---
  playThunder() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 1.8);

    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 2.1);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.7));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + 2.0);
  }

  // --- INTERACTIVE SFX: UI BLIP ---
  playUiBeep() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }
}

// Global instance
window.weatherAudio = new WeatherAudioSynth();
