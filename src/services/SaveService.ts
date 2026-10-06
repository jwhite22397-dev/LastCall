import { SaveData, INITIAL_SAVE, GameSettings, PlayerStats, DEFAULT_STATS, DEFAULT_SETTINGS } from '../data/types';

const SAVE_KEY = 'lastcall_save';
const CURRENT_VERSION = 1;

export function cloneSave(data: SaveData): SaveData {
  return {
    ...data,
    unlockedCharacters: [...data.unlockedCharacters],
    unlockedWeapons: [...data.unlockedWeapons],
    unlockedUpgrades: [...data.unlockedUpgrades],
    achievements: [...data.achievements],
    permanentUpgrades: { ...data.permanentUpgrades },
    stats: { ...DEFAULT_STATS, ...data.stats },
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
  };
}

export class SaveService {
  private static instance: SaveService;
  private data: SaveData;
  
  private constructor() {
    this.data = this.load();
  }
  
  static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService();
    }
    return SaveService.instance;
  }
  
  private load(): SaveData {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return cloneSave(INITIAL_SAVE);
      
      const parsed = JSON.parse(saved) as SaveData;
      
      // Version migration
      if (!parsed.version || parsed.version < CURRENT_VERSION) {
        return this.migrate(parsed);
      }
      
      return cloneSave(parsed);
    } catch (e) {
      console.warn('Failed to load save data, using defaults', e);
      return cloneSave(INITIAL_SAVE);
    }
  }
  
  private migrate(old: SaveData): SaveData {
    return cloneSave({ ...INITIAL_SAVE, ...old, version: CURRENT_VERSION });
  }
  
  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  }
  
  // Clout
  getClout(): number {
    return this.data.clout;
  }
  
  addClout(amount: number): void {
    this.data.clout += amount;
    this.data.stats.lifetimeClout += amount;
    this.save();
  }
  
  spendClout(amount: number): boolean {
    if (this.data.clout < amount) return false;
    this.data.clout -= amount;
    this.save();
    return true;
  }
  
  // Unlocks
  isCharacterUnlocked(id: string): boolean {
    return this.data.unlockedCharacters.includes(id);
  }
  
  unlockCharacter(id: string): void {
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      this.save();
    }
  }
  
  isWeaponUnlocked(id: string): boolean {
    return this.data.unlockedWeapons.includes(id);
  }
  
  unlockWeapon(id: string): void {
    if (!this.data.unlockedWeapons.includes(id)) {
      this.data.unlockedWeapons.push(id);
      this.save();
    }
  }
  
  getUnlockedCharacters(): string[] {
    return [...this.data.unlockedCharacters];
  }
  
  getUnlockedWeapons(): string[] {
    return [...this.data.unlockedWeapons];
  }
  
  // Achievements
  isAchievementUnlocked(id: string): boolean {
    return this.data.achievements.includes(id);
  }
  
  unlockAchievement(id: string): void {
    if (!this.data.achievements.includes(id)) {
      this.data.achievements.push(id);
      this.save();
    }
  }
  
  getUnlockedAchievements(): string[] {
    return [...this.data.achievements];
  }
  
  // Permanent upgrades
  getPermanentUpgradeLevel(id: string): number {
    return this.data.permanentUpgrades[id] || 0;
  }
  
  upgradePermanent(id: string): void {
    this.data.permanentUpgrades[id] = (this.data.permanentUpgrades[id] || 0) + 1;
    this.save();
  }
  
  // Stats
  getStats(): PlayerStats {
    return { ...this.data.stats };
  }
  
  updateStats(updates: Partial<PlayerStats>): void {
    const previousBest = this.data.stats.longestSurvival;
    this.data.stats = { ...this.data.stats, ...updates };
    
    if (updates.longestSurvival !== undefined) {
      this.data.stats.longestSurvival = Math.max(previousBest, updates.longestSurvival);
    }
    
    this.save();
  }
  
  addToStats(key: keyof PlayerStats, amount: number): void {
    (this.data.stats[key] as number) += amount;
    this.save();
  }
  
  // Settings
  getSettings(): GameSettings {
    return { ...this.data.settings };
  }
  
  updateSettings(updates: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
  }
  
  // Full data access
  getData(): SaveData {
    return cloneSave(this.data);
  }
  
  // Reset (for debugging)
  reset(): void {
    this.data = cloneSave(INITIAL_SAVE);
    this.save();
  }
}

export const saveService = SaveService.getInstance();
