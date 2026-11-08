// CELLSCAPE simulation engine: fixed series strings vs REON-style cell-level control.
// All energy in kWh, money in USD. Deterministic by seed.

export type StrategyId = "fixed" | "bypass" | "wearLevel" | "pitStop";

export interface SimParams {
  strings: number;
  cellsPerString: number;
  cellAh: number;
  cellV: number;
  sigmaQ0Frac: number; // manufacturing capacity spread
  sigmaAging: number; // lognormal spread of per-cell aging rate (bulk population)
  outlierFrac: number; // share of fast-aging cells (Nature Energy 2026: "a few faster-ageing cells")
  outlierK: number; // aging-rate multiplier of those cells
  obligationFrac: number; // contracted capacity floor (fraction of nameplate)
  years: number;
  cyclesPerYear: number;
  nMinFrac: number; // min active cells per string, set by inverter DC voltage window
  bypassLossFrac: number;
  spreadUsdPerMWh: number;
  discountRate: number;
  cellPriceUsdPerKWh: number;
  augPriceUsdPerKWh: number;
  augMobilizationUsd: number;
  priceDeclinePerYr: number;
  swapLaborUsdPerCell: number;
  kgCo2PerKWh: [number, number, number];
  seed: number;
}

export const DEFAULTS: SimParams = {
  strings: 14,
  cellsPerString: 416,
  cellAh: 280,
  cellV: 3.2,
  sigmaQ0Frac: 0.005,
  sigmaAging: 0.02,
  outlierFrac: 0.015,
  outlierK: 1.05, // calibrated: fixed-string life ~20% shorter than average cell (Nature Energy 2026: 17.7–22.8%)
  obligationFrac: 0.8,
  years: 20,
  cyclesPerYear: 365,
  nMinFrac: 0.85,
  bypassLossFrac: 0.003,
  spreadUsdPerMWh: 60,
  discountRate: 0.08,
  cellPriceUsdPerKWh: 55,
  augPriceUsdPerKWh: 100,
  augMobilizationUsd: 25000,
  priceDeclinePerYr: 0.06,
  swapLaborUsdPerCell: 15,
  kgCo2PerKWh: [61, 83, 106],
  seed: 7,
};

// Fade model: Q = Q0 * (1 - k * (A*sqrt(EFC) + B*sqrt(age))). Median cell hits 80% at ~14 yrs @ 365 EFC/yr.
const A_CYC = 0.001958;
const B_CAL = 0.016;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng: () => number) {
  const u = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Energy (in Ah·cells units) a fixed series string can deliver: limited by its weakest cell. */
export function fixedStringAhCells(q: ArrayLike<number>) {
  let min = Infinity;
  for (let i = 0; i < q.length; i++) min = Math.min(min, q[i]);
  return min * q.length;
}

/** Energy (Ah·cells) with selective bypass: cells exit as they empty until active < nMin. */
export function bypassStringAhCells(q: ArrayLike<number>, nMin: number) {
  const s = Float64Array.from(q).sort(); // typed-array sort is numeric and far faster than Array#sort with a comparator
  const n = s.length;
  let e = 0;
  let prev = 0;
  for (let k = 1; k <= n - nMin + 1; k++) {
    e += (s[k - 1] - prev) * (n - k + 1);
    prev = s[k - 1];
  }
  return e;
}

/** REON's 16-cell example from the challenge brief. */
export function sixteenCellExample() {
  const q = [...Array(15).fill(85), 70];
  return {
    stringPct: fixedStringAhCells(q) / (16 * 100) * 100,
    avgPct: q.reduce((a, b) => a + b, 0) / 16,
  };
}

export interface YearResult {
  year: number;
  retention: number; // delivered energy / nameplate, original strings only
  deliveredMWh: number;
  capexUsd: number;
  swappedCells: number;
  augmentedKWh: number;
  cumNpvUsd: number;
  soh: Float32Array;
  swapped: Uint8Array;
}
export interface StrategyResult {
  id: StrategyId;
  years: YearResult[];
  breachYear: number | null; // first year below obligation with no remedy available in that strategy
  npvUsd: number;
  newCellKWh: number;
  totalCapexUsd: number;
}
export interface Comparison {
  results: Partial<Record<StrategyId, StrategyResult>> & Record<"fixed" | "wearLevel", StrategyResult>;
  extraYears: number;
  npvGainUsd: number;
  capexSavedUsd: number;
  tco2Avoided: [number, number, number];
  lifeFixed: number;
  lifeCellscape: number;
  nameplateKWh: number;
}

interface CellPop {
  q0: Float64Array;
  k: Float64Array;
}
function makeCells(p: SimParams): CellPop {
  const n = p.strings * p.cellsPerString;
  const rng = mulberry32(p.seed);
  const q0 = new Float64Array(n);
  const k = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    q0[i] = p.cellAh * (1 + p.sigmaQ0Frac * gauss(rng));
    const out = rng() < p.outlierFrac ? p.outlierK * (1 + 0.03 * gauss(rng)) : 1;
    k[i] = Math.exp(p.sigmaAging * gauss(rng)) * out;
  }
  return { q0, k };
}

