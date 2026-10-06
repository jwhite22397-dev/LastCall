import { WeaponDefinition } from './types';

export const WEAPONS: WeaponDefinition[] = [
  // BOTTLE TOSS - Basic projectile weapon
  {
    id: 'bottle-toss',
    name: 'Bottle Toss',
    description: 'Chuck bottles at the nearest troublemaker',
    category: 'projectile',
    targeting: 'nearest',
    baseStats: {
      damage: 15,
      cooldown: 1200,
      range: 300,
      projectileSpeed: 400,
      projectileCount: 1,
      piercing: 0,
    },
    maxLevel: 8,
    color: 0x00ff88,
    icon: '🍾',
    evolutionId: 'bottle-service',
    evolutionRequires: 'broken-glass',
    levelUpBonuses: [
      { damage: 5 },
      { projectileCount: 1 },
      { damage: 8, piercing: 1 },
      { cooldown: -150 },
      { projectileCount: 1 },
      { damage: 10, piercing: 1 },
      { projectileCount: 1, cooldown: -150 },
    ],
  },
  
  // SPEAKER BLAST - Directional wave
  {
    id: 'speaker-blast',
    name: 'Speaker Blast',
    description: 'Blast enemies with a directional sound wave',
    category: 'directional',
    targeting: 'direction',
    baseStats: {
      damage: 20,
      cooldown: 1800,
      range: 250,
      aoeRadius: 60,
      knockback: 150,
    },
    maxLevel: 8,
    color: 0xff00ff,
    icon: '🔊',
    evolutionId: 'wall-of-sound',
    evolutionRequires: 'louder-system',
    levelUpBonuses: [
      { aoeRadius: 20 },
      { damage: 8 },
      { knockback: 50, aoeRadius: 15 },
      { cooldown: -200 },
      { damage: 12 },
      { aoeRadius: 25, knockback: 50 },
      { damage: 15, cooldown: -200 },
    ],
  },
  
  // STROBE - Area damage around player
  {
    id: 'strobe',
    name: 'Strobe',
    description: 'Periodic flash damages all nearby enemies',
    category: 'aoe',
    targeting: 'area',
    baseStats: {
      damage: 12,
      cooldown: 2000,
      aoeRadius: 100,
    },
    maxLevel: 8,
    color: 0xffff00,
    icon: '💡',
    evolutionId: 'laser-show',
    evolutionRequires: 'chain-reaction',
    levelUpBonuses: [
      { aoeRadius: 20 },
      { damage: 5 },
      { aoeRadius: 25, cooldown: -200 },
      { damage: 8 },
      { aoeRadius: 30 },
      { cooldown: -300, damage: 6 },
      { aoeRadius: 35, damage: 10 },
    ],
  },
  
  // ICE BUCKET - Orbital weapon
  {
    id: 'ice-bucket',
    name: 'Ice Bucket',
    description: 'Orbiting ice buckets damage enemies on contact',
    category: 'orbital',
    targeting: 'orbit',
    baseStats: {
      damage: 18,
      cooldown: 0,
      orbitRadius: 80,
      orbitSpeed: 2,
      projectileCount: 1,
      knockback: 80,
    },
    maxLevel: 8,
    color: 0x00ffff,
    icon: '🧊',
    evolutionId: 'champagne-orbit',
    evolutionRequires: 'vip-treatment',
    levelUpBonuses: [
      { projectileCount: 1 },
      { damage: 8, orbitRadius: 10 },
      { orbitSpeed: 0.5 },
      { projectileCount: 1 },
      { damage: 12, knockback: 30 },
      { projectileCount: 1, orbitRadius: 15 },
      { damage: 15, orbitSpeed: 0.5 },
    ],
  },
  
  // BASS DROP - Slow but powerful AOE
  {
    id: 'bass-drop',
    name: 'Bass Drop',
    description: 'Massive AOE attack with a long cooldown',
    category: 'aoe',
    targeting: 'area',
    baseStats: {
      damage: 50,
      cooldown: 6000,
      aoeRadius: 180,
      knockback: 200,
    },
    maxLevel: 8,
    color: 0xff3366,
    icon: '💥',
    evolutionId: 'earthquake',
    evolutionRequires: 'bass-boost',
    levelUpBonuses: [
      { damage: 15 },
      { aoeRadius: 30 },
      { cooldown: -500, damage: 10 },
      { aoeRadius: 40, knockback: 50 },
      { damage: 20 },
      { cooldown: -600 },
      { aoeRadius: 50, damage: 25 },
    ],
  },
  
  // SECURITY CALL - Summon allies
  {
    id: 'security-call',
    name: 'Security Call',
    description: 'Summon security guards to fight for you',
    category: 'summon',
    targeting: 'nearest',
    baseStats: {
      damage: 25,
      cooldown: 8000,
      projectileCount: 1, // Number of guards
      duration: 10000,
      range: 200,
    },
    maxLevel: 8,
    color: 0x4444ff,
    icon: '👮',
    evolutionId: 'riot-squad',
    evolutionRequires: 'backup-plan',
    levelUpBonuses: [
      { damage: 8 },
      { duration: 2000 },
      { projectileCount: 1 },
      { damage: 12, cooldown: -500 },
      { duration: 3000 },
      { projectileCount: 1 },
      { damage: 15, cooldown: -600 },
    ],
  },
  
  // GLOW STICK - Fast projectiles
  {
    id: 'glow-stick',
    name: 'Glow Stick',
    description: 'Rapid-fire glowing projectiles',
    category: 'projectile',
    targeting: 'nearest',
    baseStats: {
      damage: 8,
      cooldown: 400,
      range: 250,
      projectileSpeed: 500,
      projectileCount: 1,
    },
    maxLevel: 8,
    color: 0x00ff00,
    icon: '✨',
    levelUpBonuses: [
      { damage: 3 },
      { cooldown: -50, projectileCount: 1 },
      { damage: 4 },
      { projectileSpeed: 100 },
      { projectileCount: 1, cooldown: -50 },
      { damage: 5 },
      { projectileCount: 1, damage: 4 },
    ],
  },
  
  // DISCO BALL - Bouncing projectiles
  {
    id: 'disco-ball',
    name: 'Disco Ball',
    description: 'Bouncing ball of light that ricochets between enemies',
    category: 'projectile',
    targeting: 'random',
    baseStats: {
      damage: 22,
      cooldown: 2500,
      range: 400,
      projectileSpeed: 350,
      piercing: 3,
    },
    maxLevel: 8,
    color: 0xffaaff,
    icon: '🪩',
    levelUpBonuses: [
      { piercing: 1 },
      { damage: 8 },
      { piercing: 2, projectileSpeed: 50 },
      { damage: 10 },
      { piercing: 2 },
      { cooldown: -300, damage: 8 },
      { piercing: 3, damage: 12 },
    ],
  },
  
  // --- EVOLVED WEAPONS ---
  
  {
    id: 'bottle-service',
    name: 'Bottle Service',
    description: 'Premium bottles that shatter into deadly fragments',
    category: 'projectile',
    targeting: 'nearest',
    baseStats: {
      damage: 40,
      cooldown: 1000,
      range: 350,
      projectileSpeed: 450,
      projectileCount: 3,
      piercing: 2,
      aoeRadius: 60, // Explosion radius
    },
    maxLevel: 1,
    color: 0xffdd00,
    icon: '🍾✨',
    levelUpBonuses: [],
  },
  
  {
    id: 'wall-of-sound',
    name: 'Wall of Sound',
    description: 'Full 360-degree sonic devastation',
    category: 'aoe',
    targeting: 'area',
    baseStats: {
      damage: 45,
      cooldown: 1400,
      aoeRadius: 200,
      knockback: 250,
    },
    maxLevel: 1,
    color: 0xff00ff,
    icon: '🔊💫',
    levelUpBonuses: [],
  },
  
  {
    id: 'laser-show',
    name: 'Laser Show',
    description: 'Chain lightning strobe that jumps between enemies',
    category: 'aoe',
    targeting: 'area',
    baseStats: {
      damage: 30,
      cooldown: 1200,
      aoeRadius: 180,
      piercing: 5, // Chain targets
    },
    maxLevel: 1,
    color: 0xff0000,
    icon: '💡⚡',
    levelUpBonuses: [],
  },
  
  {
    id: 'champagne-orbit',
    name: 'Champagne Orbit',
    description: 'Orbiting champagne bottles that spray damage',
    category: 'orbital',
    targeting: 'orbit',
    baseStats: {
      damage: 35,
      cooldown: 0,
      orbitRadius: 120,
      orbitSpeed: 3,
      projectileCount: 6,
      knockback: 120,
      aoeRadius: 40,
    },
    maxLevel: 1,
    color: 0xffee88,
    icon: '🍾🔄',
    levelUpBonuses: [],
  },
  
  {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'Ground-shaking bass with aftershocks',
    category: 'aoe',
    targeting: 'area',
    baseStats: {
      damage: 100,
      cooldown: 5000,
      aoeRadius: 300,
      knockback: 300,
    },
    maxLevel: 1,
    color: 0xff0066,
    icon: '💥🌊',
    levelUpBonuses: [],
  },
  
  {
    id: 'riot-squad',
    name: 'Riot Squad',
    description: 'A full team of aggressive security',
    category: 'summon',
    targeting: 'nearest',
    baseStats: {
      damage: 50,
      cooldown: 6000,
      projectileCount: 4,
      duration: 15000,
      range: 300,
    },
    maxLevel: 1,
    color: 0x6666ff,
    icon: '👮👮',
    levelUpBonuses: [],
  },
];

export function getWeapon(id: string): WeaponDefinition | undefined {
  return WEAPONS.find(w => w.id === id);
}

export function isEvolution(id: string): boolean {
  return WEAPONS.some(w => w.evolutionId === id);
}

export function getBaseWeapons(): WeaponDefinition[] {
  return WEAPONS.filter(w => !isEvolution(w.id));
}

export function getWeaponStats(id: string, level: number): WeaponDefinition['baseStats'] {
  const weapon = getWeapon(id);
  if (!weapon) return { damage: 0, cooldown: 1000, range: 100 };
  
  const stats = { ...weapon.baseStats };
  const bonuses = weapon.levelUpBonuses.slice(0, level - 1);
  
  for (const bonus of bonuses) {
    for (const [key, value] of Object.entries(bonus)) {
      const statKey = key as keyof typeof stats;
      if (stats[statKey] !== undefined) {
        (stats[statKey] as number) += value;
      } else {
        (stats as Record<string, number>)[statKey] = value;
      }
    }
  }
  
  return stats;
}

export function getStartingWeapons(): string[] {
  return ['bottle-toss', 'speaker-blast', 'strobe', 'ice-bucket', 'bass-drop'];
}
