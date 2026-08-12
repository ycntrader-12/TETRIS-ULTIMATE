/**
 * TETRIS ULTIMATE — Audio & Voice Engine
 * 1. Moteur Audio Multi-Pistes (Rock Linkin Park, Synthwave, Chiptune Arcade, Heavy Metal)
 * 2. Voix marocaine (Darija) via Web Speech API avec fallback intelligent
 */

class TetrisAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.6;
    this.level = 1;

    // Distorsion
    this.distortionCurve = this.makeDistortionCurve(50);

    // ── PISTES MUSICALES (8 PISTES AU TOTAL) ──
    this.currentTrackIdx = 0;
    this.tracks = [
      { name: "1. ROCK NU-METAL", bpm: 146 },
      { name: "2. SYNTHWAVE 80s", bpm: 132 },
      { name: "3. CHIPTUNE ARCADE", bpm: 150 },
      { name: "4. HEAVY METAL", bpm: 160 },
      { name: "5. CYBERPUNK DRIFT", bpm: 142 },
      { name: "6. PHONK DRIFT", bpm: 138 },
      { name: "7. DUBSTEP ELECTRO", bpm: 145 },
      { name: "8. HYPERPOP GLITCH", bpm: 154 }
    ];

    this.bpm = this.tracks[0].bpm;
    this.beatInterval = null;
    this.beatCount = 0;
    this.riffIdx = 0;
    this.chordIdx = 0;

    // ── DONNÉES PISTE 1 : ROCK NU-METAL (Style Linkin Park) ──
    this.rockLeadRiff = [
      293.66, 349.23, 329.63, 293.66, 261.63, 293.66, 349.23, 440.00,
      349.23, 329.63, 293.66, 261.63, 220.00, 261.63, 293.66, 293.66,
      440.00, 523.25, 440.00, 349.23, 329.63, 349.23, 440.00, 523.25,
      587.33, 523.25, 440.00, 349.23, 329.63, 293.66, 261.63, 293.66
    ];
    this.rockPowerChords = [
      73.42, 73.42, 73.42, 73.42,
      87.31, 87.31, 87.31, 87.31,
      65.41, 65.41, 65.41, 65.41,
      58.27, 58.27, 65.41, 73.42
    ];

    // ── DONNÉES PISTE 2 : SYNTHWAVE CYBERPUNK ──
    this.synthwaveRiff = [
      220.00, 329.63, 440.00, 523.25, 659.25, 523.25, 440.00, 329.63,
      174.61, 261.63, 349.23, 440.00, 523.25, 440.00, 349.23, 261.63,
      196.00, 293.66, 392.00, 493.88, 587.33, 493.88, 392.00, 293.66,
      164.81, 246.94, 329.63, 392.00, 493.88, 392.00, 329.63, 246.94
    ];
    this.synthwaveBass = [
      110.00, 110.00, 110.00, 110.00,
      87.31,  87.31,  87.31,  87.31,
      98.00,  98.00,  98.00,  98.00,
      82.41,  82.41,  82.41,  82.41
    ];

    // ── DONNÉES PISTE 3 : 8-BIT CHIPTUNE ARCADE ──
    this.chiptuneMelody = [
      659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00,
      523.25, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33, 659.25,
      523.25, 440.00, 440.00, 587.33, 698.46, 880.00, 783.99, 698.46,
      659.25, 523.25, 659.25, 587.33, 523.25, 493.88, 523.25, 440.00
    ];
    this.chiptuneBass = [
      220.00, 220.00, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
      220.00, 220.00, 164.81, 164.81, 174.61, 174.61, 220.00, 220.00
    ];

    // ── DONNÉES PISTE 4 : HEAVY METALCORE ──
    this.metalRiff = [
      146.83, 146.83, 293.66, 146.83, 174.61, 146.83, 196.00, 174.61,
      146.83, 146.83, 293.66, 146.83, 261.63, 220.00, 196.00, 174.61,
      146.83, 146.83, 349.23, 146.83, 329.63, 146.83, 293.66, 261.63,
      220.00, 196.00, 174.61, 164.81, 146.83, 146.83, 146.83, 146.83
    ];

    // ── DONNÉES PISTE 5 : CYBERPUNK DRIFT ──
    this.cyberDriftRiff = [
      220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63,
      293.66, 261.63, 220.00, 196.00, 220.00, 261.63, 329.63, 440.00
    ];

    // ── DONNÉES PISTE 6 : PHONK DRIFT (Cowbell Synth) ──
    this.phonkRiff = [
      349.23, 415.30, 466.16, 523.25, 554.37, 523.25, 466.16, 415.30,
      349.23, 466.16, 523.25, 554.37, 622.25, 554.37, 523.25, 466.16
    ];

    // ── DONNÉES PISTE 7 : DUBSTEP ELECTRO (Wobble Bass) ──
    this.dubstepBass = [
      82.41, 82.41, 98.00, 98.00, 110.00, 110.00, 123.47, 146.83
    ];

    // ── DONNÉES PISTE 8 : HYPERPOP GLITCH (Fast Arp) ──
    this.hyperpopArp = [
      523.25, 659.25, 783.99, 987.77, 1046.50, 783.99, 659.25, 523.25,
      587.33, 698.46, 880.00, 1046.50, 1174.66, 880.00, 698.46, 587.33
    ];
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  async init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.45;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.75;
      this.sfxGain.connect(this.masterGain);

      this.reverb = await this.createReverb();
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.18;
      this.musicGain.connect(this.reverbGain);
      this.reverbGain.connect(this.reverb);
      this.reverb.connect(this.masterGain);

      return true;
    } catch (e) {
      console.warn('Audio non disponible:', e);
      return false;
    }
  }

  async createReverb() {
    const convolver = this.ctx.createConvolver();
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 1.2;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.0);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  start() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopIntroMusic();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.riffIdx = 0;
    this.chordIdx = 0;
    this.beatCount = 0;
    this._scheduleBeat();
  }

  stop() {
    this.isPlaying = false;
    if (this.beatInterval) {
      clearTimeout(this.beatInterval);
      this.beatInterval = null;
    }
  }

  // ── MUSIQUE CINÉMATIQUE DE CONSTRUCTION ──
  startIntroMusic() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stop();
    this.isIntroPlaying = true;
    this.introStep = 0;
    this._scheduleIntroBeat();
  }

  stopIntroMusic() {
    this.isIntroPlaying = false;
    if (this.introBeatInterval) {
      clearTimeout(this.introBeatInterval);
      this.introBeatInterval = null;
    }
  }

  _scheduleIntroBeat() {
    if (!this.isIntroPlaying || !this.ctx) return;
    const bpm = 142;
    const interval = (60 / bpm) * 500;

    const t = this.ctx.currentTime;
    const notes = [
      146.83, 174.61, 220.00, 293.66, 349.23, 440.00, 587.33, 698.46,
      587.33, 440.00, 349.23, 293.66, 220.00, 174.61, 146.83, 110.00
    ];
    const freq = notes[this.introStep % notes.length];
    this.introStep++;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600 + (this.introStep % 8) * 220, t);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.24, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(filter); filter.connect(env); env.connect(this.musicGain);
    osc.start(t); osc.stop(t + 0.2);

    if (this.introStep % 2 === 0) this._playRockDrum('kick');
    if (this.introStep % 4 === 2) this._playRockDrum('snare');
    this.autoMusicTimer = null;
    this.autoMusicIntervalSeconds = 30;
    this.onAutoTrackChange = null;
  }

  startAutoMusicSwitch(callback) {
    this.stopAutoMusicSwitch();
    this.onAutoTrackChange = callback;
    if (this.autoMusicIntervalSeconds <= 0) return;

    this.autoMusicTimer = setInterval(() => {
      if (this.isPlaying && !this.isMuted) {
        const next = this.nextTrack();
        if (typeof this.onAutoTrackChange === 'function') {
          this.onAutoTrackChange(next);
        }
      }
    }, this.autoMusicIntervalSeconds * 1000);
  }

  stopAutoMusicSwitch() {
    if (this.autoMusicTimer) {
      clearInterval(this.autoMusicTimer);
      this.autoMusicTimer = null;
    }
  }

  setAutoMusicInterval(seconds) {
    this.autoMusicIntervalSeconds = seconds;
    if (this.autoMusicTimer) {
      this.startAutoMusicSwitch(this.onAutoTrackChange);
    }
  }

  nextTrack() {
    this.currentTrackIdx = (this.currentTrackIdx + 1) % this.tracks.length;
    this.setLevel(this.level);
    return this.tracks[this.currentTrackIdx];
  }

  getCurrentTrackName() {
    return this.tracks[this.currentTrackIdx].name;
  }

  setLevel(level) {
    this.level = level;
    const baseBpm = this.tracks[this.currentTrackIdx].bpm;
    this.bpm = baseBpm + (level - 1) * 5;
  }

  setVolume(v) {
    this.volume = v / 100;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime + 0.05
      );
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime + 0.1
      );
    }
    return this.isMuted;
  }

  // ── EFFETS SONORES AVANCÉS (T-SPIN, BACK-TO-BACK, POWER-UP, ACHIEVEMENTS) ──
  playTSpin() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.25, t + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.2);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.22);
    });
  }

  playBackToBack() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.25);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.04); osc.stop(t + i * 0.04 + 0.28);
    });
  }

  playPowerUp() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.3);
  }

  playAchievement() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.25);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.28);
    });
  }

  _scheduleBeat() {
    if (!this.isPlaying) return;
    const interval = (60 / this.bpm) * 500;

    switch (this.currentTrackIdx) {
      case 0: // Rock Nu-Metal
        this._playRockLead();
        if (this.beatCount % 2 === 0) this._playPowerChord();
        if (this.beatCount % 4 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        if (this.beatCount % 2 === 1) this._playRockDrum('hihat');
        if (this.beatCount % 16 === 0) this._playRockDrum('crash');
        break;

      case 1: // Synthwave
        this._playSynthwaveRiff();
        if (this.beatCount % 2 === 0) this._playSynthwaveBass();
        if (this.beatCount % 4 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        if (this.beatCount % 2 === 1) this._playRockDrum('hihat');
        break;

      case 2: // 8-Bit Chiptune Arcade
        this._playChiptuneMelody();
        if (this.beatCount % 2 === 0) this._playChiptuneBass();
        if (this.beatCount % 4 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        break;

      case 3: // Heavy Metal
        this._playMetalRiff();
        if (this.beatCount % 2 === 0 || this.beatCount % 4 === 1) this._playRockDrum('kick'); // Double-kick
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        if (this.beatCount % 2 === 1) this._playRockDrum('hihat');
        break;

      case 4: // 5. Cyberpunk Drift
        this._playCyberDrift();
        if (this.beatCount % 4 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        if (this.beatCount % 2 === 1) this._playRockDrum('hihat');
        break;

      case 5: // 6. Phonk Drift (Cowbell)
        this._playPhonkRiff();
        if (this.beatCount % 2 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        break;

      case 6: // 7. Dubstep Electro (Wobble)
        this._playDubstepBass();
        if (this.beatCount % 4 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        if (this.beatCount % 2 === 1) this._playRockDrum('hihat');
        break;

      case 7: // 8. Hyperpop Glitch
        this._playHyperpopArp();
        if (this.beatCount % 4 === 0) this._playRockDrum('kick');
        if (this.beatCount % 4 === 2) this._playRockDrum('snare');
        if (this.beatCount % 2 === 1) this._playRockDrum('hihat');
        break;
    }

    this.beatCount++;
    this.beatInterval = setTimeout(() => this._scheduleBeat(), interval);
  }

  // ── PISTES AVANCÉES 5 A 8 ──
  _playCyberDrift() {
    const freq = this.cyberDriftRiff[this.riffIdx % this.cyberDriftRiff.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.42;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  _playPhonkRiff() {
    const freq = this.phonkRiff[this.riffIdx % this.phonkRiff.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.35;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, t);
    filter.Q.value = 2;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  _playDubstepBass() {
    const freq = this.dubstepBass[this.chordIdx % this.dubstepBass.length];
    this.chordIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.75;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.5);
    filter.frequency.exponentialRampToValueAtTime(400, t + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);

    osc.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  _playHyperpopArp() {
    const freq = this.hyperpopArp[this.riffIdx % this.hyperpopArp.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.38;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  // ── PISTE 1 : ROCK LEAD & POWER CHORDS ──
  _playRockLead() {
    const freq = this.rockLeadRiff[this.riffIdx % this.rockLeadRiff.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.48;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 2, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);

    const envGain = this.ctx.createGain();
    envGain.gain.setValueAtTime(0, t);
    envGain.gain.linearRampToValueAtTime(0.14, t + 0.01);
    envGain.gain.exponentialRampToValueAtTime(0.04, t + dur * 0.7);
    envGain.gain.linearRampToValueAtTime(0, t + dur);

    osc1.connect(filter); osc2.connect(filter); filter.connect(envGain); envGain.connect(this.musicGain);
    osc1.start(t); osc2.start(t); osc1.stop(t + dur + 0.04); osc2.stop(t + dur + 0.04);
  }

  _playPowerChord() {
    const rootFreq = this.rockPowerChords[this.chordIdx % this.rockPowerChords.length];
    this.chordIdx++;
    const fifthFreq = rootFreq * 1.4983;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.9;

    const oscRoot = this.ctx.createOscillator(); oscRoot.type = 'sawtooth'; oscRoot.frequency.setValueAtTime(rootFreq, t);
    const oscFifth = this.ctx.createOscillator(); oscFifth.type = 'sawtooth'; oscFifth.frequency.setValueAtTime(fifthFreq, t);

    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.distortionCurve;
    distortion.oversample = '4x';

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(1400, t);

    const envGain = this.ctx.createGain();
    envGain.gain.setValueAtTime(0, t);
    envGain.gain.linearRampToValueAtTime(0.22, t + 0.02);
    envGain.gain.exponentialRampToValueAtTime(0.09, t + dur * 0.6);
    envGain.gain.linearRampToValueAtTime(0, t + dur);

    oscRoot.connect(distortion); oscFifth.connect(distortion);
    distortion.connect(filter); filter.connect(envGain); envGain.connect(this.musicGain);
    oscRoot.start(t); oscFifth.start(t); oscRoot.stop(t + dur + 0.05); oscFifth.stop(t + dur + 0.05);
  }

  // ── PISTE 2 : SYNTHWAVE ──
  _playSynthwaveRiff() {
    const freq = this.synthwaveRiff[this.riffIdx % this.synthwaveRiff.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.4;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  _playSynthwaveBass() {
    const freq = this.synthwaveBass[this.chordIdx % this.synthwaveBass.length];
    this.chordIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.85;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.05, t + dur);

    osc.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // ── PISTE 3 : 8-BIT CHIPTUNE ──
  _playChiptuneMelody() {
    const freq = this.chiptuneMelody[this.riffIdx % this.chiptuneMelody.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.42;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  _playChiptuneBass() {
    const freq = this.chiptuneBass[this.chordIdx % this.chiptuneBass.length];
    this.chordIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.8;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq / 2, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  // ── PISTE 4 : HEAVY METALCORE ──
  _playMetalRiff() {
    const freq = this.metalRiff[this.riffIdx % this.metalRiff.length];
    this.riffIdx++;
    const t = this.ctx.currentTime;
    const dur = (60 / this.bpm) * 0.4;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.distortionCurve;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);

    osc.connect(distortion); distortion.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // ── BATTERIE ──
  _playRockDrum(type) {
    const t = this.ctx.currentTime;

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(g); g.connect(this.musicGain);
      osc.start(t); osc.stop(t + 0.25);

    } else if (type === 'snare') {
      const bufSize = this.ctx.sampleRate * 0.14;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.9;

      const gNoise = this.ctx.createGain();
      gNoise.gain.setValueAtTime(0.45, t);
      gNoise.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(filter); filter.connect(gNoise); gNoise.connect(this.musicGain);
      noise.start(t); noise.stop(t + 0.2);

      const tone = this.ctx.createOscillator();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(220, t);
      tone.frequency.exponentialRampToValueAtTime(90, t + 0.1);

      const gTone = this.ctx.createGain();
      gTone.gain.setValueAtTime(0.5, t);
      gTone.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      tone.connect(gTone); gTone.connect(this.musicGain);
      tone.start(t); tone.stop(t + 0.14);

    } else if (type === 'hihat') {
      const bufSize = this.ctx.sampleRate * 0.05;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter); filter.connect(g); g.connect(this.musicGain);
      noise.start(t); noise.stop(t + 0.08);

    } else if (type === 'crash') {
      const bufSize = this.ctx.sampleRate * 0.6;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      noise.connect(filter); filter.connect(g); g.connect(this.musicGain);
      noise.start(t); noise.stop(t + 0.6);
    }
  }

  // ── EFFETS SONORES (SFX) ──
  playMove() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(320, t + 0.04);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.06);
  }

  playRotate() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(700, t + 0.06);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.1);
  }

  playDrop() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.18);
  }

  playLineClear(lines) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const freqs = lines === 4
      ? [523.25, 659.25, 783.99, 1046.5]
      : [440, 523.25, 659.25];

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.06);
      g.gain.linearRampToValueAtTime(0.35, t + i * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.22);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.26);
    });
  }

  playLevelUp() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.25, t + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.18);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.22);
    });
  }

  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [440, 392, 349, 330, 294, 220];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.35, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.3);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.35);
    });
  }

  playHold() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [330, 440].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, t + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.1);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.12);
    });
  }

  // ── EFFETS CINÉMATIQUES INTRO (SONS HEAVY BREAK & BRIS DE VERRE) ──
  playGlassBreak() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 0.45;

    // Bruit blanc passe-haut (fissures et verre qui claque)
    const bufSize = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(10000, t + dur);

    const gNoise = this.ctx.createGain();
    gNoise.gain.setValueAtTime(0.55, t);
    gNoise.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter); filter.connect(gNoise); gNoise.connect(this.sfxGain);
    noise.start(t); noise.stop(t + dur);

    // Éclats de verre métalliques (Tonalités aiguës résonantes)
    const glassShards = [3200, 4800, 6400, 8200, 9600];
    glassShards.forEach((freq, idx) => {
      const delay = idx * 0.02;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + delay + 0.15);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.25, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);

      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + delay); osc.stop(t + delay + 0.2);
    });
  }

  playHeavyBreak() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub Boom + Crash de structure
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);

    const dist = this.ctx.createWaveShaper();
    dist.curve = this.distortionCurve;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(dist); dist.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.6);

    // Déclencher le son bris de verre simultanément !
    this.playGlassBreak();
  }

  playIntroImpact() {
    this.playHeavyBreak();
  }

  playIntroLaser() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 2500;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(filter); filter.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.4);
  }

  // ── EFFET SONORE ARC ÉLECTRIQUE ──
  playElectricArc() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 0.6;

    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(140, t);
    carrier.frequency.linearRampToValueAtTime(60, t + dur);

    modulator.type = 'square';
    modulator.frequency.setValueAtTime(85, t);

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(500, t);

    modulator.connect(carrier.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.Q.value = 3;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.65, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    carrier.connect(filter); filter.connect(g); g.connect(this.sfxGain);
    modulator.start(t); carrier.start(t);
    modulator.stop(t + dur); carrier.stop(t + dur);

    this.playGlassBreak();
  }

  playIntroClimax() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Déclencher décharge électrique et bris de verre !
    this.playElectricArc();
    this._playRockDrum('crash');

    const freqs = [146.83, 220.00, 293.66, 440.00, 587.33];
    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t); osc.stop(t + 0.85);
    });
  }
}

