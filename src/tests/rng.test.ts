import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../data/types';

describe('SeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = [a.next(), a.next(), a.nextInt(0, 10), a.pick(['x', 'y', 'z'])];
    const seqB = [b.next(), b.next(), b.nextInt(0, 10), b.pick(['x', 'y', 'z'])];
    expect(seqA).toEqual(seqB);
  });

  it('stays inside integer bounds', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 50; i++) {
      const n = rng.nextInt(3, 8);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(8);
    }
  });

  it('shuffles without dropping items', () => {
    const rng = new SeededRandom(99);
    const items = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = rng.shuffle(items);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort()).toEqual([...items].sort());
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
