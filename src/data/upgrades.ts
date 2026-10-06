import { UpgradeDefinition, CharacterDefinition, GameEvent, Achievement } from './types';

export const UPGRADES: UpgradeDefinition[] = [
  // === PASSIVE UPGRADES ===
  
  // Movement
  {
    id: 'designated-driver',
    name: 'Designated Driver',
    description: '+12% movement speed',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'moveSpeed', value: 0.12, isPercent: true }],
    icon: '🚗',
    color: 0x00ff88,
    rarity: 1,
  },
  
  // Health
  {
    id: 'double-cup',
    name: 'Double Cup',
    description: '+20 max health',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'maxHealth', value: 20 }],
    icon: '🥤',
    color: 0xff6666,
    rarity: 1,
  },
  
  // Armor
  {
    id: 'leather-jacket',
    name: 'Leather Jacket',
    description: '+5% damage reduction',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'armor', value: 0.05, isPercent: true }],
    icon: '🧥',
    color: 0x666666,
    rarity: 2,
  },
  
  // Pickup Range
  {
    id: 'long-arms',
    name: 'Long Arms',
    description: '+25% pickup range',
    category: 'passive',
    maxLevel: 4,
    effects: [{ stat: 'pickupRange', value: 0.25, isPercent: true }],
    icon: '🦾',
    color: 0xffaa00,
    rarity: 1,
  },
  
  // XP Gain
  {
    id: 'networking',
    name: 'Networking',
    description: '+10% XP gain',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'xpGain', value: 0.10, isPercent: true }],
    icon: '🤝',
    color: 0x00ffff,
    rarity: 2,
  },
  
  // Critical Chance
  {
    id: 'lucky-night',
    name: 'Lucky Night',
    description: '+8% critical chance',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'critChance', value: 0.08, isPercent: true }],
    icon: '🍀',
    color: 0x00ff00,
    rarity: 3,
  },
  
  // Cooldown
  {
    id: 'caffeine-rush',
    name: 'Caffeine Rush',
    description: '-8% cooldowns',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'cooldown', value: -0.08, isPercent: true }],
    icon: '☕',
    color: 0x8b4513,
    rarity: 2,
  },
  
  // Projectile Speed
  {
    id: 'good-arm',
    name: 'Good Arm',
    description: '+15% projectile speed',
    category: 'passive',
    maxLevel: 4,
    effects: [{ stat: 'projectileSpeed', value: 0.15, isPercent: true }],
    icon: '💪',
    color: 0xffcc00,
    rarity: 2,
  },
  
  // Area
  {
    id: 'louder-system',
    name: 'Louder System',
    description: '+15% area of effect',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'aoe', value: 0.15, isPercent: true }],
    icon: '📢',
    color: 0xff00ff,
    rarity: 2,
    requiresWeapon: 'speaker-blast',
  },
  
  // Damage
  {
    id: 'liquid-courage',
    name: 'Liquid Courage',
    description: '+10% damage',
    category: 'passive',
    maxLevel: 5,
    effects: [{ stat: 'damage', value: 0.10, isPercent: true }],
    icon: '🍺',
    color: 0xffaa44,
    rarity: 2,
  },
  
  // Knockback
  {
    id: 'shove-off',
    name: 'Shove Off',
    description: '+20% knockback',
    category: 'passive',
    maxLevel: 3,
    effects: [{ stat: 'knockback', value: 0.20, isPercent: true }],
    icon: '🤚',
    color: 0xaaaaaa,
    rarity: 2,
  },
  
  // Health Regen
  {
    id: 'second-wind',
    name: 'Second Wind',
    description: 'Regenerate 1 HP every 5 seconds',
    category: 'passive',
    maxLevel: 4,
    effects: [{ stat: 'healthRegen', value: 1 }],
    icon: '💨',
    color: 0x88ffaa,
    rarity: 3,
  },
  
  // Dodge
  {
    id: 'slippery',
    name: 'Slippery',
    description: '+5% chance to dodge attacks',
    category: 'passive',
    maxLevel: 4,
    effects: [{ stat: 'dodge', value: 0.05, isPercent: true }],
    icon: '💃',
    color: 0xff88ff,
    rarity: 3,
  },
  
  // === EVOLUTION TRIGGERS ===
  
  {
    id: 'broken-glass',
    name: 'Broken Glass',
    description: 'Projectiles deal +15% damage on crit',
    category: 'passive',
    maxLevel: 3,
    effects: [{ stat: 'critDamage', value: 0.15, isPercent: true }],
    icon: '🔪',
    color: 0x88ff88,
    rarity: 3,
    requiresWeapon: 'bottle-toss',
  },
  
  {
    id: 'chain-reaction',
    name: 'Chain Reaction',
    description: 'AOE attacks can chain to nearby enemies',
    category: 'passive',
    maxLevel: 3,
    effects: [{ stat: 'chainCount', value: 1 }],
    icon: '⚡',
    color: 0xffff00,
    rarity: 3,
    requiresWeapon: 'strobe',
  },
  
  {
    id: 'vip-treatment',
    name: 'VIP Treatment',
    description: '+20% orbital damage',
    category: 'passive',
    maxLevel: 3,
    effects: [{ stat: 'orbitalDamage', value: 0.20, isPercent: true }],
    icon: '⭐',
    color: 0xffdd00,
    rarity: 3,
    requiresWeapon: 'ice-bucket',
  },
  
  {
    id: 'bass-boost',
    name: 'Bass Boost',
    description: 'Powerful attacks deal +25% damage',
    category: 'passive',
    maxLevel: 3,
    effects: [{ stat: 'heavyDamage', value: 0.25, isPercent: true }],
    icon: '🔊',
    color: 0xff3366,
    rarity: 3,
    requiresWeapon: 'bass-drop',
  },
  
  {
    id: 'backup-plan',
    name: 'Backup Plan',
    description: 'Summons last 20% longer',
    category: 'passive',
    maxLevel: 3,
    effects: [{ stat: 'summonDuration', value: 0.20, isPercent: true }],
    icon: '📞',
    color: 0x4444ff,
    rarity: 3,
    requiresWeapon: 'security-call',
  },
  
  // === UTILITY UPGRADES ===
  
  {
    id: 'coat-check',
    name: 'Coat Check',
    description: 'Start with +1 random weapon',
    category: 'utility',
    maxLevel: 1,
    effects: [{ stat: 'extraStartWeapon', value: 1 }],
    icon: '🧥',
    color: 0x8888ff,
    rarity: 4,
  },
  
  {
    id: 'vip-pass',
    name: 'VIP Pass',
    description: 'Gain 50% more Clout at end of run',
    category: 'utility',
    maxLevel: 1,
    effects: [{ stat: 'cloutBonus', value: 0.50, isPercent: true }],
    icon: '🎫',
    color: 0xffdd00,
    rarity: 4,
  },
  
  {
    id: 'free-drinks',
    name: 'Free Drinks',
    description: 'Health pickups restore 50% more',
    category: 'utility',
    maxLevel: 3,
    effects: [{ stat: 'healingBonus', value: 0.50, isPercent: true }],
    icon: '🍸',
    color: 0xff88ff,
    rarity: 2,
  },
  
  {
    id: 'crowd-favorite',
    name: 'Crowd Favorite',
    description: 'Hype meter fills 20% faster',
    category: 'utility',
    maxLevel: 3,
    effects: [{ stat: 'hypeGain', value: 0.20, isPercent: true }],
    icon: '🙌',
    color: 0xff00ff,
    rarity: 2,
  },
  
  // === SPECIAL UPGRADES ===
  
  {
    id: 'comeback-king',
    name: 'Comeback King',
    description: 'Gain +30% damage when below 30% health',
    category: 'special',
    maxLevel: 2,
    effects: [{ stat: 'lowHealthDamage', value: 0.30, isPercent: true }],
    icon: '👑',
    color: 0xffaa00,
    rarity: 4,
  },
  
  {
    id: 'party-animal',
    name: 'Party Animal',
    description: 'After each minute survived, gain +3% permanent damage this run',
    category: 'special',
    maxLevel: 1,
    effects: [{ stat: 'scalingDamage', value: 0.03, isPercent: true }],
    icon: '🦁',
    color: 0xff6600,
    rarity: 5,
  },
  
  {
    id: 'last-man-standing',
    name: 'Last Man Standing',
    description: 'Gain +1% damage for each enemy killed this run (max 100%)',
    category: 'special',
    maxLevel: 1,
    effects: [{ stat: 'killDamage', value: 0.01, isPercent: true }],
    icon: '💀',
    color: 0xff0000,
    rarity: 5,
  },
  
  {
    id: 'dance-floor-king',
    name: 'Dance Floor King',
    description: 'Moving increases damage by up to 20%',
    category: 'special',
    maxLevel: 2,
    effects: [{ stat: 'moveDamage', value: 0.20, isPercent: true }],
    icon: '🕺',
    color: 0xff00ff,
    rarity: 4,
  },
  
  {
    id: 'glass-cannon',
    name: 'Glass Cannon',
    description: '-30% max health, +40% damage',
    category: 'special',
    maxLevel: 1,
    effects: [
      { stat: 'maxHealth', value: -0.30, isPercent: true },
      { stat: 'damage', value: 0.40, isPercent: true },
    ],
    icon: '💎',
    color: 0x00ffff,
    rarity: 5,
  },
  
  {
    id: 'thorns',
    name: 'Spiked Bracelet',
    description: 'Deal 10 damage to enemies that hit you',
    category: 'special',
    maxLevel: 3,
    effects: [{ stat: 'thornsDamage', value: 10 }],
    icon: '⛓️',
    color: 0x888888,
    rarity: 3,
  },
];

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'promoter',
    name: 'The Promoter',
    title: 'Social Butterfly',
    description: 'Connected and always working the room',
    avatar: '🎤',
    color: 0xff00ff,
    startingWeapon: 'bottle-toss',
    bonuses: [
      { stat: 'xpGain', value: 0.15, isPercent: true },
    ],
  },
  {
    id: 'dj',
    name: 'The DJ',
    title: 'Beat Master',
    description: 'Controls the vibe of the whole club',
    avatar: '🎧',
    color: 0x00ffff,
    startingWeapon: 'speaker-blast',
    bonuses: [
      { stat: 'cooldown', value: -0.10, isPercent: true },
    ],
    unlockCost: 500,
  },
  {
    id: 'bouncer',
    name: 'The Bouncer',
    title: 'Brick Wall',
    description: 'They don\'t pay you enough for this',
    avatar: '💪',
    color: 0x444444,
    startingWeapon: 'ice-bucket',
    bonuses: [
      { stat: 'maxHealth', value: 50 },
      { stat: 'armor', value: 0.10, isPercent: true },
    ],
    unlockCost: 750,
  },
  {
    id: 'bartender',
    name: 'The Bartender',
    title: 'Poison Expert',
    description: 'Knows exactly what you need',
    avatar: '🍸',
    color: 0x00ff88,
    startingWeapon: 'glow-stick',
    bonuses: [
      { stat: 'healingBonus', value: 0.30, isPercent: true },
      { stat: 'damage', value: 0.05, isPercent: true },
    ],
    unlockCondition: 'survive-30-minutes',
    unlockCost: 1000,
  },
  {
    id: 'vip',
    name: 'The VIP',
    title: 'Money Talks',
    description: 'Everything is better when you\'re rich',
    avatar: '💎',
    color: 0xffdd00,
    startingWeapon: 'disco-ball',
    bonuses: [
      { stat: 'cloutBonus', value: 0.25, isPercent: true },
      { stat: 'pickupRange', value: 0.30, isPercent: true },
    ],
    unlockCondition: 'collect-5000-clout',
    unlockCost: 2000,
  },
];

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'happy-hour',
    name: 'Happy Hour',
    description: 'Double XP, more enemies!',
    duration: 30,
    effects: ['xp-multiplier-2', 'spawn-rate-1.5'],
    minTime: 1,
    weight: 20,
  },
  {
    id: 'lights-out',
    name: 'Lights Out',
    description: 'The lights go dark...',
    duration: 20,
    effects: ['reduced-visibility', 'enemy-speed-0.8'],
    minTime: 2,
    weight: 15,
  },
  {
    id: 'mosh-pit',
    name: 'Mosh Pit',
    description: 'A swarm approaches!',
    duration: 25,
    effects: ['spawn-swarm'],
    minTime: 2,
    weight: 20,
  },
  {
    id: 'security-sweep',
    name: 'Security Sweep',
    description: 'Backup has arrived!',
    duration: 20,
    effects: ['spawn-allies'],
    minTime: 1.5,
    weight: 15,
  },
  {
    id: 'last-song',
    name: 'Last Song',
    description: 'Everyone goes wild!',
    duration: 25,
    effects: ['player-speed-1.3', 'enemy-speed-1.3'],
    minTime: 3,
    weight: 15,
  },
  {
    id: 'vip-arrival',
    name: 'VIP Arrival',
    description: 'Elite enemies incoming!',
    duration: 30,
    effects: ['elite-spawn-guaranteed'],
    minTime: 2.5,
    weight: 10,
  },
  {
    id: 'drink-special',
    name: 'Drink Special',
    description: 'Health drops more common!',
    duration: 30,
    effects: ['health-drop-rate-3'],
    minTime: 1,
    weight: 20,
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-timer',
    name: 'First Timer',
    description: 'Start your first run',
    icon: '🎉',
    condition: 'runs >= 1',
  },
  {
    id: 'survivor-5',
    name: 'Warmed Up',
    description: 'Survive for 5 minutes',
    icon: '⏱️',
    condition: 'survival >= 5',
  },
  {
    id: 'reach-3am',
    name: 'Past Midnight',
    description: 'Reach 3:00 AM',
    icon: '🌙',
    condition: 'reached-3am',
  },
  {
    id: 'first-boss',
    name: 'Boss Slayer',
    description: 'Defeat your first boss',
    icon: '🏆',
    condition: 'bosses >= 1',
    reward: { type: 'clout', id: '100' },
  },
  {
    id: 'evolve-weapon',
    name: 'Evolution',
    description: 'Evolve a weapon',
    icon: '✨',
    condition: 'evolutions >= 1',
  },
  {
    id: 'kill-100',
    name: 'Bouncer',
    description: 'Defeat 100 enemies in one run',
    icon: '💯',
    condition: 'kills-run >= 100',
  },
  {
    id: 'kill-500',
    name: 'Crowd Control',
    description: 'Defeat 500 enemies in one run',
    icon: '🔥',
    condition: 'kills-run >= 500',
  },
  {
    id: 'kill-1000',
    name: 'Club Legend',
    description: 'Defeat 1000 enemies in one run',
    icon: '👑',
    condition: 'kills-run >= 1000',
  },
  {
    id: 'max-weapon',
    name: 'Maxed Out',
    description: 'Max out a weapon',
    icon: '⬆️',
    condition: 'max-weapon-level',
  },
  {
    id: 'reach-4am',
    name: 'Night Owl',
    description: 'Reach 4:00 AM',
    icon: '🦉',
    condition: 'reached-4am',
  },
  {
    id: 'reach-5am',
    name: 'All Nighter',
    description: 'Reach 5:00 AM',
    icon: '🌅',
    condition: 'reached-5am',
  },
  {
    id: 'survive-last-call',
    name: 'Last Call',
    description: 'Survive until 6:00 AM',
    icon: '🏆',
    condition: 'victory',
    reward: { type: 'character', id: 'bartender' },
  },
  {
    id: 'collect-1000-xp',
    name: 'Experience',
    description: 'Collect 1000 XP in one run',
    icon: '📈',
    condition: 'xp-run >= 1000',
  },
  {
    id: 'reach-level-20',
    name: 'Veteran',
    description: 'Reach level 20',
    icon: '🎖️',
    condition: 'level >= 20',
  },
  {
    id: 'no-damage-boss',
    name: 'Flawless',
    description: 'Defeat a boss without taking damage',
    icon: '💎',
    condition: 'flawless-boss',
  },
];

