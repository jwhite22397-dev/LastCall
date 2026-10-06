import { beforeEach, describe, expect, it } from 'vitest';
import { saveService } from '../services/SaveService';
import { INITIAL_SAVE } from '../data/types';

describe('save service', () => {
  beforeEach(() => {
    saveService.reset();
  });

  it('starts from the versioned default profile', () => {
    const data = saveService.getData();
    expect(data.version).toBe(INITIAL_SAVE.version);
    expect(data.clout).toBe(0);
    expect(data.unlockedCharacters).toContain('promoter');
    expect(data.settings.screenShake).toBe(true);
  });

  it('persists clout, unlocks, and a best time without shrinking it', () => {
    saveService.addClout(250);
    saveService.unlockCharacter('dj');
    saveService.unlockAchievement('first-timer');
    saveService.updateStats({ longestSurvival: 90 });
    saveService.updateStats({ longestSurvival: 40 });

    const data = saveService.getData();
    expect(data.clout).toBe(250);
    expect(data.stats.lifetimeClout).toBe(250);
    expect(data.unlockedCharacters).toContain('dj');
    expect(data.achievements).toContain('first-timer');
    expect(data.stats.longestSurvival).toBe(90);
  });

  it('refuses to spend clout it does not have and ranks permanent upgrades', () => {
    expect(saveService.spendClout(10)).toBe(false);
    saveService.addClout(100);
    expect(saveService.spendClout(40)).toBe(true);
    expect(saveService.getClout()).toBe(60);
    saveService.upgradePermanent('stamina');
    saveService.upgradePermanent('stamina');
    expect(saveService.getPermanentUpgradeLevel('stamina')).toBe(2);
  });

  it('round-trips through localStorage', () => {
    saveService.addClout(15);
    saveService.updateSettings({ damageNumbers: false, sfxVolume: 0.2 });
    const raw = localStorage.getItem('lastcall_save');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { clout: number; settings: { damageNumbers: boolean } };
    expect(parsed.clout).toBe(15);
    expect(parsed.settings.damageNumbers).toBe(false);
  });
});
