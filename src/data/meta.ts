export interface PermanentUpgrade {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  stat: 'maxHealth' | 'moveSpeed' | 'xpGain' | 'armor';
  value: number;
}

export const PERMANENT_UPGRADES: PermanentUpgrade[] = [
  {
    id: 'stamina',
    name: 'Stamina',
    description: '+8 max health',
    maxLevel: 5,
    baseCost: 150,
    stat: 'maxHealth',
    value: 8,
  },
  {
    id: 'hustle',
    name: 'Hustle',
    description: '+3% movement speed',
    maxLevel: 5,
    baseCost: 150,
    stat: 'moveSpeed',
    value: 0.03,
  },
  {
    id: 'reputation',
    name: 'Reputation',
    description: '+4% XP gain',
    maxLevel: 5,
    baseCost: 200,
    stat: 'xpGain',
    value: 0.04,
  },
  {
    id: 'thick-skin',
    name: 'Thick Skin',
    description: '+2% armor',
    maxLevel: 4,
    baseCost: 250,
    stat: 'armor',
    value: 0.02,
  },
];

export function getPermanentUpgrade(id: string): PermanentUpgrade | undefined {
  return PERMANENT_UPGRADES.find((u) => u.id === id);
}