export function getUpgrade(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find(u => u.id === id);
}

export function getCharacter(id: string): CharacterDefinition | undefined {
  return CHARACTERS.find(c => c.id === id);
}

export function getEvent(id: string): GameEvent | undefined {
  return GAME_EVENTS.find(e => e.id === id);
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAvailableUpgrades(
  currentUpgrades: Map<string, number>,
  currentWeapons: Map<string, number>,
  unlockedUpgrades: string[]
): UpgradeDefinition[] {
  return UPGRADES.filter(upgrade => {
    // Check if already maxed
    const currentLevel = currentUpgrades.get(upgrade.id) || 0;
    if (currentLevel >= upgrade.maxLevel) return false;
    
    // Check weapon requirement
    if (upgrade.requiresWeapon && !currentWeapons.has(upgrade.requiresWeapon)) return false;
    
    // Check unlock status (if has unlock requirement)
    if (upgrade.unlockedBy && !unlockedUpgrades.includes(upgrade.id)) return false;
    
    return true;
  });
}

export function getAvailableWeaponsForUpgrade(
  currentWeapons: Map<string, number>,
  unlockedWeapons: string[]
): string[] {
  // This function is for future use in meta-progression
  // Returns weapon IDs that can be upgraded or added
  const result: string[] = [];
  
  for (const weaponId of unlockedWeapons) {
    const currentLevel = currentWeapons.get(weaponId) || 0;
    if (currentLevel === 0 || currentLevel < 8) {
      result.push(weaponId);
    }
  }
  
  return result;
}
