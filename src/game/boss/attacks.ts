export type TelegraphShape = 'circle' | 'line' | 'player-circle' | 'spokes';
export type BossAttackEffect = 'damage-circle' | 'damage-at-aim' | 'dash' | 'spokes' | 'summon' | 'beam';

export interface BossAttackDef {
  id: string;
  label: string;
  shape: TelegraphShape;
  effect: BossAttackEffect;
  radius: number;
  color: number;
  windup: number;
  damageScale: number;
  summonId?: string;
  summonCount?: number;
  spokeCount?: number;
}

export const BOSS_ATTACKS: Record<string, BossAttackDef> = {
  charge: { id: 'charge', label: 'CHARGE', shape: 'line', effect: 'dash', radius: 320, color: 0xff8800, windup: 480, damageScale: 1.2 },
  slam: { id: 'slam', label: 'SLAM', shape: 'circle', effect: 'damage-circle', radius: 140, color: 0xff6600, windup: 560, damageScale: 1 },
  'summon-bros': { id: 'summon-bros', label: 'BROS', shape: 'circle', effect: 'summon', radius: 90, color: 0xffaa44, windup: 500, damageScale: 0, summonId: 'party-crasher', summonCount: 3 },
  'sound-wave': { id: 'sound-wave', label: 'WAVE', shape: 'spokes', effect: 'spokes', radius: 220, color: 0xff00ff, windup: 500, damageScale: 0.55, spokeCount: 8 },
  'bass-slam': { id: 'bass-slam', label: 'BASS', shape: 'circle', effect: 'damage-circle', radius: 200, color: 0xff3377, windup: 640, damageScale: 1.35 },
  'speaker-summon': { id: 'speaker-summon', label: 'CROWD', shape: 'circle', effect: 'summon', radius: 100, color: 0xaa66ff, windup: 520, damageScale: 0, summonId: 'phone-guy', summonCount: 2 },
  'drop-the-bass': { id: 'drop-the-bass', label: 'DROP', shape: 'circle', effect: 'damage-circle', radius: 270, color: 0xff0044, windup: 720, damageScale: 1.7 },
  'paperwork-barrage': { id: 'paperwork-barrage', label: 'PAPER', shape: 'spokes', effect: 'spokes', radius: 260, color: 0x88aaff, windup: 480, damageScale: 0.45, spokeCount: 6 },
  'call-security': { id: 'call-security', label: 'SECURITY', shape: 'circle', effect: 'summon', radius: 110, color: 0x6666ff, windup: 560, damageScale: 0, summonId: 'bouncer', summonCount: 2 },
  'close-sections': { id: 'close-sections', label: 'MOVE', shape: 'player-circle', effect: 'damage-at-aim', radius: 120, color: 0x44ddff, windup: 700, damageScale: 1.1 },
  'last-call-warning': { id: 'last-call-warning', label: 'LAST CALL', shape: 'spokes', effect: 'spokes', radius: 240, color: 0xffdd44, windup: 600, damageScale: 0.5, spokeCount: 12 },
  'final-tab': { id: 'final-tab', label: 'TAB', shape: 'circle', effect: 'damage-circle', radius: 230, color: 0xff2244, windup: 680, damageScale: 1.6 },
  'mass-eviction': { id: 'mass-eviction', label: 'OUT', shape: 'line', effect: 'dash', radius: 340, color: 0xff4422, windup: 420, damageScale: 1.3 },
  'light-beam': { id: 'light-beam', label: 'BEAM', shape: 'line', effect: 'beam', radius: 420, color: 0xffee66, windup: 620, damageScale: 1.2 },
  'reality-check': { id: 'reality-check', label: 'MOVE', shape: 'player-circle', effect: 'damage-at-aim', radius: 115, color: 0xffcc00, windup: 680, damageScale: 1 },
  'hangover-wave': { id: 'hangover-wave', label: 'WAVE', shape: 'circle', effect: 'damage-circle', radius: 210, color: 0xffaa00, windup: 600, damageScale: 1.15 },
  'blinding-light': { id: 'blinding-light', label: 'LIGHT', shape: 'circle', effect: 'damage-circle', radius: 280, color: 0xffffaa, windup: 740, damageScale: 1.5 },
  'full-exposure': { id: 'full-exposure', label: 'EXPOSED', shape: 'player-circle', effect: 'damage-at-aim', radius: 170, color: 0xffffff, windup: 700, damageScale: 1.4 },
};

export function bossAttack(id: string): BossAttackDef {
  return BOSS_ATTACKS[id] ?? {
    id,
    label: 'HIT',
    shape: 'circle',
    effect: 'damage-circle',
    radius: 120,
    color: 0xff3355,
    windup: 500,
    damageScale: 1,
  };
}
