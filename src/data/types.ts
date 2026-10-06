// Core game types

export interface Vec2 {
  x: number;
  y: number;
}

// Seeded PRNG
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
  
  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Weapon definitions
export type WeaponCategory = 'projectile' | 'aoe' | 'orbital' | 'directional' | 'summon';
export type TargetingType = 'nearest' | 'random' | 'direction' | 'area' | 'orbit';

export interface WeaponStats {
  damage: number;
  cooldown: number;
  range?: number;
  projectileSpeed?: number;
  projectileCount?: number;
  piercing?: number;
  aoeRadius?: number;
  knockback?: number;
  duration?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  category: WeaponCategory;
  targeting: TargetingType;
  baseStats: WeaponStats;
  maxLevel: number;
  color: number;
  icon: string;
  evolutionId?: string;
  evolutionRequires?: string;
  levelUpBonuses: Partial<WeaponStats>[];
}

// Enemy definitions
export type EnemyType = 'basic' | 'tank' | 'fast' | 'ranged' | 'swarm' | 'elite' | 'boss';

export interface EnemyStats {
  health: number;
  damage: number;
  speed: number;
  xpValue: number;
  attackCooldown?: number;
  attackRange?: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  type: EnemyType;
  baseStats: EnemyStats;
  color: number;
  size: number;
  behavior: string;
  spawnWeight: number;
  minTime: number; // Minutes into the run before this can spawn
}

// Elite modifiers
export interface EliteModifier {
  id: string;
  name: string;
  color: number;
  statMultipliers: Partial<EnemyStats>;
  special?: string;
}

// Boss definitions
export interface BossPhase {
  healthThreshold: number;
  attacks: string[];
  movementPattern: string;
}

export interface BossDefinition {
  id: string;
  name: string;
  subtitle: string;
  baseStats: EnemyStats;
  color: number;
  size: number;
  phases: BossPhase[];
  spawnTime: number; // In-game minutes
}

// Upgrade definitions
export type UpgradeCategory = 'weapon' | 'passive' | 'utility' | 'special';

export interface UpgradeEffect {
  stat: string;
  value: number;
  isPercent?: boolean;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  maxLevel: number;
  effects: UpgradeEffect[];
  icon: string;
  color: number;
  rarity: number; // 1-5, affects drop rate
  requiresWeapon?: string; // For evolution triggers
  unlockedBy?: string; // Achievement or meta unlock
}

// Character definitions
export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: number;
  startingWeapon: string;
  bonuses: UpgradeEffect[];
  unlockCondition?: string;
  unlockCost?: number;
}

// Events
export interface GameEvent {
  id: string;
  name: string;
  description: string;
  duration: number; // Seconds
  effects: string[];
  minTime: number; // Minutes into run
  weight: number;
}

// Save data
export interface PlayerStats {
  totalRuns: number;
  totalKills: number;
  totalDamage: number;
  totalXP: number;
  longestSurvival: number;
  bossesDefeated: number;
  victories: number;
  weaponEvolutions: number;
  lifetimeClout: number;
}

export interface SaveData {
  version: number;
  clout: number;
  unlockedCharacters: string[];
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  achievements: string[];
  permanentUpgrades: Record<string, number>;
  stats: PlayerStats;
  settings: GameSettings;
}

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  screenShake: boolean;
  damageNumbers: boolean;
  reducedMotion: boolean;
  touchSensitivity: number;
}

// Run state
export interface RunState {
  seed: number;
  characterId: string;
  gameTime: number; // Real seconds elapsed
  inGameTime: number; // In-game minutes (2AM = 0, 6AM = 240)
  level: number;
  xp: number;
  xpToLevel: number;
  health: number;
  maxHealth: number;
  weapons: Map<string, number>; // weaponId -> level
  passives: Map<string, number>; // upgradeId -> level
  kills: number;
  damageDealt: number;
  elitesDefeated: number;
  bossesDefeated: number;
  hype: number;
  isPaused: boolean;
  isLevelingUp: boolean;
}

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  reward?: { type: string; id: string };
}

export const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.7,
  musicVolume: 0.5,
  screenShake: true,
  damageNumbers: true,
  reducedMotion: false,
  touchSensitivity: 1.0,
};

export const DEFAULT_STATS: PlayerStats = {
  totalRuns: 0,
  totalKills: 0,
  totalDamage: 0,
  totalXP: 0,
  longestSurvival: 0,
  bossesDefeated: 0,
  victories: 0,
  weaponEvolutions: 0,
  lifetimeClout: 0,
};

export const INITIAL_SAVE: SaveData = {
  version: 1,
  clout: 0,
  unlockedCharacters: ['promoter'],
  unlockedWeapons: ['bottle-toss'],
  unlockedUpgrades: [],
  achievements: [],
  permanentUpgrades: {},
  stats: { ...DEFAULT_STATS },
  settings: { ...DEFAULT_SETTINGS },
};
