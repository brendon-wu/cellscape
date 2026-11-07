"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULTS, runSimulation } from "@/lib/sim";

const CellWall = dynamic(() => import("./CellWall"), { ssr: false, loading: () => <div className="h-full w-full bg-[#0b0e10]" /> });

const fmtUsd = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);

function RetentionChart({ fixed, cs, year, obligation }: { fixed: number[]; cs: number[]; year: number; obligation: number }) {
  const W = 560, H = 200, P = 28;
  const lo = 0.7, hi = 1.0;
  const x = (i: number) => P + (i / (fixed.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - P * 2);
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(Math.max(lo, v)).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Capacity retention over 20 years">
      {[0.7, 0.8, 0.9, 1].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#1c2326" />
          <text x={4} y={y(v) + 4} fill="#8a9592" fontSize="10" className="num">
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}
      <line x1={P} x2={W - P} y1={y(obligation)} y2={y(obligation)} stroke="#f5b83d" strokeDasharray="4 4" />
      <text x={W - P} y={y(obligation) - 6} fill="#f5b83d" fontSize="10" textAnchor="end" className="num">
        CONTRACT FLOOR {Math.round(obligation * 100)}%
      </text>
      <path d={path(fixed)} fill="none" stroke="#e23b3b" strokeWidth="2" />
      <path d={path(cs)} fill="none" stroke="#3ddc84" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 6px rgba(61,220,132,.6))" }} />
      <line x1={x(year)} x2={x(year)} y1={P - 8} y2={H - P} stroke="#e8ecea" strokeOpacity="0.35" />
      <circle cx={x(year)} cy={y(fixed[year])} r="4" fill="#e23b3b" />
      <circle cx={x(year)} cy={y(cs[year])} r="4" fill="#3ddc84" />
      {[0, 5, 10, 15, 20].map((t) => (
        <text key={t} x={x(t)} y={H - 8} fill="#8a9592" fontSize="10" textAnchor="middle" className="num">
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

  const params = useMemo(() => ({ ...DEFAULTS, outlierFrac: outlier }), [outlier]);
  const sim = useMemo(() => runSimulation(params), [params]);
  const fixed = sim.results.fixed;
  const cs = sim.results.wearLevel;
  const fixedRet = fixed.years.map((y) => y.retention);
  const csRet = cs.years.map((y) => y.retention);
  const strandedKWh = Math.max(0, (csRet[year] - fixedRet[year]) * sim.nameplateKWh);
  const containers = fleetMWh / (sim.nameplateKWh / 1000);

  const discharge = () => {
    cancelAnimationFrame(raf.current);
    drawn.current = 0;
    setPhase("running");
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 4200);
      drawn.current = t * 1.02;
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setPhase("done");
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    drawn.current = 0;
    setPhase("idle");
  }, [year, outlier]);

  return (
    <section id="simulator" className="mx-auto max-w-7xl px-6 py-28 md:px-10">
      <p className="eyebrow mb-4">Simulate your battery · REON CES containers, 5.2 MWh each</p>
      <h2 className="max-w-4xl text-4xl font-light leading-[1.05] tracking-[-0.03em] md:text-6xl">
        Your fleet. Your year. <span className="text-accent">Your number.</span>
      </h2>
      <p className="mt-5 max-w-2xl text-muted">
        Set the size of your fleet and how long it has been running, then discharge it. On the left is your battery with a
        conventional BMS, where each string stops when its weakest cell empties. On the right is the same battery with REON
        cell-level control, which bypasses cells as they empty and eases off weak cells so they age more slowly.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {(["fixed", "cellscape"] as const).map((mode) => {
          const isFixed = mode === "fixed";
          const ret = isFixed ? fixedRet[year] : csRet[year];
          return (
            <div key={mode} className="relative overflow-hidden rounded-2xl border border-line bg-[#0b0e10]">
              <div className="flex items-center justify-between px-5 pt-4">
                <span className="eyebrow" style={{ color: isFixed ? "#e23b3b" : "#3ddc84" }}>
                  {isFixed ? "Fixed string · conventional BMS" : "CELLSCAPE · cell-level control"}
                </span>
                <span className="num text-sm text-text">{(ret * 100).toFixed(1)}% usable</span>
              </div>
              <div className="aspect-[16/8] w-full">
                <CellWall
                  soh={(isFixed ? fixed : cs).years[year].soh}
                  mode={mode}
                  drawn={drawn}
                  nMinFrac={DEFAULTS.nMinFrac}
                />
              </div>
              {isFixed && phase === "done" && (
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-amber/40 bg-[#07090a]/85 px-5 py-3 backdrop-blur">
                  <span aria-hidden className="text-amber">■</span>
                  <span className="num text-sm text-amber">
                    STRINGS LOCKED · {Math.round(strandedKWh)} kWh stranded behind weak cells
                  </span>
                </div>
              )}
              {!isFixed && phase === "done" && (
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-accent/40 bg-[#07090a]/85 px-5 py-3 backdrop-blur">
                  <span aria-hidden className="text-accent">■</span>
                  <span className="num text-sm text-accent">Weak cells bypassed · the strings kept delivering</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <label htmlFor="fleet" className="eyebrow">
              Your fleet size
            </label>
            <span className="num text-2xl">{fleetMWh} MWh</span>
          </div>
          <input id="fleet" type="range" min={5} max={1000} step={5} value={fleetMWh} onChange={(e) => setFleetMWh(+e.target.value)} className="mt-3 w-full" />
          <p className="mt-2 text-xs text-muted">≈ {containers.toFixed(1)} REON CES containers</p>

          <div className="mt-6 flex items-center justify-between">
            <label htmlFor="year" className="eyebrow">
              Years in service
            </label>
            <span className="num text-2xl">Y{year}</span>
          </div>
          <input id="year" type="range" min={0} max={20} value={year} onChange={(e) => setYear(+e.target.value)} className="mt-3 w-full" />

          <div className="mt-6 flex items-center justify-between">
            <label htmlFor="spread" className="eyebrow">
              Fast-aging cells
            </label>
            <span className="num text-sm">{(outlierLive * 100).toFixed(1)}% of cells</span>
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
          <p className="mt-2 text-xs text-muted">
            Default is calibrated so fixed strings lose about 19% of their life, inside Nature Energy 2026&apos;s measured
            17.7–22.8% range.
          </p>

          <button
            onClick={discharge}
            disabled={phase === "running"}
            className="mt-6 w-full rounded-full bg-accent py-3.5 text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-60"
          >
            {phase === "running" ? "Discharging…" : phase === "done" ? "Discharge again" : "Discharge both batteries"}
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="eyebrow">Usable capacity over 20 years</span>
            <span className="flex items-center gap-2 text-xs text-muted">
              <span className="h-0.5 w-4 bg-red" /> Fixed string
            </span>
            <span className="flex items-center gap-2 text-xs text-muted">
              <span className="h-0.5 w-4 bg-accent" /> CELLSCAPE
            </span>
          </div>
          <RetentionChart fixed={fixedRet} cs={csRet} year={year} obligation={DEFAULTS.obligationFrac} />
        </div>
      </div>

      <p className="eyebrow mt-10 mb-4">What REON gives back · your {fleetMWh} MWh fleet</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { k: `+${sim.extraYears.toFixed(1)}`, u: "years", l: "more service before your contract floor is breached", accent: true },
          { k: fmtUsd(sim.capexSavedUsd * containers), u: "", l: "augmentation capex you avoid over 20 years" },
          { k: fmtUsd(sim.npvGainUsd * containers), u: "", l: "added NPV across your fleet (8% discount rate)" },
          {
            k: `${Math.round(sim.tco2Avoided[1] * containers).toLocaleString()}`,
            u: "tCO₂",
            l: `avoided cell manufacturing (range ${Math.round(sim.tco2Avoided[0] * containers).toLocaleString()}–${Math.round(sim.tco2Avoided[2] * containers).toLocaleString()})`,
          },
        ].map((m) => (
          <div key={m.l} className="rounded-2xl border border-line bg-surface p-6">
            <div className={`num text-4xl md:text-5xl ${m.accent ? "text-accent glow" : ""}`}>
              {m.k}
              {m.u && <span className="ml-2 text-base text-muted">{m.u}</span>}
            </div>
            <p className="mt-3 text-sm leading-snug text-muted">{m.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Modeled, not measured. Fixed string life {sim.lifeFixed} yrs vs CELLSCAPE {sim.lifeCellscape} yrs to the {Math.round(DEFAULTS.obligationFrac * 100)}%
        floor. Assumptions and sources are below.
      </p>
    </section>
  );
}
