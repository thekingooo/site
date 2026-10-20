export const TOTAL_TURNS = 4;
export const TAU = Math.PI * 2;

export function sceneState(progress: number, reducedMotion = false) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const phase = p * TOTAL_TURNS;
  const from = Math.min(3, Math.floor(phase));
  const fraction = phase - from;
  // The swap happens while the open face is turned away from the camera.
  const mix = smoothstep(0.32, 0.68, fraction);
  const index = Math.min(4, Math.round(phase));
  return {
    progress: p,
    phase,
    index,
    from,
    to: from + 1,
    mix,
    // Negative Y is clockwise when viewed from above.
    rotation: reducedMotion ? 0 : -phase * TAU,
    explosion: reducedMotion ? 0 : Math.sin(fraction * Math.PI) ** 2,
  };
}

export function smoothstep(min: number, max: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}
