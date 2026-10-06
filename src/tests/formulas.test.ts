import { describe, expect, it } from 'vitest';
import {
  applyArmor,
  calculateClout,
  critMultiplier,
  distanceToSegment,
  formatClock,
  upgradeCost,
  weightedIndex,
  xpToNextLevel,
} from '../game/balance/formulas';
import { synergyActive } from '../game/balance/synergies';
import { metAchievement, newlyMetAchievements } from '../game/balance/achievements';

const emptyRun = {
  totalRuns: 1,
  longestSurvival: 0,
  runSeconds: 30,
  inGameMinutes: 10,
  lifetimeBosses: 0,
  runBosses: 0,
  evolutions: 0,
  runKills: 3,
  runLevel: 2,
  victory: false,
  runXp: 20,
  flawlessBoss: false,
  reachedMaxWeapon: false,
};

describe('combat formulas', () => {
  it('reduces damage with armor and caps the reduction', () => {
    expect(applyArmor(100, 0.25)).toBe(75);
    expect(applyArmor(100, 0.9)).toBe(25);
    expect(applyArmor(40, 0)).toBe(40);
  });

  it('scales crits with bonus crit damage', () => {
    expect(critMultiplier(false, 0.5)).toBe(1);
    expect(critMultiplier(true, 0.5)).toBe(2);
  });

  it('pays clout for time, kills, bosses, and a clear', () => {
    expect(calculateClout({
      inGameMinutes: 60,
      kills: 25,
      bosses: 1,
      victory: false,
      cloutMultiplier: 1,
    })).toBe(30 + 2 + 50);

    expect(calculateClout({
      inGameMinutes: 240,
      kills: 0,
      bosses: 4,
      victory: true,
      cloutMultiplier: 1.5,
    })).toBe(Math.floor((120 + 200 + 500) * 1.5));
  });

  it('maps the night clock from 2 AM to 6 AM', () => {
    expect(formatClock(0)).toBe('2:00 AM');
    expect(formatClock(60)).toBe('3:00 AM');
    expect(formatClock(239)).toBe('5:59 AM');
  });

  it('raises the next level and the meta price', () => {
    expect(xpToNextLevel(1)).toBeGreaterThan(10);
    expect(xpToNextLevel(8)).toBeGreaterThan(xpToNextLevel(3));
    expect(upgradeCost(100, 0)).toBe(100);
    expect(upgradeCost(100, 2)).toBeGreaterThan(upgradeCost(100, 1));
  });

  it('measures distance to a beam segment', () => {
    expect(distanceToSegment(0, 1, 0, 0, 10, 0)).toBeCloseTo(1);
    expect(distanceToSegment(5, 0, 0, 0, 10, 0)).toBeCloseTo(0);
    expect(distanceToSegment(-2, 0, 0, 0, 10, 0)).toBeCloseTo(2);
  });

  it('picks a weighted index from a 0-1 roll', () => {
    expect(weightedIndex([1, 1, 1], 0)).toBe(0);
    expect(weightedIndex([1, 1, 1], 0.9)).toBe(2);
    expect(weightedIndex([10, 0], 0.5)).toBe(0);
  });
});

describe('synergies', () => {
  it('turns on when both families are owned, including evolutions', () => {
    expect(synergyActive(['bass-drop', 'strobe'], 'bass-strobe')).toBe(true);
    expect(synergyActive(['earthquake', 'laser-show'], 'bass-strobe')).toBe(true);
    expect(synergyActive(['bass-drop'], 'bass-strobe')).toBe(false);
    expect(synergyActive(['ice-bucket', 'bottle-service'], 'bucket-bottle')).toBe(true);
    expect(synergyActive(['security-call', 'champagne-orbit'], 'guard-bucket')).toBe(true);
    expect(synergyActive(['disco-ball', 'speaker-blast'], 'disco-strobe')).toBe(false);
  });
});

describe('achievements', () => {
  it('unlocks time and victory milestones from the run summary', () => {
    expect(metAchievement('reach-3am', { ...emptyRun, inGameMinutes: 60 })).toBe(true);
    expect(metAchievement('reach-3am', emptyRun)).toBe(false);
    expect(metAchievement('survive-last-call', { ...emptyRun, victory: true })).toBe(true);
    expect(metAchievement('kill-100', { ...emptyRun, runKills: 100 })).toBe(true);
  });

  it('skips achievements the player already has', () => {
    const fresh = newlyMetAchievements(
      ['first-timer'],
      { ...emptyRun, inGameMinutes: 60, runKills: 100 },
      ['first-timer', 'reach-3am', 'kill-100', 'survive-last-call'],
    );
    expect(fresh).toEqual(['reach-3am', 'kill-100']);
  });
});
