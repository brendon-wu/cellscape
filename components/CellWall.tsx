"use client";

import { useEffect, useMemo, useRef } from "react";

// The cell wall is a flat, front-on grid of squares, so it is drawn on a 2D canvas: no WebGL context or
// shader setup, which used to stall the page for 50-200 ms the first time the simulator came into view.
// Framing and colors match the previous three.js version (camera fov 30 at z=106, y=-1; linear-light color math).

const STRINGS = 14, COLS = 8, ROWS = 52, CPS = COLS * ROWS;
const N = STRINGS * CPS;
const GAP = 1.6;
const GRID_W = STRINGS * COLS + (STRINGS - 1) * GAP;
const VIEW_H = 2 * 106 * Math.tan((15 * Math.PI) / 180); // world units visible vertically
const CAM_Y = -1;
const CELL = 0.82;
const BG = "#0b0e10";

type RGB = [number, number, number]; // linear light
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const hex = (h: string): RGB => [0, 2, 4].map((i) => toLin(parseInt(h.slice(1 + i, 3 + i), 16) / 255)) as RGB;

const DEAD = hex("#1a2023"), TRAPPED = hex("#f5b83d"), CHARGE = hex("#3ddc84"), CULPRIT = hex("#e23b3b");
const RAMP: [number, RGB][] = [
  [0.7, hex("#e23b3b")],
  [0.76, hex("#f2683c")],
  [0.82, hex("#f5b83d")],
  [0.88, hex("#c8e35a")],
  [0.94, hex("#3ddc84")],
];
/** Health ramp, red (<=70% SOH) to green (>=94%), interpolated in linear light. Writes into `out`. */
function health(soh: number, out: RGB) {
  const set = (c: RGB) => ((out[0] = c[0]), (out[1] = c[1]), (out[2] = c[2]), out);
  if (soh <= RAMP[0][0]) return set(RAMP[0][1]);
  for (let i = 1; i < RAMP.length; i++) {
    const [t1, c1] = RAMP[i], [t0, c0] = RAMP[i - 1];
    if (soh <= t1) {
      const f = (soh - t0) / (t1 - t0);
      for (let k = 0; k < 3; k++) out[k] = c0[k] + (c1[k] - c0[k]) * f;
      return out;
    }
  }
  return set(RAMP[RAMP.length - 1][1]);
}

// Linear color times a brightness factor -> one packed RGBA pixel (little-endian ABGR) for an ImageData buffer.
const px = (c: RGB, k: number) => {
  const r = Math.round(toSrgb(Math.min(1, c[0] * k)) * 255);
  const g = Math.round(toSrgb(Math.min(1, c[1] * k)) * 255);
  const b = Math.round(toSrgb(Math.min(1, c[2] * k)) * 255);
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
};
const BG_PX = px(hex(BG), 1);
const CULPRIT_PX = px(CULPRIT, 2.4), DEAD_PX = px(DEAD, 1);

interface Props {
  soh: Float32Array;
  mode: "fixed" | "cellscape";
  drawn: React.RefObject<number>; // Ah drawn per series string, as a fraction of nameplate cell Ah
  nMinFrac: number;
}

export default function CellWall({ soh, mode, drawn, nMinFrac }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  // Per-string stop point: fixed = weakest cell; cellscape = when active cells drop below nMin.
  const stops = useMemo(() => {
    const out = new Float32Array(STRINGS);
    const nMin = Math.ceil(nMinFrac * CPS);
    for (let s = 0; s < STRINGS; s++) {
      const sl = soh.slice(s * CPS, (s + 1) * CPS).sort();
      out[s] = mode === "fixed" ? sl[0] : sl[CPS - nMin];
    }
    return out;
  }, [soh, mode, nMinFrac]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    const col: RGB = [0, 0, 0];
    let w = 0, h = 0, last = -1, raf = 0, visible = false;
    let img: ImageData | null = null, buf: Uint32Array | null = null;

    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      img = ctx.createImageData(w, h);
      buf = new Uint32Array(img.data.buffer);
      last = -1;
    };

    // Pixels are written straight into one buffer (one putImageData per frame) instead of 5,824 fillRect calls.
    const draw = (d: number) => {
      if (!img || !buf) return;
      const u = h / VIEW_H; // pixels per world unit
      const half = (CELL * u) / 2;
      buf.fill(BG_PX);
      for (let i = 0; i < N; i++) {
        const s = (i / CPS) | 0, j = i - s * CPS;
        const hh = soh[i];
        const stop = stops[s];
        const locked = d >= stop && d > 0;
        const used = Math.min(d, stop);
        const soc = Math.max(0, hh - used) / hh;
        let c: number;
        if (d === 0) c = px(health(hh, col), hh < 0.8 ? 2.1 : 0.7); // at rest: weak cells stand out
        else if (mode === "fixed" && locked && hh <= stop + 1e-6) c = CULPRIT_PX; // the cell that stopped its string
        else if (mode === "cellscape" && hh <= used) c = DEAD_PX; // emptied and bypassed
        else if (locked && soc > 0.02) c = px(TRAPPED, 0.3 + 1.7 * soc); // energy stranded in healthy cells
        else c = px(CHARGE, 0.06 + 1.15 * soc); // draining charge
        const cx = w / 2 + (s * (COLS + GAP) + (j % COLS) - GRID_W / 2 + 0.5) * u;
        const cy = h / 2 - (((j / COLS) | 0) - ROWS / 2 - CAM_Y) * u;
        const x0 = Math.max(0, Math.round(cx - half)), x1 = Math.min(w, Math.round(cx + half));
        const y0 = Math.max(0, Math.round(cy - half)), y1 = Math.min(h, Math.round(cy + half));
        for (let y = y0; y < y1; y++) buf.fill(c, y * w + x0, y * w + x1);
      }
      ctx.putImageData(img, 0, 0);
    };

    // Redraw only while on screen, and only when the discharge level or the size changed.
    const tick = () => {
      const d = drawn.current ?? 0;
      if (d !== last) {
        last = d;
        draw(d);
      }
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    const ro = new ResizeObserver(() => {
      size();
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    size();
    io.observe(cv);
    ro.observe(cv);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [soh, mode, stops, drawn]);

  return <canvas ref={ref} className="block h-full w-full" style={{ background: BG }} aria-hidden="true" />;
}
