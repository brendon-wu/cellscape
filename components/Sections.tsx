import { sixteenCellExample } from "@/lib/sim";

export function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 mx-auto flex max-w-7xl bg-bg/90 items-center justify-between px-6 py-5 md:px-10">
      <a href="#" className="flex items-center gap-2.5 text-sm font-medium tracking-[0.18em]">
        <span className="grid grid-cols-2 gap-[2px]">
          {[1, 1, 1, 0].map((g, i) => (
            <span key={i} className={`h-[5px] w-[5px] rounded-[1px] ${g ? "bg-accent" : "bg-red"}`} />
          ))}
        </span>
        CELLSCAPE
      </a>
      <div className="flex items-center gap-6 text-sm text-muted">
        <a href="#problem" className="hidden hover:text-text md:inline">Problem</a>
        <a href="#scale" className="hidden hover:text-text md:inline">Scale</a>
        <a href="#method" className="hidden hover:text-text md:inline">Method</a>
        <a href="#simulator" className="rounded-full border border-line px-4 py-2 text-text hover:border-accent">
          Simulator
        </a>
      </div>
    </nav>
  );
}

export function Problem() {
  const ex = sixteenCellExample();
  const cells = [...Array(15).fill(85), 70];
  return (
    <section id="problem" className="mx-auto max-w-7xl px-6 py-28 md:px-10">
      <div className="grid gap-14 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div>
          <p className="eyebrow mb-4">What a conventional BMS hides · REON&apos;s 16-cell example</p>
          <h2 className="text-4xl font-light leading-[1.05] tracking-[-0.03em] md:text-6xl">
            Your cells average 84%. Your battery delivers 70%.
          </h2>
          <p className="mt-6 max-w-lg text-muted">
            In a series string, the same current runs through every cell, so the weakest one sets the limit for all of
            them. The other fifteen still hold charge, but you can&apos;t use it. Cell-level control can, and CELLSCAPE
            shows you how much that&apos;s worth for your fleet.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 md:p-8">
          <div className="grid grid-cols-8 gap-2">
            {cells.map((q, i) => (
              <div key={i} className="relative aspect-[1/1.6] overflow-hidden rounded-md border border-line bg-[#0b0e10]">
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: `${q}%`,
                    background: q < 80 ? "#e23b3b" : "linear-gradient(to top,#1f7a4a,#3ddc84)",
                    boxShadow: q < 80 ? "0 0 18px rgba(226,59,59,.7)" : "none",
                  }}
                />
                <div className="absolute inset-x-0 border-t border-dashed border-amber" style={{ bottom: "70%" }} />
                <span className="num absolute left-1 top-1 text-[10px] text-text/80">{q}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6">
            <div>
              <div className="num text-5xl text-text">{ex.avgPct.toFixed(2)}%</div>
              <p className="mt-2 text-sm text-muted">Average cell health</p>
            </div>
            <div>
              <div className="num text-5xl text-red">{ex.stringPct.toFixed(0)}%</div>
              <p className="mt-2 text-sm text-muted">What the string can deliver</p>
            </div>
          </div>
          <p className="mt-5 text-xs text-muted">
            Computed live by our engine from the numbers in REON&apos;s challenge brief: 15 cells at 85 Ah and 1 at 70 Ah.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Scale() {
  return (
    <section id="scale" className="relative overflow-hidden border-y border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-28 md:px-10">
        <p className="eyebrow">Why it matters at grid scale</p>
        <div className="mt-10 grid gap-12 md:grid-cols-3">
          <div>
            <div className="num text-6xl font-light md:text-7xl">307 GWh</div>
            <p className="mt-4 text-muted">of battery storage installed worldwide in 2025, about $36B of systems at $117/kWh.</p>
            <p className="eyebrow mt-3 !text-[10px]">BNEF 2025</p>
          </div>
          <div>
            <div className="num text-6xl font-light text-red md:text-7xl">18–23%</div>
            <p className="mt-4 text-muted">
              shorter pack life because of cell-to-cell inconsistency, measured across 133 real vehicles over 3 years.
            </p>
            <p className="eyebrow mt-3 !text-[10px]">Nature Energy 2026, Zhou et al.</p>
          </div>
          <div>
            <div className="num glow text-6xl font-light text-accent md:text-7xl">≈$6–8B</div>
            <p className="mt-4 text-muted">
              of that one year&apos;s installs is lost to weak cells. That value is what cell-level control is built to recover.
            </p>
            <p className="eyebrow mt-3 !text-[10px]">Our estimate: $36B × 17.7–22.8%</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const SOURCES = [
  ["Container", "REON CES, 2.5 MW / up to 5 MWh. Modeled as 14 strings × 416 LFP cells (280 Ah, 3.2 V)", "REON product sheet", "https://www.reoncorp.com/hardware"],
  ["Cell inconsistency", "Pack life shortened 17.7% (cars) and 22.8% (buses)", "Nature Energy 2026, Zhou et al.", "https://www.nature.com/articles/s41560-026-02131-5"],
  ["Market size", "112 GW / 307 GWh of storage added in 2025", "BloombergNEF", "https://about.bnef.com/insights/clean-energy/energy-storage-enters-the-100-gigawatt-era-three-things-to-know/"],
  ["System price", "$117/kWh turnkey; stationary LFP cells $36–74/kWh", "BNEF 2025 surveys", "https://www.ess-news.com/2025/12/09/bnef-lithium-ion-battery-pack-prices-fall-to-108-kwh-stationary-storage-becomes-lowest-price-segment/"],
  ["Augmentation", "Added in whole-string increments at $100/kWh plus $25k per site visit; prices fall 6%/yr", "Vendor guides, Lazard method", "https://howtostoreelectricity.com/battery-augmentation-strategy/"],
  ["Carbon", "61–106 kg CO₂e per kWh of cells manufactured (base case 83)", "IVL Swedish Environmental Research Institute, 2019", "https://www.ivl.se/english/ivl/publications/publications/lithium-ion-vehicle-battery-production.html"],
  ["Bypass limit", "A string keeps running while at least 85% of its cells are active (inverter DC voltage window); 0.3% switch loss", "Our assumption, to confirm with REON", ""],
  ["Aging", "Median cell reaches 80% in about 14 years at 365 cycles/yr; 1.5% of cells age 5% faster, calibrated to Nature Energy", "Our model", ""],
];

export function Difference() {
  const rows = [
    ["REON", "Builds the cell-level bypass hardware, BMS and EMS", "The decision layer that prices what that hardware recovers for a battery's owner"],
    ["Relectrify", "Cell-level control for second-life EV packs", "Focused on new grid batteries with contracted capacity"],
    ["TWAICE", "Analytics that flag weak cells", "Models the bypass and the cost of augmenting against it"],
    ["Typical models", "Pack-level averages", "Simulates all 5,824 cells individually, over 20 years"],
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-10">
      <p className="eyebrow mb-4">How CELLSCAPE is different</p>
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="hidden gap-2 border-b border-line bg-surface px-6 py-3 md:grid md:grid-cols-[180px_1fr_1fr]">
          <span className="eyebrow">Who</span>
          <span className="eyebrow">What they do</span>
          <span className="eyebrow !text-red">What CELLSCAPE adds</span>
        </div>
        {rows.map((r, i) => (
          <div key={r[0]} className={`grid gap-2 px-6 py-5 md:grid-cols-[180px_1fr_1fr] ${i ? "border-t border-line" : ""}`}>
            <span className="font-medium">{r[0]}</span>
            <span className="text-muted">{r[1]}</span>
            <span className="text-accent">
              <span className="eyebrow mr-2 !text-red md:hidden">CELLSCAPE adds</span>
              {r[2]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Method() {
  return (
    <section id="method" className="mx-auto max-w-7xl px-6 pb-28 md:px-10">
      <p className="eyebrow mb-4">Method and assumptions</p>
      <h2 className="max-w-3xl text-3xl font-light tracking-[-0.02em] md:text-4xl">
        Every number above comes from the model and these inputs.
      </h2>
      <div className="mt-10 divide-y divide-line rounded-2xl border border-line">
        {SOURCES.map(([k, v, s, u]) => (
          <div key={k} className="grid gap-1 px-6 py-4 md:grid-cols-[180px_1fr_260px] md:gap-6">
            <span className="text-sm font-medium">{k}</span>
            <span className="text-sm text-muted">{v}</span>
            {u ? (
              <a href={u} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                {s} ↗
              </a>
            ) : (
              <span className="text-sm text-amber">{s}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 py-8 text-sm text-muted md:flex-row md:px-10">
        <span>CELLSCAPE · built for the REON challenge at the MIT Energy &amp; Climate Hack 2026</span>
        <span>Not affiliated with REON. Modeled results, not measurements.</span>
      </div>
    </footer>
  );
}