window.TetrisAudio = TetrisAudio;

// ══════════════════════════════════════════
//  VOICE ENGINE — Web Speech API (Darija Marocaine + Fallback)
// ══════════════════════════════════════════

class TetrisVoice {
  constructor() {
    this.enabled = true;
    this.synth   = window.speechSynthesis || null;
    this.voice   = null;
    this.lang    = 'fr';

    if (this.synth) {
      const pick = () => this.setLanguage(this.lang);
      if (this.synth.getVoices().length) pick();
      this.synth.onvoiceschanged = pick;
    }
  }

  setLanguage(langCode) {
    this.lang = langCode || 'fr';
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    const prefMap = { fr: 'fr', en: 'en', ar: 'ar', es: 'es' };
    const target = prefMap[this.lang] || 'fr';
    this.voice = voices.find(v => v.lang.startsWith(target)) || voices[0] || null;
  }

  say(phraseObj, { rate = 1.05, pitch = 1.0, vol = 1.0 } = {}) {
    if (!this.enabled || !this.synth) return;
    const text = phraseObj[this.lang] || phraseObj.fr || phraseObj.en || '';
    if (!text) return;

    try {
      if (this.synth.speaking) {
        this.synth.cancel();
      }
      const utt = new SpeechSynthesisUtterance(text);
      const langCodes = { fr: 'fr-FR', en: 'en-US', ar: 'ar-SA', es: 'es-ES' };
      if (this.voice) utt.voice = this.voice;
      utt.lang   = langCodes[this.lang] || 'fr-FR';
      utt.rate   = rate;
      utt.pitch  = pitch;
      utt.volume = vol;
      utt.onerror = (e) => console.warn('Speech error:', e);
      this.synth.speak(utt);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }

  onClear(lines, combo) {
    if (!this.enabled) return;

    if (combo >= 6) {
      this.say({
        fr: "Combofire imbattable !",
        en: "Unstoppable Combo!",
        ar: "ما كاينش اللي يوقفك! ناضي!",
        es: "¡Combo Imparable!"
      }, { rate: 1.25, pitch: 1.3 });
    } else if (combo === 4 || combo === 5) {
      this.say({
        fr: "Super Combo !",
        en: "On Fire!",
        ar: "تبارك الله عليك! كتحرق!",
        es: "¡Super Combo en Fuego!"
      }, { rate: 1.2, pitch: 1.25 });
    } else if (combo >= 2) {
      this.say({
        fr: "Combo !",
        en: "Combo!",
        ar: "زيّد كمل!",
        es: "¡Combo!"
      }, { rate: 1.1, pitch: 1.15 });
    } else {
      if (lines === 4) {
        this.say({
          fr: "TETRIS INCROYABLE !",
          en: "TETRIS! EXCELLENT!",
          ar: "تطريس يا الساط! خطااار!",
          es: "¡TETRIS INCREÍBLE!"
        }, { rate: 1.0, pitch: 1.3, vol: 1.0 });
      } else if (lines === 3) {
        this.say({
          fr: "Triple Ligne !",
          en: "TRIPLE!",
          ar: "ثلاثة واعرين!",
          es: "¡Triple Línea!"
        }, { rate: 1.1, pitch: 1.2 });
      } else if (lines === 2) {
        this.say({
          fr: "Double Ligne !",
          en: "DOUBLE!",
          ar: "جووج نادين!",
          es: "¡Doble Línea!"
        }, { rate: 1.05, pitch: 1.1 });
      } else {
        this.say({
          fr: "Bien joué !",
          en: "Good!",
          ar: "نادي!",
          es: "¡Bien hecho!"
        }, { rate: 1.0, pitch: 1.0 });
      }
    }
  }

  onBad(stackHeight) {
    if (!this.enabled) return;
    if (stackHeight >= 14) {
      this.say({
        fr: "Attention à la pile !",
        en: "Watch out!",
        ar: "عنداك يا الساط! رد البال!",
        es: "¡Cuidado con la torre!"
      }, { rate: 1.0, pitch: 0.85 });
    }
  }

  onLevelUp(level) {
    if (!this.enabled) return;
    this.say({
      fr: `Niveau ${level} ! Accélération !`,
      en: `Level ${level}! Speed up!`,
      ar: `مستوى ${level}! زَيّد في السرعة!`,
      es: `¡Nivel ${level}! ¡Más rápido!`
    }, { rate: 1.1, pitch: 1.2 });
  }

  onGameOver() {
    if (!this.enabled) return;
    this.say({
      fr: "Fin de partie !",
      en: "Game Over!",
      ar: "خسرتي يا الساط! عاود لّعب!",
      es: "¡Fin del Juego!"
    }, { rate: 0.85, pitch: 0.7 });
  }

  onTSpin(type) {
    if (!this.enabled) return;
    this.say({
      fr: "T-Spin Réussi !",
      en: "T-Spin!",
      ar: "تي سبيين خطير!",
      es: "¡T-Spin Conseguido!"
    }, { rate: 1.1, pitch: 1.25 });
  }

  onBackToBack() {
    if (!this.enabled) return;
    this.say({
      fr: "Back to Back !",
      en: "Back to Back!",
      ar: "باك تو باك!",
      es: "¡Back to Back!"
    }, { rate: 1.15, pitch: 1.2 });
  }

  onPowerUp(type) {
    if (!this.enabled) return;
    const phrases = {
      bomb: { fr: "Bombe !", en: "Bomb!", ar: "قنبلة!", es: "¡Bomba!" },
      freeze: { fr: "Temps ralenti !", en: "Time slow!", ar: "تبطيء الوقت!", es: "¡Ralenti!" },
      clearline: { fr: "Ligne supprimée !", en: "Line clear!", ar: "مسح الصف!", es: "¡Línea borrada!" },
      shield: { fr: "Bouclier !", en: "Shield!", ar: "درع الحماية!", es: "¡Escudo!" }
    };
    if (phrases[type]) this.say(phrases[type], { rate: 1.1, pitch: 1.2 });
  }

  onAchievement() {
    if (!this.enabled) return;
    this.say({
      fr: "Succès débloqué !",
      en: "Achievement Unlocked!",
      ar: "إنجاز جديد محقق!",
      es: "¡Logro Desbloqueado!"
    }, { rate: 1.05, pitch: 1.3 });
  }

  onGameStart() {
    if (!this.enabled) return;
    this.say({
      fr: "C'est parti !",
      en: "Let's Go!",
      ar: "يلا ابدأ اللعب!",
      es: "¡Vamos a jugar!"
    }, { rate: 1.05, pitch: 1.1 });
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.synth) this.synth.cancel();
    return this.enabled;
  }
}

window.TetrisVoice = TetrisVoice;
