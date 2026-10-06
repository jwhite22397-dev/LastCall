import { EnemyDefinition, EliteModifier, BossDefinition } from './types';

export const ENEMIES: EnemyDefinition[] = [
  // PARTY CRASHER - Basic melee enemy
  {
    id: 'party-crasher',
    name: 'Party Crasher',
    type: 'basic',
    baseStats: {
      health: 30,
      damage: 10,
      speed: 80,
      xpValue: 5,
    },
    color: 0xff6666,
    size: 18,
    behavior: 'chase',
    spawnWeight: 100,
    minTime: 0,
  },
  
  // DRUNK - Slow, tanky, unpredictable
  {
    id: 'drunk',
    name: 'Drunk',
    type: 'tank',
    baseStats: {
      health: 80,
      damage: 15,
      speed: 40,
      xpValue: 12,
    },
    color: 0x88ff88,
    size: 24,
    behavior: 'wander-chase',
    spawnWeight: 40,
    minTime: 1,
  },
  
  // INSTIGATOR - Fast, aggressive
  {
    id: 'instigator',
    name: 'Instigator',
    type: 'fast',
    baseStats: {
      health: 20,
      damage: 8,
      speed: 150,
      xpValue: 8,
    },
    color: 0xffaa00,
    size: 14,
    behavior: 'rush',
    spawnWeight: 50,
    minTime: 1.5,
  },
  
  // PHONE GUY - Ranged enemy
  {
    id: 'phone-guy',
    name: 'Phone Guy',
    type: 'ranged',
    baseStats: {
      health: 25,
      damage: 12,
      speed: 60,
      xpValue: 10,
      attackCooldown: 2000,
      attackRange: 200,
    },
    color: 0x6666ff,
    size: 16,
    behavior: 'kite',
    spawnWeight: 35,
    minTime: 2,
  },
  
  // HYPE BEAST - Swarm enemy, comes in groups
  {
    id: 'hype-beast',
    name: 'Hype Beast',
    type: 'swarm',
    baseStats: {
      health: 15,
      damage: 6,
      speed: 100,
      xpValue: 3,
    },
    color: 0xff00ff,
    size: 12,
    behavior: 'swarm',
    spawnWeight: 60,
    minTime: 2.5,
  },
  
  // BOUNCER - Tank enemy
  {
    id: 'bouncer',
    name: 'Off-Duty Bouncer',
    type: 'tank',
    baseStats: {
      health: 120,
      damage: 20,
      speed: 50,
      xpValue: 20,
    },
    color: 0x444444,
    size: 28,
    behavior: 'chase',
    spawnWeight: 20,
    minTime: 3,
  },
  
  // INFLUENCER - Buffs nearby enemies
  {
    id: 'influencer',
    name: 'Influencer',
    type: 'ranged',
    baseStats: {
      health: 40,
      damage: 5,
      speed: 70,
      xpValue: 15,
      attackCooldown: 3000,
      attackRange: 150,
    },
    color: 0xff88ff,
    size: 16,
    behavior: 'support',
    spawnWeight: 25,
    minTime: 3,
  },
  
  // VIP - Tanky with shield
  {
    id: 'vip',
    name: 'VIP',
    type: 'tank',
    baseStats: {
      health: 150,
      damage: 18,
      speed: 45,
      xpValue: 30,
    },
    color: 0xffdd00,
    size: 26,
    behavior: 'chase',
    spawnWeight: 15,
    minTime: 3.5,
  },
];

export const ELITE_MODIFIERS: EliteModifier[] = [
  {
    id: 'fast',
    name: 'Speedy',
    color: 0x00ffff,
    statMultipliers: { speed: 1.5 },
  },
  {
    id: 'tank',
    name: 'Beefy',
    color: 0x888888,
    statMultipliers: { health: 2.0, speed: 0.8 },
  },
  {
    id: 'regen',
    name: 'Regenerating',
    color: 0x00ff00,
    statMultipliers: { health: 1.3 },
    special: 'regenerate',
  },
  {
    id: 'explosive',
    name: 'Volatile',
    color: 0xff6600,
    statMultipliers: { damage: 1.5 },
    special: 'explode-on-death',
  },
  {
    id: 'armored',
    name: 'Armored',
    color: 0x666688,
    statMultipliers: { health: 1.5 },
    special: 'damage-reduction',
  },
  {
    id: 'frenzied',
    name: 'Frenzied',
    color: 0xff0000,
    statMultipliers: { speed: 1.3, damage: 1.3 },
    special: 'enrage-on-low-health',
  },
];

