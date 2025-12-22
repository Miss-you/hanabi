/** Firework explosion types */
export type FireworkType = "kiku" | "willow" | "botan" | "piano";

/** Particle configuration based on firework type */
export interface ParticleConfig {
  friction: number;
  gravity: number;
  decayMin: number;
  decayMax: number;
  maxHistory: number;
  lineWidth: number;
}

/** Particle configurations for each firework type */
export const PARTICLE_CONFIGS: Record<FireworkType, ParticleConfig> = {
  kiku: {
    friction: 0.93,
    gravity: 0.04,
    decayMin: 0.005,
    decayMax: 0.011,
    maxHistory: 12,
    lineWidth: 2.5,
  },
  willow: {
    friction: 0.95,
    gravity: 0.06,
    decayMin: 0.0025,
    decayMax: 0.0055,
    maxHistory: 20,
    lineWidth: 1.0,
  },
  botan: {
    friction: 0.92,
    gravity: 0.05,
    decayMin: 0.008,
    decayMax: 0.016,
    maxHistory: 4,
    lineWidth: 1.5,
  },
  piano: {
    friction: 0.9,
    gravity: 0.03,
    decayMin: 0.011,
    decayMax: 0.02,
    maxHistory: 8,
    lineWidth: 1.5,
  },
};

/** Position in 2D space */
export interface Point {
  x: number;
  y: number;
}

/** Trail point with alpha */
export interface TrailPoint extends Point {
  alpha: number;
}

/** Audio timeline event types */
export type AudioEventType = "bass" | "mid" | "piano" | "climax";

/** Audio analysis event */
export interface AudioEvent {
  launchTime: number;
  explodeTime: number;
  type: AudioEventType;
  isClimax: boolean;
  targetY: number;
  energy: number;
}

/** Visual configuration constants */
export const VISUAL_CONFIG = {
  SKY_GRADIENT_TOP: "#020514",
  SKY_GRADIENT_BOTTOM: "#182042",
  WATER_HEIGHT_RATIO: 0.2,
  REFLECTION_ALPHA: 0.3,
} as const;

/** Firework launch parameters */
export interface LaunchParams {
  duration: number;
  targetY: number;
}

/** Particle creation options */
export interface ParticleOptions {
  x: number;
  y: number;
  color: string;
  type: FireworkType;
  config?: Partial<ParticleConfig>;
}

/** Firework creation options */
export interface FireworkOptions {
  x: number;
  targetY: number;
  type: FireworkType;
  hue: number;
  energy?: number;
  delay?: number;
}

// ============================================
// Choreography Types
// ============================================

/** Pattern types for artistic firework displays */
export type PatternType =
  | "single" // 单发
  | "salvo" // 齐射
  | "cascade" // 瀑布流
  | "symmetric" // 对称双发
  | "rising" // 升序阶梯
  | "pulse" // 节拍脉冲
  | "cluster" // 聚簇爆发
  | "cross" // 交叉对角
  | "scatter" // 稀疏散点
  | "finale"; // 大结局

/** Music section types */
export type SectionType =
  | "intro"
  | "verse"
  | "prechorus"
  | "chorus"
  | "bridge"
  | "climax"
  | "outro";

/** Music section detected from audio */
export interface MusicSection {
  type: SectionType;
  startTime: number;
  endTime: number;
  energy: number;
  density: number;
}

/** Launch command for choreography */
export interface LaunchCommand {
  pattern: PatternType;
  launchTime: number;
  params: LaunchParams & {
    count?: number;
    x?: number;
    hue?: number;
    type?: FireworkType;
    direction?: "left" | "right" | "center" | "outward";
    spread?: number;
    interval?: number;
    energy?: number;
  };
}

/** Single firework launch configuration */
export interface LaunchConfig {
  type: FireworkType;
  x: number;
  targetY: number;
  energy: number;
  hue: number;
  instant?: boolean;
  delay?: number;
}