function runStrategy(p: SimParams, pop: CellPop, id: StrategyId): StrategyResult {
  const n = p.strings * p.cellsPerString;
  const cps = p.cellsPerString;
  const nMin = Math.ceil(p.nMinFrac * cps);
  const kWhPerCell = (p.cellAh * p.cellV) / 1000;
  const nameplateKWh = n * kWhPerCell;
  const useBypass = id !== "fixed";
  const wear = id === "wearLevel" || id === "pitStop";
  const pit = id === "pitStop";

  const q0 = Float64Array.from(pop.q0);
  const k = Float64Array.from(pop.k);
  const efc = new Float64Array(n);
  const age = new Float64Array(n);
  const swappedEver = new Uint8Array(n);
  const q = new Float64Array(n);
  const part = new Float64Array(n).fill(1);

  // Augmented capacity (added strings): tracked as cohorts that age at the median rate.
  const cohorts: { kWh: number; age: number }[] = [];
  const cohortFade = (a: number) => 1 - (A_CYC * Math.sqrt(p.cyclesPerYear * a) + B_CAL * Math.sqrt(a));

  const capOf = (i: number) =>
    Math.max(0, q0[i] * (1 - k[i] * (A_CYC * Math.sqrt(efc[i]) + B_CAL * Math.sqrt(age[i]))));
  const refresh = () => {
    for (let i = 0; i < n; i++) q[i] = capOf(i);
  };
  const originalKWh = () => {
    let ahCells = 0;
    for (let s = 0; s < p.strings; s++) {
      const sl = q.subarray(s * cps, (s + 1) * cps);
      ahCells += useBypass ? bypassStringAhCells(sl, nMin) * (1 - p.bypassLossFrac) : fixedStringAhCells(sl);
    }
    return (ahCells * p.cellV) / 1000;
  };
  const cohortKWh = () => cohorts.reduce((t, c) => t + c.kWh * cohortFade(c.age), 0);

  const years: YearResult[] = [];
  let cumNpv = 0;
  let breachYear: number | null = null;
  let newCellKWh = 0;
  let totalCapex = 0;
  const target = p.obligationFrac + 0.01;
  const stringKWh = cps * kWhPerCell;

  for (let y = 0; y <= p.years; y++) {
    refresh();
    let capex = 0;
    let swappedCells = 0;
    let augmentedKWh = 0;
    const priceF = Math.pow(1 - p.priceDeclinePerYr, y);
    let total = originalKWh() + cohortKWh();

    if (y > 0 && total / nameplateKWh < p.obligationFrac) {
      if (breachYear === null) breachYear = y;
      // Remedy back to target.
      if (pit) {
        // Swap globally weakest cells (bypass keeps the system online) until target met.
        const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => q[a] - q[b]);
        let idx = 0;
        const batch = Math.ceil(n * 0.005);
        while (total / nameplateKWh < target && idx < n * 0.5) {
          for (let j = 0; j < batch && idx < n; j++, idx++) {
            const c = order[idx];
            q0[c] = p.cellAh;
            k[c] = 1;
            efc[c] = 0;
            age[c] = 0;
            swappedEver[c] = 1;
            swappedCells++;
          }
          refresh();
          total = originalKWh() + cohortKWh();
        }
        const kWh = swappedCells * kWhPerCell;
        capex = kWh * p.cellPriceUsdPerKWh * priceF + swappedCells * p.swapLaborUsdPerCell;
        newCellKWh += kWh;
      } else {
        // Augment in whole-string increments (new racks), with a mobilization cost per event.
        const deficit = target * nameplateKWh - total;
        const nStrings = Math.max(1, Math.ceil(deficit / stringKWh));
        augmentedKWh = nStrings * stringKWh;
        cohorts.push({ kWh: augmentedKWh, age: 0 });
        capex = augmentedKWh * p.augPriceUsdPerKWh * priceF + p.augMobilizationUsd;
        newCellKWh += augmentedKWh;
        total = originalKWh() + cohortKWh();
      }
    }

    const deliverable = Math.min(total, nameplateKWh); // sell up to nameplate
    const deliveredMWh = (deliverable * p.cyclesPerYear) / 1000;
    const revenue = y === 0 ? 0 : deliveredMWh * p.spreadUsdPerMWh;
    cumNpv += (revenue - capex) / Math.pow(1 + p.discountRate, y);
    totalCapex += capex;

    const soh = new Float32Array(n);
    for (let i = 0; i < n; i++) soh[i] = q[i] / p.cellAh;
    years.push({
      year: y,
      retention: originalKWh() / nameplateKWh,
      deliveredMWh: y === 0 ? 0 : deliveredMWh,
      capexUsd: capex,
      swappedCells,
      augmentedKWh,
      cumNpvUsd: cumNpv,
      soh,
      swapped: Uint8Array.from(swappedEver),
    });

    // Age one year. Wear-leveling: weak cells sit out part of each cycle.
    if (wear) {
      for (let s = 0; s < p.strings; s++) {
        const sl = q.slice(s * cps, (s + 1) * cps).sort();
        const med = sl[cps >> 1];
        for (let i = s * cps; i < (s + 1) * cps; i++) part[i] = Math.min(1, Math.max(0.6, q[i] / med));
      }
    }
    for (let i = 0; i < n; i++) {
      efc[i] += p.cyclesPerYear * part[i];
      age[i] += 1;
    }
    for (const c of cohorts) c.age += 1;
  }

  return { id, years, breachYear, npvUsd: cumNpv, newCellKWh, totalCapexUsd: totalCapex };
}

