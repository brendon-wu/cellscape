# CELLSCAPE: build plan (REON track, MIT Energy & Climate Hack 2026)

## Context
- **Assignment:** the team is on REON's challenge, "Beyond the Weakest Cell." Build a tool on REON's per-cell sensing and bypass. Compare it with a fixed-string baseline. Quantify the economic and environmental value in one real application.
- **Deadline:** deliverables are due **Sun Nov 8, 9:00 AM**.
  - Semifinal: 4–6 Google Slides plus a 2-minute video.
  - Finals: 5-minute live pitch.
- **The user's priority:** a deployed, polished website with cinematic visuals, in the spirit of reoncorp.com's exploding-module hero.
- **Decisions already made:**
  - Name: **CELLSCAPE**
  - Style: **dark cinematic** with REON green as the accent
  - Builder: **Claude builds and deploys the whole site.** The team handles slides, video and number-checking.

## Differentiation (why this isn't a copy)
| Already exists | What they do | What CELLSCAPE does differently |
|---|---|---|
| REON itself | Sells bypass hardware, BMS, EMS. The site gives no quantified stranded-capacity or life-extension numbers. | The **asset-owner decision layer** on top of REON's hardware. It puts the numbers REON's own site doesn't show, in dollars, years and tCO2. |
| Relectrify (Toyota Ventures) | Cell-level control for second-life packs, "no sorting" | Not a second-life pitch. We target new grid batteries with capacity obligations. |
| TWAICE | Analytics that flag cells to replace. Swaps still need downtime or augmentation. | Uses bypass so **selective swaps happen with the system online.** Also schedules which cells participate, to slow weak cells' aging. |
| Academic repowering models (ScienceDirect 2026) | Assume full-bank replacement | Model **selective** cell/module swaps against augmentation and full replacement. |
| Other REON teams (likely) | "Fixed string vs bypass, kWh recovered" | A **15-year asset strategy**, with 4 strategies compared on NPV, years of service and CO2. |

**One-liner:** "One weak cell strands a whole battery. CELLSCAPE turns REON's cell-level control into a 15-year strategy that keeps grid batteries in service longer for less money, by swapping a handful of cells instead of buying new racks."

**Application and stakeholder:** the owner of a grid battery using REON's **CES container (2.5 MW / 5 MWh)**. The contract requires a guaranteed capacity; the default is ≥ 80% of nameplate MWh. The owner's choices today are *augment, replace, or accept less service*, and the brief names those exact options.

## Model (pure TypeScript, no external data pipeline)
- **Container:**
  - 14 strings × 416 LFP cells (280 Ah, 3.2 V) = 5,824 cells, about 5.2 MWh.
  - Every cell is a real simulated object and a rendered instance.
- **Per-cell state:**
  - Starting capacity: Q0 ~ N(280 Ah, σ0).
  - Resistance.
  - Aging-rate multiplier kᵢ (lognormal).
  - Fade: kᵢ·√(equivalent full cycles)·stress(DoD) + calendar term.
  - σ is calibrated so the fixed-string lifetime penalty matches **Nature Energy 2026** (lifetime shortened 17.7–22.8%). A σ slider stays exposed.
- **Four strategies:**
  1. **Fixed string (baseline).** Passive balancing; string capacity = weakest cell. When capacity falls below the obligation, the owner augments, at 60–70% of current capex per kWh with falling prices.
  2. **REON bypass.** Cells leave the string as they empty. The string stops when active cells < N_min. N_min comes from the inverter's minimum DC voltage, so we report delivered **kWh and kW**, as the brief asks. Bypass-switch losses are counted.
  3. **Bypass + wear-leveling.** The weakest cells sit out part of each cycle (shallower depth of discharge), so they age slower.
  4. **Bypass + Pit Stop.** At each yearly maintenance window, swap the worst X% of cells when that beats augmenting on NPV. Cell price is $36–74/kWh plus labor.
- **Outputs, each with a low/base/high sensitivity band:**
  - Year the obligation is breached
  - MWh delivered over 15 years
  - Revenue (arbitrage spread × cycles)
  - Augmentation/replacement capex
  - **NPV**
  - **tCO2 avoided** (cell manufacturing not needed × 61–106 kg CO2e/kWh)
- **Built-in check:** reproduce REON's 16-cell example exactly (string 70% vs average cell 84.06%) as a unit test, and show it on the site.

## Data and assumptions
All of these live in one `lib/assumptions.ts`, each with a source string, and are rendered on a Method page.
- REON CES spec: REON_WHO_WE_ARE.pdf (2.5 MW / up to 5 MWh, 480 V 3-phase).
- Nature Energy 2026 (Zhou et al., DOI 10.1038/s41560-026-02131-5): health loss 6.2% cars / 7.5% buses; lifetime shortened 17.7% / 22.8%.
- BNEF 2025:
  - 307 GWh of storage added in 2025.
  - Turnkey system price $117/kWh.
  - Stationary pack $70/kWh.
  - LFP cell $36–74/kWh.
- Augmentation: Lazard (about 3%/yr reserve); vendor guides (60–70% of capex per kWh).
- Carbon: IVL 2019, 61–106 kg CO2e per kWh of cells.
- **Headline stat:** 307 GWh × $117/kWh ≈ **$36B of batteries installed in 2025 alone**. Cell inconsistency cuts 18–23% off their life, which is **about $6–8B of value lost from one year of installs**. The team checks this arithmetic before it goes on a slide.
- **Questions for the team to ask REON** (Tim Ren / Kayla Chen) at the coffee chat:
  - Inverter minimum DC voltage
  - Whether cells or modules can be physically swapped in the field
  - Bypass-switch loss
  - Typical cell-to-cell σ
  - Who they sell to

