// NETRUN OS — seedable PRNG (xoshiro256**), for UI previews & reproducible tests ONLY.
// Consequential rolls resolve server-side (Edge Function `roll`, CSPRNG). This module
// must never be the authority for a real roll.
//
// xoshiro256** by Blackman & Vigna. State seeded via splitmix64. All math is done in
// 64-bit using BigInt with an explicit 0xFFFFFFFFFFFFFFFF mask.

const MASK64 = (1n << 64n) - 1n;

function rotl(x: bigint, k: bigint): bigint {
  return ((x << k) | (x >> (64n - k))) & MASK64;
}

/** splitmix64 — expands a single seed into well-mixed 64-bit words. */
function splitmix64(seed: bigint): () => bigint {
  let z = seed & MASK64;
  return () => {
    z = (z + 0x9e3779b97f4a7c15n) & MASK64;
    let x = z;
    x = ((x ^ (x >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    x = ((x ^ (x >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    x = x ^ (x >> 31n);
    return x & MASK64;
  };
}

export interface Rng {
  /** Next raw 64-bit value. */
  nextU64(): bigint;
  /** Float in [0, 1). */
  nextFloat(): number;
  /** Integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

class Xoshiro256ss implements Rng {
  private s: [bigint, bigint, bigint, bigint];

  constructor(seed: bigint) {
    const sm = splitmix64(seed);
    this.s = [sm(), sm(), sm(), sm()];
  }

  nextU64(): bigint {
    const [s0, s1, s2, s3] = this.s;
    const result = (rotl((s1 * 5n) & MASK64, 7n) * 9n) & MASK64;
    const t = (s1 << 17n) & MASK64;
    let n2 = s2 ^ s0;
    let n3 = s3 ^ s1;
    const n1 = s1 ^ n2;
    const n0 = s0 ^ n3;
    n2 = n2 ^ t;
    n3 = rotl(n3, 45n);
    this.s = [n0, n1, n2, n3];
    return result;
  }

  nextFloat(): number {
    // Top 53 bits -> [0, 1) double.
    return Number(this.nextU64() >> 11n) / 2 ** 53;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new Error("maxExclusive must be > 0");
    return Math.floor(this.nextFloat() * maxExclusive);
  }
}

/** Create a reproducible RNG from a numeric or bigint seed. */
export function createRng(seed: number | bigint): Rng {
  const s = typeof seed === "bigint" ? seed : BigInt(Math.floor(seed));
  // Avoid the all-zero state (xoshiro degenerates); splitmix64 handles 0 fine,
  // but nudge it anyway for clarity.
  return new Xoshiro256ss(s === 0n ? 0x1234abcdn : s);
}