/** Year at which retention first drops below the obligation if nothing is done (quarter-year resolution). */
function unremediedBreach(p: SimParams, pop: CellPop, bypass: boolean, maxYears = 30) {
  const n = p.strings * p.cellsPerString;
  const cps = p.cellsPerString;
  const nMin = Math.ceil(p.nMinFrac * cps);
  const q = new Float64Array(n);
  const below = (t: number) => {
    const fade = A_CYC * Math.sqrt(p.cyclesPerYear * t) + B_CAL * Math.sqrt(t);
    for (let i = 0; i < n; i++) q[i] = pop.q0[i] * (1 - pop.k[i] * fade);
    let ah = 0;
    for (let s = 0; s < p.strings; s++) {
      const sl = q.subarray(s * cps, (s + 1) * cps);
      ah += bypass ? bypassStringAhCells(sl, nMin) * (1 - p.bypassLossFrac) : fixedStringAhCells(sl);
    }
    return ah / (n * p.cellAh) < p.obligationFrac;
  };
  // Retention only falls with time, so binary-search the first quarter-year step that is below the floor.
  let lo = 1, hi = Math.round(maxYears * 4);
  if (!below(hi / 4)) return maxYears;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (below(mid / 4)) hi = mid;
    else lo = mid + 1;
  }
  return lo / 4;
}

/** Year at which the average cell falls below the obligation. */
export function averageCellBreach(p: SimParams) {
  const pop = makeCells(p);
  const n = pop.q0.length;
  for (let t = 0.25; t <= 30; t += 0.25) {
    let s = 0;
    for (let i = 0; i < n; i++)
      s += pop.q0[i] * (1 - pop.k[i] * (A_CYC * Math.sqrt(p.cyclesPerYear * t) + B_CAL * Math.sqrt(t)));
    if (s / (n * p.cellAh) < p.obligationFrac) return t;
  }
  return 30;
}

export function lifetimes(p: SimParams = DEFAULTS) {
  const pop = makeCells(p);
  return {
    fixed: unremediedBreach(p, pop, false),
    bypass: unremediedBreach(p, pop, true),
    average: averageCellBreach(p),
  };
}

export function runSimulation(p: SimParams = DEFAULTS, extra: StrategyId[] = []): Comparison {
  const pop = makeCells(p);
  // The UI compares fixed strings with wear-leveling; other strategies run only when asked for.
  const ids = [...new Set<StrategyId>(["fixed", "wearLevel", ...extra])];
  const results = Object.fromEntries(ids.map((id) => [id, runStrategy(p, pop, id)])) as Comparison["results"];
  const lt = { fixed: unremediedBreach(p, pop, false), bypass: unremediedBreach(p, pop, true) };
  const best = results.wearLevel;
  const nameplateKWh = (p.strings * p.cellsPerString * p.cellAh * p.cellV) / 1000;
  // Life extension avoids manufacturing that share of a replacement system's cells.
  const avoidedKWh = nameplateKWh * Math.max(0, lt.bypass - lt.fixed) / lt.fixed;
  return {
    results,
    extraYears: lt.bypass - lt.fixed,
    npvGainUsd: best.npvUsd - results.fixed.npvUsd,
    capexSavedUsd: results.fixed.totalCapexUsd - best.totalCapexUsd,
    tco2Avoided: p.kgCo2PerKWh.map((f) => (avoidedKWh * f) / 1000) as [number, number, number],
    lifeFixed: lt.fixed,
    lifeCellscape: lt.bypass,
    nameplateKWh,
  };
}