These answers replace defaults in `assumptions.ts`.

## Site structure
- **Location:** `C:\Users\brend\Downloads\cellscape\`
- **Stack:** Next.js (App Router, TypeScript), Tailwind, React Three Fiber + drei + postprocessing (bloom), GSAP ScrollTrigger, Recharts, Framer Motion, Geist font. Deploy on Vercel.
- **Brand:**
  - Background near-black #07090A, accent REON green #3DDC84.
  - Cell health runs green → amber → red; numbers in tabular figures.
  - **Credit line:** "Built for the REON challenge, MIT E&C Hack 2026." Our own wordmark, not REON's logo, so it never looks like REON's own site.

**Pages and sections**
1. **Hero** (`app/page.tsx`, `components/hero/ContainerExplode.tsx`)
   - A real-time 3D CES container floats in a dark void.
   - On scroll, it explodes: lid → 14 racks → modules → 5,824 glowing cells (InstancedMesh).
   - Headline: "One weak cell strands a whole battery." CTA: "Enter the simulator."
2. **Problem**
   - The animated 16-cell example: 15 green cells, 1 red.
   - The string gauge drops to 70% while the "average health" gauge reads 84%.
3. **Big stats:** count-up numbers, $36B → $6–8B lost, plus the 18–23% Nature Energy line.
4. **Simulator** (`app/sim/page.tsx`)
   - Two side-by-side cell walls: "Fixed string" vs "CELLSCAPE."
   - Strategy toggles; σ, obligation and price sliders.
   - **Discharge** button: the left wall freezes behind a lock, "STRING LOCKED: X kWh stranded."
   - **15-year scrubber:** a retention chart with the obligation line, an NPV chart, and huge "+N YEARS" / "$X saved" / "Y tCO2" counters.
5. **Pit Stop moment.** At a maintenance year, red cells lift out and fresh cells drop in. A caption compares cost: "Swap 61 cells: $X vs augment 500 kWh: $Y."
6. **Method** (`app/method/page.tsx`): an assumptions table with sources, a sensitivity tornado chart, and the 16-cell validation.

**Key files**
- `lib/sim/cell.ts`, `lib/sim/string.ts`, `lib/sim/strategies.ts`, `lib/sim/economics.ts`, `lib/assumptions.ts`
- `components/three/CellWall.tsx` (shared InstancedMesh, colored by health)
- `components/ui/Counter.tsx`, `components/charts/*`
- `lib/sim/__tests__/sim.test.ts` (Vitest)

## Build steps, in order
1. **Scaffold and deploy early (≈30 min).**
   - Run `create-next-app`, add dependencies, set the dark theme.
   - Push a placeholder to Vercel so the public URL exists from the start.
   - Use the Vercel MCP or `npx vercel`, since the CLI isn't installed globally.
2. **Simulation engine and tests (≈2 h).**
   - Cell/string models, the 4 strategies, economics, and `assumptions.ts`.
   - Vitest: the 16-cell example (70% / 84.06%), the N_min constraint, aging only goes down, bypass ≥ fixed.
3. **3D hero (≈3 h).** Exploded-view container with scroll animation, bloom, and a mobile fallback (pre-rendered poster or lighter scene).
4. **Simulator UI (≈3 h).** Two cell walls, discharge animation, year scrubber, charts, counters.
5. **Pit Stop animation, Method page, problem and stat sections (≈1.5 h).**
6. **Polish (≈1 h).** Motion timing, typography, load performance (Draco or simple geometry; instancing), favicon, Open Graph image.
7. **Production deploy and checks.** Then capture 1080p screen recordings and GIFs for the deck.
8. **Deck and video support.**
   - Write slide copy and the 2-minute script into `cellscape/pitch/`.
   - Optionally generate a matching dark-theme `.pptx` with the pptx skill, which the team imports into Google Slides.

## 2-minute video and slide structure (the user's layout, with timings)
| Time | Slide | Content |
|---|---|---|
| 0:00–0:10 | 1. Title | CELLSCAPE + one-liner over the hero render |
| 0:10–0:20 | 2. Team | Names and roles. Show the split across engineering, economics and design for the "Interdisciplinary" criterion. |
| 0:20–0:50 | 3. Problem | "In a series string, the weakest cell sets the limit." REON's 16-cell visual. |
| 0:50–1:20 | 4. Big stat | **$36B** of batteries installed in 2025 → **$6–8B** of their value lost to weak cells (Nature Energy: 18–23% shorter life) |
| 1:20–1:40 | 5. Product | 4 strategies → one decision. "+N years, $X NPV, Y tCO2 per container." |
| 1:40–2:00 | 6. Live demo | Screen recording: hero explode (4s) → discharge race and STRING LOCKED (8s) → 15-year scrub and Pit Stop swap (6s) → URL end card (2s) |

Slide 6 also holds an embedded GIF, a QR code and the URL, so judges who only skim the deck still see the demo. That keeps the deck at 6 slides, inside the 4–6 limit.

## Verification
- `npm test`: all simulation tests pass, including the exact 16-cell numbers.
- `npm run build` has no errors. Run the dev server through the Browser pane preview and check:
  - Console free of errors
  - Hero scroll explode is smooth (aim for 60 fps on a laptop)
  - Simulator controls change the counters
  - Mobile width (375 px) loads the fallback without horizontal scroll
- Check the deployed Vercel URL in the Browser pane, desktop and mobile.
- Sanity-check the headline numbers by hand against `assumptions.ts`. The team confirms they agree with the slide figures before submission.
