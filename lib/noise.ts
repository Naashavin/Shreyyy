// Lightweight 1D value-noise used for organic, non-looping flame flicker.
// This is intentionally not a CSS keyframe: each flame gets its own seed so
// the movement never repeats in unison.

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// Deterministic pseudo-random from an integer + seed.
function hash(i: number, seed: number) {
  let x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Smooth 1D value noise in the range [0, 1]. */
export function valueNoise1D(x: number, seed = 0) {
  const i = Math.floor(x)
  const f = x - i
  const a = hash(i, seed)
  const b = hash(i + 1, seed)
  return lerp(a, b, fade(f))
}

/** Fractal (layered) noise for richer, less predictable motion. */
export function fbm1D(x: number, seed = 0, octaves = 3) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise1D(x * freq, seed + o * 13.37) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}
