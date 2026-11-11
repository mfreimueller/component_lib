// Seeded shuffle: the same seed always gives the same order, so a reload shows the same pieces.
// All arithmetic is unsigned 32-bit; ports must reproduce it exactly (see PORTING.md).

/** Fisher-Yates driven by mulberry32. Returns a new array; the input is not changed. */
export function shuffled<T>(items: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Mixes a base seed with a number (e.g. a puzzle id) so each puzzle gets its own order. */
export function mixSeed(seed: number, salt: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) + Math.imul(salt, 0xc2b2ae35)) >>> 0;
}

/** A random unsigned 32-bit seed, e.g. for a new practice session. */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}
