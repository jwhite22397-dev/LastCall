/** Pure combat and run formulas. Kept separate so balance can be tested without Phaser. */

export function xpToNextLevel(level: number): number {
  return Math.floor(10 + level * 5 * Math.pow(1.1, level));
}

export function applyArmor(damage: number, armor: number): number {
  const clamped = Math.min(0.75, Math.max(0, armor));
  return damage * (1 - clamped);
}

export function critMultiplier(isCrit: boolean, critDamageBonus: number): number {
  return isCrit ? 1.5 + Math.max(0, critDamageBonus) : 1;
}

export function calculateClout(input: {
  inGameMinutes: number;
  kills: number;
  bosses: number;
  victory: boolean;
  cloutMultiplier: number;
}): number {
  const base = Math.floor(Math.max(0, input.inGameMinutes) / 2);
  const killBonus = Math.floor(Math.max(0, input.kills) / 10);
  const bossBonus = Math.max(0, input.bosses) * 50;
  const victoryBonus = input.victory ? 500 : 0;
  const mult = Math.max(0, input.cloutMultiplier);
  return Math.floor((base + killBonus + bossBonus + victoryBonus) * mult);
}

/** 0 in-game minutes is 2:00 AM. 240 minutes is 6:00 AM. */
export function formatClock(inGameMinutes: number): string {
  const safe = Math.max(0, inGameMinutes);
  const hours = Math.floor(safe / 60) + 2;
  const minutes = Math.floor(safe % 60);
  const display = ((hours - 1) % 12) + 1;
  return `${display}:${minutes.toString().padStart(2, '0')} AM`;
}

export function upgradeCost(baseCost: number, currentLevel: number): number {
  return Math.floor(baseCost * Math.pow(1.65, Math.max(0, currentLevel)));
}

export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function weightedIndex(weights: number[], roll: number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0 || weights.length === 0) return 0;
  let cursor = roll * total;
  for (let i = 0; i < weights.length; i++) {
    cursor -= weights[i];
    if (cursor <= 0) return i;
  }
  return weights.length - 1;
}
