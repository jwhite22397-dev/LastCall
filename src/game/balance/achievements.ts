export interface AchievementContext {
  totalRuns: number;
  longestSurvival: number;
  runSeconds: number;
  inGameMinutes: number;
  lifetimeBosses: number;
  runBosses: number;
  evolutions: number;
  runKills: number;
  runLevel: number;
  victory: boolean;
  runXp: number;
  flawlessBoss: boolean;
  reachedMaxWeapon: boolean;
}

export function metAchievement(id: string, ctx: AchievementContext): boolean {
  switch (id) {
    case 'first-timer':
      return ctx.totalRuns >= 1;
    case 'survivor-5':
      return ctx.runSeconds >= 5 * 60 || ctx.longestSurvival >= 5 * 60;
    case 'reach-3am':
      return ctx.inGameMinutes >= 60;
    case 'first-boss':
      return ctx.lifetimeBosses >= 1 || ctx.runBosses >= 1;
    case 'evolve-weapon':
      return ctx.evolutions >= 1;
    case 'kill-100':
      return ctx.runKills >= 100;
    case 'kill-500':
      return ctx.runKills >= 500;
    case 'kill-1000':
      return ctx.runKills >= 1000;
    case 'max-weapon':
      return ctx.reachedMaxWeapon;
    case 'reach-4am':
      return ctx.inGameMinutes >= 120;
    case 'reach-5am':
      return ctx.inGameMinutes >= 180;
    case 'survive-last-call':
      return ctx.victory;
    case 'collect-1000-xp':
      return ctx.runXp >= 1000;
    case 'reach-level-20':
      return ctx.runLevel >= 20;
    case 'no-damage-boss':
      return ctx.flawlessBoss;
    default:
      return false;
  }
}

export function newlyMetAchievements(already: string[], ctx: AchievementContext, ids: string[]): string[] {
  return ids.filter((id) => !already.includes(id) && metAchievement(id, ctx));
}
