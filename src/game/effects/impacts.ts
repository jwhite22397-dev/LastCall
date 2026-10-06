export interface ImpactStyle {
  color: number;
  sparks: number;
}

const IMPACTS: Record<string, ImpactStyle> = {
  'bottle-toss': { color: 0x22c55e, sparks: 6 },
  'bottle-service': { color: 0xf5d76e, sparks: 8 },
  'glow-stick': { color: 0x4ade80, sparks: 4 },
  'disco-ball': { color: 0xff77ee, sparks: 7 },
  'speaker-blast': { color: 0xff00ff, sparks: 5 },
  'wall-of-sound': { color: 0xff66ff, sparks: 8 },
  'strobe': { color: 0xfff36b, sparks: 6 },
  'laser-show': { color: 0xff3355, sparks: 8 },
  'bass-drop': { color: 0xff3366, sparks: 7 },
  'earthquake': { color: 0xff0044, sparks: 8 },
  'ice-bucket': { color: 0x67e8f9, sparks: 5 },
  'champagne-orbit': { color: 0xfde68a, sparks: 6 },
  'security-call': { color: 0x818cf8, sparks: 4 },
  'riot-squad': { color: 0x6366f1, sparks: 5 },
};

export function impactFor(weaponId?: string): ImpactStyle {
  if (!weaponId) return { color: 0xfff1f2, sparks: 3 };
  return IMPACTS[weaponId] ?? { color: 0xffffff, sparks: 4 };
}
