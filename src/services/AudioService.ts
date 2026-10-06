import { saveService } from './SaveService';

type SoundType = 'hit' | 'playerHit' | 'xp' | 'levelUp' | 'bossWarning' | 'select' | 'death' | 'explosion' | 'evolve';

export class AudioService {
  private static instance: AudioService;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private initialized = false;
  
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