export const BOSSES: BossDefinition[] = [
  // 3 AM - Mini-boss
  {
    id: 'bathroom-line-boss',
    name: 'Chad',
    subtitle: 'King of the Bathroom Line',
    baseStats: {
      health: 500,
      damage: 25,
      speed: 60,
      xpValue: 100,
    },
    color: 0xff8800,
    size: 50,
    spawnTime: 60, // 3:00 AM
    phases: [
      {
        healthThreshold: 1.0,
        attacks: ['charge', 'slam'],
        movementPattern: 'chase',
      },
      {
        healthThreshold: 0.5,
        attacks: ['charge', 'slam', 'summon-bros'],
        movementPattern: 'erratic',
      },
    ],
  },
  
  // 4 AM - Boss
  {
    id: 'dj-boss',
    name: 'DJ Decibel',
    subtitle: 'Master of Disaster',
    baseStats: {
      health: 1200,
      damage: 35,
      speed: 70,
      xpValue: 250,
    },
    color: 0xff00ff,
    size: 60,
    spawnTime: 120, // 4:00 AM
    phases: [
      {
        healthThreshold: 1.0,
        attacks: ['sound-wave', 'bass-slam'],
        movementPattern: 'stationary',
      },
      {
        healthThreshold: 0.6,
        attacks: ['sound-wave', 'bass-slam', 'speaker-summon'],
        movementPattern: 'slow-chase',
      },
      {
        healthThreshold: 0.3,
        attacks: ['sound-wave', 'bass-slam', 'drop-the-bass'],
        movementPattern: 'teleport',
      },
    ],
  },
  
  // 5 AM - Major boss
  {
    id: 'manager-boss',
    name: 'The Manager',
    subtitle: 'Closer of Clubs',
    baseStats: {
      health: 2000,
      damage: 45,
      speed: 80,
      xpValue: 400,
    },
    color: 0x4444ff,
    size: 70,
    spawnTime: 180, // 5:00 AM
    phases: [
      {
        healthThreshold: 1.0,
        attacks: ['paperwork-barrage', 'call-security'],
        movementPattern: 'strategic',
      },
      {
        healthThreshold: 0.7,
        attacks: ['paperwork-barrage', 'call-security', 'close-sections'],
        movementPattern: 'aggressive',
      },
      {
        healthThreshold: 0.4,
        attacks: ['paperwork-barrage', 'call-security', 'close-sections', 'last-call-warning'],
        movementPattern: 'enraged',
      },
      {
        healthThreshold: 0.15,
        attacks: ['final-tab', 'mass-eviction'],
        movementPattern: 'desperate',
      },
    ],
  },
  
  // 6 AM - Final encounter
  {
    id: 'sunrise-boss',
    name: 'The Sunrise',
    subtitle: 'Dawn of Regret',
    baseStats: {
      health: 3000,
      damage: 60,
      speed: 40,
      xpValue: 1000,
    },
    color: 0xffff00,
    size: 100,
    spawnTime: 240, // 6:00 AM
    phases: [
      {
        healthThreshold: 1.0,
        attacks: ['light-beam', 'reality-check'],
        movementPattern: 'expand',
      },
      {
        healthThreshold: 0.5,
        attacks: ['light-beam', 'reality-check', 'hangover-wave'],
        movementPattern: 'pulse',
      },
      {
        healthThreshold: 0.2,
        attacks: ['blinding-light', 'full-exposure'],
        movementPattern: 'final-form',
      },
    ],
  },
];

export function getEnemy(id: string): EnemyDefinition | undefined {
  return ENEMIES.find(e => e.id === id);
}

export function getBoss(id: string): BossDefinition | undefined {
  return BOSSES.find(b => b.id === id);
}

export function getEliteModifier(id: string): EliteModifier | undefined {
  return ELITE_MODIFIERS.find(m => m.id === id);
}

export function getSpawnableEnemies(gameTimeMinutes: number): EnemyDefinition[] {
  return ENEMIES.filter(e => e.minTime <= gameTimeMinutes);
}

export function getNextBoss(gameTimeMinutes: number): BossDefinition | undefined {
  return BOSSES.find(b => b.spawnTime > gameTimeMinutes);
}

export function getBossForTime(gameTimeMinutes: number): BossDefinition | undefined {
  return BOSSES.find(b => Math.abs(b.spawnTime - gameTimeMinutes) < 0.5);
}
