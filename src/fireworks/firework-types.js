/**
 * Firework type configurations
 * Defines physics params, colors, and velocity distributions for 5 types
 */

// Type enum for clarity
export const FIREWORK_TYPE = {
  BLOOM: 0,
  SPARK: 1,
  DRIFT: 2,
  SCATTER: 3,
  SPARKLER: 4
};

// Physics and visual config per type
export const FIREWORK_TYPES = {
  [FIREWORK_TYPE.BLOOM]: {
    name: 'bloom',
    gravity: -0.004,
    damping: 0.98,
    particles: 150,
    speed: 0.08,
    size: { min: 4, max: 8 },
    maxAge: { min: 1.5, max: 2.5 },
    colors: [
      [1.0, 0.84, 0.0],    // Gold
      [1.0, 0.9, 0.4],     // Light gold
      [1.0, 0.7, 0.0]      // Orange gold
    ]
  },
  [FIREWORK_TYPE.SPARK]: {
    name: 'spark',
    gravity: -0.002,
    damping: 0.95,
    particles: 200,
    speed: 0.15,
    size: { min: 2, max: 5 },
    maxAge: { min: 0.8, max: 1.5 },
    colors: [
      [1.0, 1.0, 1.0],     // White
      [0.9, 0.95, 1.0],    // Cool white
      [1.0, 0.98, 0.9]     // Warm white
    ]
  },
  [FIREWORK_TYPE.DRIFT]: {
    name: 'drift',
    gravity: -0.001,
    damping: 0.99,
    particles: 100,
    speed: 0.05,
    size: { min: 3, max: 6 },
    maxAge: { min: 2.0, max: 3.5 },
    colors: [
      [0.0, 1.0, 1.0],     // Cyan
      [0.4, 0.9, 1.0],     // Light cyan
      [0.0, 0.8, 0.9]      // Teal
    ]
  },
  [FIREWORK_TYPE.SCATTER]: {
    name: 'scatter',
    gravity: -0.003,
    damping: 0.96,
    particles: 180,
    speed: 0.12,
    size: { min: 2, max: 6 },
    maxAge: { min: 1.0, max: 2.0 },
    colors: [
      [1.0, 0.0, 0.5],     // Magenta
      [0.8, 0.0, 1.0],     // Purple
      [1.0, 0.2, 0.6],     // Pink
      [0.6, 0.0, 0.8]      // Violet
    ]
  },
  [FIREWORK_TYPE.SPARKLER]: {
    name: 'sparkler',
    gravity: -0.0005,
    damping: 0.995,
    particles: 80,
    speed: 0.02,
    size: { min: 2, max: 4 },
    maxAge: { min: 0.3, max: 0.8 },
    colors: [
      [1.0, 0.9, 0.6],     // Warm yellow
      [1.0, 0.95, 0.8],    // Light cream
      [1.0, 0.85, 0.5]     // Golden
    ]
  }
};

// Golden ratio for even spherical distribution (Bloom type)
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Generate velocity for Bloom type using golden ratio spherical distribution
 */
export function getBloomVelocity(index, totalParticles, speed) {
  // Fibonacci sphere distribution
  const y = 1 - (index / (totalParticles - 1)) * 2; // -1 to 1
  const radiusAtY = Math.sqrt(1 - y * y);
  const theta = GOLDEN_ANGLE * index;

  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  // Add slight randomness
  const jitter = 0.1;
  const speedVariation = speed * (0.8 + Math.random() * 0.4);

  return {
    vx: (x + (Math.random() - 0.5) * jitter) * speedVariation,
    vy: (y + (Math.random() - 0.5) * jitter) * speedVariation,
    vz: (z + (Math.random() - 0.5) * jitter) * speedVariation
  };
}

/**
 * Generate velocity for Spark type - high speed omnidirectional
 */
export function getSparkVelocity(speed) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const speedVariation = speed * (0.7 + Math.random() * 0.6);

  return {
    vx: Math.sin(phi) * Math.cos(theta) * speedVariation,
    vy: Math.sin(phi) * Math.sin(theta) * speedVariation,
    vz: Math.cos(phi) * speedVariation
  };
}

/**
 * Generate velocity for Drift type - horizontal bias, floating effect
 */
export function getDriftVelocity(speed) {
  // Horizontal bias - more spread in X/Z, less in Y
  const angle = Math.random() * Math.PI * 2;
  const horizontalSpeed = speed * (0.8 + Math.random() * 0.4);
  const verticalSpeed = speed * (0.2 + Math.random() * 0.3);

  return {
    vx: Math.cos(angle) * horizontalSpeed,
    vy: (Math.random() - 0.3) * verticalSpeed, // Slight upward bias
    vz: Math.sin(angle) * horizontalSpeed
  };
}

/**
 * Generate velocity for Scatter type - chaotic randomized trajectories
 */
export function getScatterVelocity(speed) {
  // Completely random direction with high variance
  const speedVariation = speed * (0.5 + Math.random() * 1.0);

  return {
    vx: (Math.random() - 0.5) * 2 * speedVariation,
    vy: (Math.random() - 0.5) * 2 * speedVariation,
    vz: (Math.random() - 0.5) * 2 * speedVariation
  };
}

/**
 * Generate velocity for Sparkler type - continuous fizzle, slow dispersion
 */
export function getSparklerVelocity(speed) {
  // Mostly upward with slight spread
  const angle = Math.random() * Math.PI * 2;
  const spreadRadius = Math.random() * speed;

  return {
    vx: Math.cos(angle) * spreadRadius,
    vy: speed * (0.5 + Math.random() * 0.5), // Always upward
    vz: Math.sin(angle) * spreadRadius
  };
}

/**
 * Get velocity based on firework type
 */
export function getVelocityForType(type, index, totalParticles, speed) {
  switch (type) {
    case FIREWORK_TYPE.BLOOM:
      return getBloomVelocity(index, totalParticles, speed);
    case FIREWORK_TYPE.SPARK:
      return getSparkVelocity(speed);
    case FIREWORK_TYPE.DRIFT:
      return getDriftVelocity(speed);
    case FIREWORK_TYPE.SCATTER:
      return getScatterVelocity(speed);
    case FIREWORK_TYPE.SPARKLER:
      return getSparklerVelocity(speed);
    default:
      return getSparkVelocity(speed);
  }
}

/**
 * Get random color from type's color palette
 */
export function getColorForType(type) {
  const config = FIREWORK_TYPES[type];
  const colors = config.colors;
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get random size within type's size range
 */
export function getSizeForType(type) {
  const config = FIREWORK_TYPES[type];
  return config.size.min + Math.random() * (config.size.max - config.size.min);
}

/**
 * Get random max age within type's range
 */
export function getMaxAgeForType(type) {
  const config = FIREWORK_TYPES[type];
  return config.maxAge.min + Math.random() * (config.maxAge.max - config.maxAge.min);
}

/**
 * Get random firework type
 */
export function getRandomType() {
  const types = Object.values(FIREWORK_TYPE);
  return types[Math.floor(Math.random() * types.length)];
}
