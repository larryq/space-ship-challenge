import { useMemo } from "react";

// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel from "./assets/asteroid1.glb";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel2 from "./assets/asteroid2.glb";
import ringPath from "./assets/green_rings1.png";
import ringPath2 from "./assets/blue_rings1.png";
import ringPath3 from "./assets/blue_rings2.png";
import ringPath4 from "./assets/red_rings1.png";
import ringPath5 from "./assets/neon_rings1.png";
import ringPath6 from "./assets/neon_rings2.png";
import ringPath7 from "./assets/magenta_rings1.png";
import ringPath8 from "./assets/nebula_ring1.png";
import ringPath9 from "./assets/particle_ring1.png";

// All your imports stay the same, plus add your asteroid models/rings as arrays:
const asteroidModels = [asteroidModel, asteroidModel2];
const ringTextures = [
  ringPath,
  ringPath2,
  ringPath3,
  ringPath4,
  ringPath5,
  ringPath6,
  ringPath7,
  ringPath8,
  ringPath9,
];

// ── Asteroid field config ─────────────────────────────────────────────────
const ASTEROID_CONFIG = {
  count: 40,
  minScale: 0.5,
  maxScale: 2.5,
  maxRadius: 300, // max distance from origin
  minRadius: 20, // don't spawn too close to origin either
  minClearance: 25, // minimum distance from protected points
  ringPercent: 0.3, // 30% get rings
  modelWeights: [0.6, 0.4], // 60% asteroid1, 40% asteroid2
};

// Points that asteroids must stay away from
const PROTECTED_POINTS: [number, number, number][] = [
  [0, 0, -100], // stargate
  [100, -75, -350], // courseway
];

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function distanceBetween(
  a: [number, number, number],
  b: [number, number, number],
) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

function isTooClose(
  pos: [number, number, number],
  protected_: [number, number, number][],
  minDist: number,
) {
  return protected_.some((p) => distanceBetween(pos, p) < minDist);
}

function pickModel(weights: number[]) {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return i;
  }
  return weights.length - 1;
}

export default function generateAsteroidField(
  config: typeof ASTEROID_CONFIG,
  PROTECTED_POINTS: [number, number, number][],
) {
  const asteroids = [];
  let attempts = 0;
  const maxAttempts = config.count * 20; // give up after this many tries

  while (asteroids.length < config.count && attempts < maxAttempts) {
    attempts++;

    // Random point in a sphere shell between minRadius and maxRadius
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = randomRange(config.minRadius, config.maxRadius);

    const pos: [number, number, number] = [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ];

    if (isTooClose(pos, PROTECTED_POINTS, config.minClearance)) continue;

    const modelIndex = pickModel(config.modelWeights);
    const hasRings = Math.random() < config.ringPercent;
    const ringIndex = Math.floor(Math.random() * ringTextures.length);

    asteroids.push({
      id: asteroids.length,
      position: pos,
      scale: randomRange(config.minScale, config.maxScale),
      model: asteroidModels[modelIndex],
      hasRings,
      ringTexturePath: hasRings ? ringTextures[ringIndex] : undefined,
    });
  }

  return asteroids;
}
