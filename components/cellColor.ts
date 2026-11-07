import { Color } from "three";

const STOPS: [number, Color][] = [
  [0.7, new Color("#e23b3b")],
  [0.76, new Color("#f2683c")],
  [0.82, new Color("#f5b83d")],
  [0.88, new Color("#c8e35a")],
  [0.94, new Color("#3ddc84")],
];

/** Health ramp: red (≤70% SOH) → green (≥94%). Writes into `out`. */
export function healthColor(soh: number, out: Color) {
  if (soh <= STOPS[0][0]) return out.copy(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    const [t0, c0] = STOPS[i - 1];
    if (soh <= t1) return out.copy(c0).lerp(c1, (soh - t0) / (t1 - t0));
  }
  return out.copy(STOPS[STOPS.length - 1][1]);
}

export const DEAD = new Color("#1a2023");
export const TRAPPED = new Color("#f5b83d");
