"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULTS, runSimulation } from "@/lib/sim";
import Counter from "./Counter";

const CellWall = dynamic(() => import("./CellWall"), { ssr: false, loading: () => <div className="h-full w-full bg-[#0b0e10]" /> });

const fmtUsd = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);
const DISCHARGE_MS = 5200;
const STRINGS = DEFAULTS.strings;
const CPS = DEFAULTS.cellsPerString;
const KWH_PER_AH_CELL = (DEFAULTS.cellAh * DEFAULTS.cellV) / 1000; // kWh per cell per unit of SOH drawn

/** Per-string discharge model for the live counters, matching what the cell walls draw. */
function laneModel(soh: Float32Array, mode: "fixed" | "cellscape") {
  const nMin = Math.ceil(DEFAULTS.nMinFrac * CPS);
  const stops = new Float32Array(STRINGS);
  for (let s = 0; s < STRINGS; s++) {
    const sl = soh.slice(s * CPS, (s + 1) * CPS).sort();
    stops[s] = mode === "fixed" ? sl[0] : sl[CPS - nMin];
  }
  // Delivered kWh, strings locked and cells bypassed after drawing `d` (fraction of nameplate Ah) from every string.
  const at = (d: number) => {
    let kwh = 0, locked = 0, bypassed = 0;
    for (let s = 0; s < STRINGS; s++) {
      const used = Math.min(d, stops[s]);
      if (d >= stops[s]) locked++;
      if (mode === "fixed") {
        kwh += CPS * used;
      } else {
        for (let i = s * CPS; i < (s + 1) * CPS; i++) {
          const h = soh[i];
          kwh += Math.min(used, h);
          if (h <= used) bypassed++;
        }
      }
    }
    return { kwh: kwh * KWH_PER_AH_CELL, locked, bypassed };
  };
  return { at, final: at(2) };
}

