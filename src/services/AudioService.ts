import { saveService } from './SaveService';

type SoundType = 'hit' | 'playerHit' | 'xp' | 'levelUp' | 'bossWarning' | 'select' | 'death' | 'explosion' | 'evolve' | 'telegraph';

export class AudioService {
  private static instance: AudioService;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private initialized = false;
  private musicOn = false;
  private musicPaused = false;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicStep = 0;
  private musicEnergy = 0;
  
  private constructor() {}
  
  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
  
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      
      this.updateVolumes();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }
  
  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }
  
  updateVolumes(): void {
    const settings = saveService.getSettings();
    if (this.sfxGain) this.sfxGain.gain.value = settings.sfxVolume;
    if (this.musicGain) this.musicGain.gain.value = settings.musicVolume;
  }
  
  play(type: SoundType): void {
    if (!this.ctx || !this.sfxGain) return;
    
    try {
      switch (type) {
        case 'hit':
          this.playTone(200, 0.05, 'square', 0.3);
          break;
        case 'playerHit':
          this.playTone(150, 0.1, 'sawtooth', 0.5);
          this.playTone(100, 0.1, 'sawtooth', 0.3);
          break;
        case 'xp':
          this.playTone(800, 0.05, 'sine', 0.2);
          break;
        case 'levelUp':
          this.playSequence([400, 500, 600, 800], 0.1, 'sine', 0.4);
          break;
        case 'bossWarning':
          this.playSequence([200, 150, 200, 150], 0.2, 'sawtooth', 0.6);
          break;
        case 'select':
          this.playTone(600, 0.05, 'sine', 0.3);
          break;
        case 'death':
          this.playTone(300, 0.3, 'sawtooth', 0.5);
          this.playTone(150, 0.4, 'sawtooth', 0.4);
          break;
        case 'explosion':
          this.playNoise(0.15, 0.5);
          this.playTone(60, 0.2, 'sine', 0.6);
          break;
        case 'evolve':
          this.playSequence([300, 400, 500, 700, 900], 0.08, 'sine', 0.5);
          break;
        case 'telegraph':
          this.playTone(520, 0.07, 'square', 0.12);
          break;
      }
    } catch (e) {
      // Ignore audio errors
    }
  }
  
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }
  
  private playSequence(
    freqs: number[],
    noteDuration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx) return;
    
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, noteDuration, type, volume);
      }, i * noteDuration * 1000);
    });
  }
  
  startMusic(): void {
    this.resume();
    if (!this.ctx || !this.musicGain || this.musicOn) return;
    this.musicOn = true;
    this.musicPaused = false;
    this.musicStep = 0;
    this.scheduleMusic();
  }

  stopMusic(): void {
    this.musicOn = false;
    this.musicPaused = false;
    this.clearMusicTimer();
  }

  setMusicPaused(paused: boolean): void {
    if (!this.musicOn) return;
    this.musicPaused = paused;
    this.clearMusicTimer();
    if (!paused) this.scheduleMusic();
  }

  setMusicEnergy(energy: number): void {
    this.musicEnergy = Math.max(0, Math.min(1, energy));
  }

  private clearMusicTimer(): void {
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleMusic(): void {
    if (!this.musicOn || this.musicPaused || !this.ctx || !this.musicGain) return;
    const bpm = 108 + this.musicEnergy * 16;
    const eighth = 60 / bpm / 2;
    const step = this.musicStep % 16;
    if (step % 4 === 0) this.playMusicTone(52, 0.12, 'sine', 0.55);
    if (step % 2 === 0) this.playMusicTone(1800, 0.03, 'square', 0.04);
    if (this.musicEnergy > 0.45 && (step === 4 || step === 12)) {
      this.playMusicTone(90, 0.08, 'triangle', 0.2);
    }
    const bass = [55, 55, 65, 49, 55, 73, 65, 49];
    if (step % 2 === 0) {
      this.playMusicTone(bass[Math.floor(step / 2) % bass.length], 0.16, 'triangle', 0.16);
    }
    if (step === 6 || step === 14) this.playMusicTone(220 + this.musicEnergy * 40, 0.07, 'square', 0.045);
    this.musicStep++;
    this.musicTimer = setTimeout(() => this.scheduleMusic(), eighth * 1000);
  }

  private playMusicTone(freq: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    source.connect(gain);
    gain.connect(this.sfxGain);
    
    source.start();
  }
}

export const audioService = AudioService.getInstance();
