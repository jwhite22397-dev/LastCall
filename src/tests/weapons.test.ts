import { describe, expect, it } from 'vitest';
import { getWeaponStats, isEvolution, getBaseWeapons, getWeapon } from '../data/weapons';
import { getAvailableUpgrades } from '../data/upgrades';

describe('weapon stats', () => {
  it('adds level bonuses on top of the base bottle', () => {
    const base = getWeaponStats('bottle-toss', 1);
    const leveled = getWeaponStats('bottle-toss', 3);
    expect(base.damage).toBe(15);
    expect(base.projectileCount).toBe(1);
    expect(leveled.damage).toBe(20);
    expect(leveled.projectileCount).toBe(2);
  });

  it('keeps evolved weapons out of the base pool', () => {
    expect(isEvolution('bottle-service')).toBe(true);
    expect(isEvolution('bottle-toss')).toBe(false);
    const ids = getBaseWeapons().map((w) => w.id);
    expect(ids).toContain('bass-drop');
    expect(ids).not.toContain('earthquake');
  });

  it('only offers weapon-specific passives when that weapon is owned', () => {
    const without = getAvailableUpgrades(new Map(), new Map(), []);
    expect(without.find((u) => u.id === 'broken-glass')).toBeUndefined();

    const withBottle = getAvailableUpgrades(new Map(), new Map([['bottle-toss', 1]]), []);
    expect(withBottle.find((u) => u.id === 'broken-glass')).toBeDefined();
  });

  it('stops offering a passive that is already maxed', () => {
    const maxed = getAvailableUpgrades(new Map([['designated-driver', 5]]), new Map(), []);
    expect(maxed.find((u) => u.id === 'designated-driver')).toBeUndefined();
    expect(getWeapon('bottle-toss')?.maxLevel).toBe(8);
  });
});