function RetentionChart({ fixed, cs, year, obligation }: { fixed: number[]; cs: number[]; year: number; obligation: number }) {
  // On phones, use a narrower, taller drawing so labels stay legible once the SVG scales down.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const W = narrow ? 320 : 560, H = narrow ? 230 : 210, P = 28;
  const lo = 0.7, hi = 1.0;
  const x = (i: number) => P + (i / (fixed.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - P * 2);
  const pts = (a: number[]) => a.map((v, i) => [x(i), y(Math.max(lo, v))] as const);
  const path = (a: number[]) => pts(a).map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
  const gap =
    pts(cs).map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("") +
    pts(fixed)
      .reverse()
      .map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`)
      .join("") +
    "Z";

  // Draw the lines in when the chart scrolls into view, and again whenever the data changes.
  const ref = useRef<SVGSVGElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const dataKey = `${fixed[20].toFixed(4)}-${cs[20].toFixed(4)}`;
  const glide = "transform 600ms cubic-bezier(0.22,1,0.36,1)";

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Capacity retention over 20 years">
      <defs>
        <linearGradient id="gapFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3ddc84" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3ddc84" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {[0.7, 0.8, 0.9, 1].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#1c2326" />
          <text x={2} y={y(v) + 4} fill="#8a9592" fontSize={narrow ? 9 : 10} className="num">
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}
      <line x1={P} x2={W - P} y1={y(obligation)} y2={y(obligation)} stroke="#f5b83d" strokeDasharray="4 4" />
      <text x={W - P} y={y(obligation) - 6} fill="#f5b83d" fontSize={narrow ? 9 : 10} textAnchor="end" className="num">
        CONTRACT FLOOR {Math.round(obligation * 100)}%
      </text>
      <g key={dataKey} className={seen ? "chart-in" : "chart-pre"}>
        <path d={gap} fill="url(#gapFill)" className="chart-gap" />
        <path d={path(fixed)} pathLength={1} fill="none" stroke="#e23b3b" strokeWidth="2" className="chart-line" />
        <path
          d={path(cs)}
          pathLength={1}
          fill="none"
          stroke="#3ddc84"
          strokeWidth="2.5"
          className="chart-line chart-line-late"
          style={{ filter: "drop-shadow(0 0 6px rgba(61,220,132,.6))" }}
        />
      </g>
      <g style={{ transform: `translateX(${x(year)}px)`, transition: glide }}>
        <line x1={0} x2={0} y1={P - 8} y2={H - P} stroke="#e8ecea" strokeOpacity="0.35" />
      </g>
      <circle r="4.5" fill="#e23b3b" style={{ transform: `translate(${x(year)}px, ${y(fixed[year])}px)`, transition: glide }} />
      <circle r="4.5" fill="#3ddc84" style={{ transform: `translate(${x(year)}px, ${y(cs[year])}px)`, transition: glide }} />
      {[0, 5, 10, 15, 20].map((t) => (
        <text key={t} x={x(t)} y={H - 8} fill="#8a9592" fontSize={narrow ? 9 : 10} textAnchor="middle" className="num">
          Y{t}
        </text>
      ))}
    </svg>
  );
}

export default function Simulator() {
  const [outlierLive, setOutlierLive] = useState(DEFAULTS.outlierFrac);
  const [outlier, setOutlier] = useState(DEFAULTS.outlierFrac);
  const [year, setYear] = useState(10);
  const [fleetMWh, setFleetMWh] = useState(100);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const drawn = useRef(0);
  const raf = useRef(0);
  const lanesRef = useRef<HTMLDivElement>(null);
  // Mount the WebGL cell walls only once the lanes approach the viewport, keeping first load light.
  // 0 = none, 1 = top wall, 2 = both. The walls mount on separate frames so their WebGL setup never lands in one long task.
  const [wallsOn, setWallsOn] = useState(0);
  useEffect(() => {
    if (wallsOn !== 1) return;
    const id = requestAnimationFrame(() => setTimeout(() => setWallsOn(2), 0));
    return () => cancelAnimationFrame(id);
  }, [wallsOn]);
  useEffect(() => {
    // Fetch and evaluate the cell-wall code while the browser is idle, so mounting later only creates the context.
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    // (Mounting the walls at load was tried and measured worse: their GPU setup stalled frames for seconds after load.)
    const prefetch = () => void import("./CellWall");
    if (w.requestIdleCallback) w.requestIdleCallback(prefetch);
    else setTimeout(prefetch, 1500);

    const el = lanesRef.current;
    if (!el) return;
    // Build the walls once they are near AND scrolling has paused, so their setup never interrupts motion.
    let near = false;
    let timer = 0;
    const tryMount = () => {
      clearTimeout(timer);
      if (near) timer = window.setTimeout(() => setWallsOn((n) => n || 1), 160);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        tryMount();
      },
      { rootMargin: "900px 0px" }
    );
    io.observe(el);
    window.addEventListener("scroll", tryMount, { passive: true });
    return () => {
      clearTimeout(timer);
      io.disconnect();
      window.removeEventListener("scroll", tryMount);
    };
  }, []);
  // Live readouts, written straight to the DOM each frame to avoid re-rendering React at 60 fps.
  const out = {
    fixedKwh: useRef<HTMLSpanElement>(null),
    csKwh: useRef<HTMLSpanElement>(null),
    fixedBar: useRef<HTMLDivElement>(null),
    csBar: useRef<HTMLDivElement>(null),
    fixedStat: useRef<HTMLSpanElement>(null),
    csStat: useRef<HTMLSpanElement>(null),
  };

  const params = useMemo(() => ({ ...DEFAULTS, outlierFrac: outlier }), [outlier]);
  const sim = useMemo(() => runSimulation(params), [params]);
  const fixed = sim.results.fixed;
  const cs = sim.results.wearLevel;
  const fixedRet = fixed.years.map((y) => y.retention);
  const csRet = cs.years.map((y) => y.retention);
  const containers = fleetMWh / (sim.nameplateKWh / 1000);

  const lanes = useMemo(
    () => ({ fixed: laneModel(fixed.years[year].soh, "fixed"), cellscape: laneModel(cs.years[year].soh, "cellscape") }),
    [fixed, cs, year]
  );
  const strandedKWh = Math.max(0, lanes.cellscape.final.kwh - lanes.fixed.final.kwh);

  const paint = (d: number) => {
    const f = lanes.fixed.at(d);
    const c = lanes.cellscape.at(d);
    const np = sim.nameplateKWh;
    if (out.fixedKwh.current) out.fixedKwh.current.textContent = Math.round(f.kwh).toLocaleString();
    if (out.csKwh.current) out.csKwh.current.textContent = Math.round(c.kwh).toLocaleString();
    if (out.fixedBar.current) out.fixedBar.current.style.transform = `scaleX(${f.kwh / np})`;
    if (out.csBar.current) out.csBar.current.style.transform = `scaleX(${c.kwh / np})`;
    if (out.fixedStat.current) out.fixedStat.current.textContent = `${f.locked}/${STRINGS} strings locked`;
    if (out.csStat.current) out.csStat.current.textContent = `${c.bypassed.toLocaleString()} cells bypassed`;
  };

  const discharge = () => {
    cancelAnimationFrame(raf.current);
    drawn.current = 0;
    setPhase("running");
    const lanesEl = lanesRef.current;
    if (lanesEl) {
      const r = lanesEl.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight) window.scrollTo({
          top: window.scrollY + r.top - 84,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DISCHARGE_MS);
      const d = (1 - Math.pow(1 - t, 1.6)) * 1.02; // fast start, slows as cells run out
      drawn.current = d;
      paint(d);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setPhase("done");
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    drawn.current = 0;
    setPhase("idle");
    paint(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes]);

  const laneMeta = {
    fixed: { label: "Your battery · conventional BMS", color: "#e23b3b", ret: fixedRet[year] },
    cellscape: { label: "Your battery · REON cell-level control", color: "#3ddc84", ret: csRet[year] },
  } as const;

  return (
    <section id="simulator" className="mx-auto max-w-7xl px-6 py-28 md:px-10">
      <p className="eyebrow mb-4">Simulate your battery · REON CES containers, 5.2 MWh each</p>
      <h2 className="max-w-4xl text-4xl font-light leading-[1.05] tracking-[-0.03em] md:text-6xl">
        Your fleet. Your year. <span className="text-accent">Your number.</span>
      </h2>
      <p className="mt-5 max-w-2xl text-muted">
        Set the size of your fleet and how long it has been running, then run the simulations. On top is your battery with a
        conventional BMS, where each string stops when its weakest cell empties. Below is the same battery with REON
        cell-level control, which bypasses cells as they empty and eases off weak cells so they age more slowly.
      </p>

      {/* Controls */}
      <div className="mt-12 grid items-end gap-6 rounded-2xl border border-line bg-surface p-6 md:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="fleet" className="eyebrow">Your fleet size</label>
            <span className="num text-xl">{fleetMWh} MWh</span>
          </div>
          <input id="fleet" type="range" min={5} max={1000} step={5} value={fleetMWh} onChange={(e) => setFleetMWh(+e.target.value)} className="mt-3 w-full" />
          <p className="mt-1 text-xs text-muted">≈ {containers.toFixed(1)} REON CES containers</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="year" className="eyebrow">Years in service</label>
            <span className="num text-xl">Y{year}</span>
          </div>
          <input id="year" type="range" min={0} max={20} value={year} onChange={(e) => setYear(+e.target.value)} className="mt-3 w-full" />
          <p className="mt-1 text-xs text-muted">Each cell ages individually</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="spread" className="eyebrow">Fast-aging cells</label>
            <span className="num text-sm">{(outlierLive * 100).toFixed(1)}%</span>
          </div>
          <input
            id="spread"
            type="range"
            min={0.005}
            max={0.06}
            step={0.0025}
            value={outlierLive}
            onChange={(e) => setOutlierLive(+e.target.value)}
            onPointerUp={() => setOutlier(outlierLive)}
            onKeyUp={() => setOutlier(outlierLive)}
            className="mt-3 w-full"
          />
          <p className="mt-1 text-xs text-muted">Default calibrated to Nature Energy 2026</p>
        </div>
        <button
          onClick={discharge}
          disabled={phase === "running"}
          className="discharge-btn h-14 rounded-full bg-accent px-8 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-60 md:min-w-[230px]"
        >
          {phase === "running" ? "Running…" : phase === "done" ? "Run again" : "Run the battery simulations"}
        </button>
      </div>

      {/* Race lanes */}
      <div ref={lanesRef} className="mt-4 grid gap-4">
        {(["fixed", "cellscape"] as const).map((mode, laneIdx) => {
          const isFixed = mode === "fixed";
          const m = laneMeta[mode];
          const done = phase === "done";
          return (
            <div
              key={mode}
              className={`relative overflow-hidden rounded-2xl border bg-[#0b0e10] transition-colors duration-500 ${
                done ? (isFixed ? "border-amber/60" : "border-accent/60") : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-4 md:px-6">
                <div>
                  <span className="eyebrow" style={{ color: m.color }}>{m.label}</span>
                  <p className="num mt-1 text-xs text-muted">
                    {(m.ret * 100).toFixed(1)}% usable at Y{year} ·{" "}
                    <span ref={isFixed ? out.fixedStat : out.csStat}>{isFixed ? `0/${STRINGS} strings locked` : "0 cells bypassed"}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="eyebrow">Energy delivered</span>
                  <div className="num text-3xl md:text-4xl" style={{ color: isFixed ? "#e8ecea" : "#3ddc84" }}>
                    <span ref={isFixed ? out.fixedKwh : out.csKwh}>0</span>
                    <span className="ml-1.5 text-base text-muted">kWh</span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[26/10] w-full md:aspect-[26/9]">
                {wallsOn > laneIdx && (
                  <CellWall soh={(isFixed ? fixed : cs).years[year].soh} mode={mode} drawn={drawn} nMinFrac={DEFAULTS.nMinFrac} />
                )}
                {done && (
                  <div
                    className={`lane-badge absolute left-1/2 top-1/2 flex w-max max-w-[92%] items-center justify-center gap-3 rounded-full border px-5 py-2.5 text-center md:px-6 md:py-3 ${
                      isFixed ? "border-amber/50 bg-[#1a1408]/90 text-amber" : "border-accent/50 bg-[#08180f]/90 text-accent"
                    }`}
                  >
                    <span className="num text-xs sm:text-sm md:text-base">
                      {isFixed
                        ? `STRINGS LOCKED · ${Math.round(strandedKWh).toLocaleString()} kWh stranded behind weak cells`
                        : `+${Math.round(strandedKWh).toLocaleString()} kWh delivered · weak cells bypassed`}
                    </span>
                  </div>
                )}
              </div>
              <div className="px-5 pb-4 md:px-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    ref={isFixed ? out.fixedBar : out.csBar}
                    className="h-full origin-left rounded-full"
                    style={{ transform: "scaleX(0)", background: isFixed ? (done ? "#f5b83d" : "#e8ecea") : "#3ddc84" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="eyebrow">Usable capacity over 20 years</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="h-0.5 w-4 bg-red" /> Conventional BMS
          </span>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="h-0.5 w-4 bg-accent" /> REON cell-level control
          </span>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2.5 w-4 rounded-sm bg-accent/25" /> What REON gives back
          </span>
        </div>
        <RetentionChart fixed={fixedRet} cs={csRet} year={year} obligation={DEFAULTS.obligationFrac} />
      </div>

      <p className="eyebrow mt-10 mb-4">What REON gives back · your {fleetMWh} MWh fleet</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { v: sim.extraYears, f: (n: number) => `+${n.toFixed(1)}`, u: "years", l: "more service before your contract floor is breached", accent: true },
          { v: sim.capexSavedUsd * containers, f: fmtUsd, u: "", l: "augmentation capex you avoid over 20 years" },
          { v: sim.npvGainUsd * containers, f: fmtUsd, u: "", l: "added NPV across your fleet (8% discount rate)" },
          {
            v: sim.tco2Avoided[1] * containers,
            f: (n: number) => Math.round(n).toLocaleString(),
            u: "tCO₂",
            l: `avoided cell manufacturing (range ${Math.round(sim.tco2Avoided[0] * containers).toLocaleString()}–${Math.round(sim.tco2Avoided[2] * containers).toLocaleString()})`,
          },
        ].map((m) => (
          <div key={m.l} className="rounded-2xl border border-line bg-surface p-6">
            <div className={`num text-4xl md:text-5xl ${m.accent ? "text-accent glow" : ""}`}>
              <Counter value={m.v} format={m.f} />
              {m.u && <span className="ml-2 text-base text-muted">{m.u}</span>}
            </div>
            <p className="mt-3 text-sm leading-snug text-muted">{m.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Modeled, not measured. Fixed string life {sim.lifeFixed} yrs vs CELLSCAPE {sim.lifeCellscape} yrs to the{" "}
        {Math.round(DEFAULTS.obligationFrac * 100)}% floor. Assumptions and sources are below.
      </p>
    </section>
  );
}
