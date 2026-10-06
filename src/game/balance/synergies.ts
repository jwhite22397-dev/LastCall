export type SynergyId =
  | 'bass-strobe'
  | 'bucket-bottle'
  | 'speaker-bass'
  | 'strobe-glow'
  | 'disco-strobe'
  | 'guard-bucket';

const EVOLUTION_OF: Record<string, string> = {
  'bottle-service': 'bottle-toss',
  'wall-of-sound': 'speaker-blast',
  'laser-show': 'strobe',
  'champagne-orbit': 'ice-bucket',
  'earthquake': 'bass-drop',
  'riot-squad': 'security-call',
};

export function ownsFamily(owned: Iterable<string>, family: string): boolean {
  for (const id of owned) {
    if (id === family || EVOLUTION_OF[id] === family) return true;
  }
  return false;
}

export function synergyActive(owned: Iterable<string>, id: SynergyId): boolean {
  const pair = (a: string, b: string) => ownsFamily(owned, a) && ownsFamily(owned, b);
  switch (id) {
    case 'bass-strobe':
      return pair('bass-drop', 'strobe');
    case 'bucket-bottle':
      return pair('ice-bucket', 'bottle-toss');
    case 'speaker-bass':
      return pair('speaker-blast', 'bass-drop');
    case 'strobe-glow':
      return pair('strobe', 'glow-stick');
    case 'disco-strobe':
      return pair('disco-ball', 'strobe');
    case 'guard-bucket':
      return pair('security-call', 'ice-bucket');
    default:
      return false;
  }
}
