# CELLSCAPE handoff: execute this document top to bottom

**Who this is for:** a Claude Code session running Sonnet 5.5 at medium effort. The working directory is `C:\Users\brend\Downloads\cellscape`.

**Your job:** ship a deployed, visually striking website for the team's REON challenge entry. The order is:
1. Mockup in Claude Design.
2. Critic loop until the mockup scores 8/10 or better.
3. Parallel build with subagents.
4. Deploy and verify.
5. Write the pitch copy.

The decisions below are final. Don't re-research or re-debate them. Build.

**Hard deadline:** the team submits Sunday Nov 8 at 9:00 AM ET. The site must be live and recorded by about **6:00 AM**, so the team has time to make the video. If you are behind, cut scope in this order: Method-page tornado chart → Pit Stop animation polish → mobile 3D, replaced by a poster image. **Never cut** the hero, the discharge race or the 15-year counters.

---

## 0. Context (read once)

- **Hackathon:** MIT Energy & Climate Hack 2026, REON track, "Beyond the Weakest Cell: Making Every Cell Count."
  - Briefs: `docs/briefs/reon-challenge-brief.txt`, `docs/briefs/reon-who-we-are.txt`, `docs/briefs/hackathon-overview.txt`.
  - Full plan: `docs/PLAN.md`.
- **REON's ask:** a tool built on per-cell sensing plus selective bypass. It must compare against a clear fixed-string baseline and quantify economic and environmental value in one real application.
- **Product:** CELLSCAPE, the asset-owner decision layer on top of REON's cell-level control, for a grid battery in REON's **CES container (2.5 MW / 5 MWh)** with a capacity obligation of ≥ 80% of nameplate.
  - It compares 4 strategies over 15 years: Fixed string, REON bypass, Bypass + wear-leveling, Bypass + **Pit Stop** (swap only the worst cells while the system stays online).
  - Outputs: +years of service, NPV ($), tCO2 avoided.
- **Differentiation** (keep this framing; never claim novelty for bypass itself):
  - Relectrify sells cell-level control for second-life packs.
  - TWAICE flags weak cells, but swaps still need downtime.
  - Published repowering models assume the whole bank is replaced.
  - CELLSCAPE is the **decision layer**, and **selective online swaps** are the new part.
- **Brand:** dark cinematic. **Our own wordmark, never REON's logo.**
  - Footer credit: "Built for the REON challenge · MIT Energy & Climate Hack 2026."
  - The site must not look like it *is* REON's website.
- **Visual reference:** REON's homepage, screenshots in `docs/reference/` (reoncorp.com).
  - It has a pre-rendered video of a battery module that explodes apart as you scroll, a GSAP ScrollTrigger hex-grid motif, and the Neue Montreal font.
  - Our version uses **real-time 3D** (React Three Fiber), not video.
- **Already done:**
  - A Next.js 15.5.4 scaffold here (React 19.1, Tailwind v4, TypeScript, App Router, Turbopack).
  - The `creative-web-worlds` skill copied into `.claude/skills/`.
  - Briefs and references copied into `docs/`.
  - Nothing else is built. No git repo yet.

### Design tokens (starting point; the mockup may refine them)
- Background `#07090A`, raised surface `#0E1214`, hairline `#1C2326`
- Text `#E8ECEA`, muted `#8A9592`
- Accent (REON green) `#3DDC84`, glow `#3DDC84` at 35% opacity
- Cell health ramp: `#3DDC84` (≥ 90%) → `#C8E35A` → `#F5B83D` → `#F2683C` → `#E23B3B` (≤ 70%), bypassed cells `#2A3134`
- Fonts: **Geist** for UI and display, **Geist Mono** for numbers (tabular figures)
- Motion: ease `cubic-bezier(0.22, 1, 0.36, 1)`. Count-ups take 1.2 s. Nothing loops forever except a subtle cell shimmer.

---

## Phase 1: Mockup in Claude Design (timebox 75 min)

1. **Load the skill:** invoke `creative-web-worlds` with the Skill tool. It may be listed as `cellscape:creative-web-worlds`. If neither name appears, read `.claude/skills/creative-web-worlds/SKILL.md` directly. Then read these references from `.claude/skills/creative-web-worlds/references/`:
   - `visual-grammars.md`
   - `motion-and-mobile.md`
   - `real-3d-recipe.md`
   - `craft-review.md`
   - `source-atlas.md`

   Follow the skill's process: a concrete composition with real content, real type and a real centerpiece. No placeholder lorem.
2. **Create the design with Claude Design** (the Artifact tool's Design type):
   - Call `Artifact` with `action: "quickstart"`, `intent: "design"`, `design_systems: false`. The tokens above are the design system.
   - Publish from the returned Design `type_url` with title "Cellscape mockup". Follow the instructions in that result for how to fill it.
   - Fallback: if no Design type is listed, author `design/mockup.html` as one self-contained page and publish it as a normal Artifact. Load the `artifact-design` skill first.
3. **Frames to design.** Use real copy and real numbers; placeholders like "$1.2M" are fine until the simulation lands.
   - **D1 Hero, desktop 1440×900, two states:**
     - (a) Intact: a CES container floating in a dark void with a soft rim light. Headline **"One weak cell strands a whole battery."** Subline: the one-liner. CTA "Run the simulator."
     - (b) Mid-explode: lid lifted, 14 racks fanned out, cells visible and glowing.
   - **D2 Problem:** REON's 16-cell example. 15 green cells and 1 red. Gauge A reads "String capacity 70%." Gauge B reads "Average cell health 84.06%."
   - **D3 Big stat:**
     - **$36B** of batteries installed worldwide in 2025.
     - Then **$6–8B** of that value lost to weak cells (Nature Energy 2026: 18–23% shorter pack life).
     - Each number carries a source chip.
   - **D4 Simulator:**
     - Two cell walls side by side, "Fixed string" and "CELLSCAPE."
     - Left wall locked: "STRING LOCKED · 412 kWh stranded."
     - Strategy toggles; σ, obligation and price sliders.
     - A 15-year scrubber, a retention chart with the obligation line, and huge counters: "+N YEARS · $X NPV · Y tCO2."
   - **D5 Pit Stop moment:** red cells lifting out and fresh cells dropping in. Comparison card: "Swap 61 cells · $4.1k" vs "Augment 500 kWh · $41k."
   - **D6 Method:** assumptions table with sources, plus a small sensitivity chart.
   - **M1 / M4, mobile 390×844:** the hero and the simulator re-composed for mobile (stacked walls, sticky counters), not shrunk.
4. **Storyboard the motion.** Add a short note next to the frames for each scroll and animation sequence, using the skill's format:

   intent → trigger → changing subject → endpoint → reversal → mobile/reduced-motion variant.
5. **Capture evidence:**
   - Open the published design in the Browser pane (`mcp__Claude_Browser__navigate`).
   - Screenshot each frame at real size with `computer` → `screenshot`.
   - Each screenshot result prints a `source:` file path. Copy that file to `design/captures/round-<N>/<frame>.jpg`. These files are what the critic sees.

## Phase 2: Critic loop until ≥ 8/10 (timebox 90 min total, max 4 rounds)

Each round, spawn a **brand-new** critic: `Agent` with `subagent_type: "general-purpose"`. Never resume a previous critic, never fork, and never tell it earlier scores or your intent. This follows the skill's `forward-testing.md` protocol: fresh context, no priming.

**Critic prompt template** (fill in the round number and paths):

> You are an exacting art director who judges award-level product and launch websites (Awwwards / FWA level, Linear, Vercel, Apple product pages, Stripe Sessions, Rivian). Judge a mockup for CELLSCAPE, a hackathon demo site for REON, a cell-level battery-control company. It will appear in a 2-minute pitch video, and judges will open it live.
>
> Brief: dark cinematic look. The hero is a real-time 3D battery container that explodes into thousands of glowing cells on scroll. The story is "one weak cell strands a whole battery." It has a simulator comparing a fixed string vs cell-level control over 15 years. Intended palette: near-black background with REON green #3DDC84 accent, Geist typography.
>
> Look at these rendered captures with the Read tool: <list every file in design/captures/round-N/>. The source is at <design source path or artifact URL>. Read `.claude/skills/creative-web-worlds/references/craft-review.md` and use it as your lens.
>
> Score each 1–10, citing the specific frame and location for every point:
> (1) 3-second clarity for an outsider, (2) hierarchy, (3) typography craft, (4) color, material and light, (5) 3D centerpiece quality, (6) layout and spacing rhythm, (7) motion storyboard, (8) data-viz polish, (9) mobile composition, (10) credibility (no fake claims, sources visible), (11) how well it reads in a screen-recorded video.
>
> Then give an OVERALL score out of 10. This is your judgment, not an average.
>
> List the 5 highest-impact fixes, each with frame and location → problem → consequence → concrete change. Separate direct observation from inference. Name 1–2 real reference sites that do the weakest dimension well, and say exactly what relationship to borrow. About 600 words.

**After each round:**
- Append the scores and top fixes to `design/review-log.md`.
- Apply the top fixes.
- Re-capture into `round-<N+1>`.
- Spawn the next fresh critic.

**Stop rules:**
- Stop when OVERALL ≥ 8, **or** after 4 rounds.
- If you are still below 8 after 4 rounds, keep the best-scoring round. Write the remaining gap in `review-log.md` and tell the user in one line. Then build anyway. **Do not block the build past the timebox.**
- Don't let critique balloon scope. Reject any fix that adds a new page or feature; take fixes that sharpen what's already there.

**Exit artifact:** add the final tokens, spacing scale and component list to `design/DESIGN.md`. The build follows that file.

---

## Phase 3: Build (timebox 6.5 h)

### 3.0 Setup on the main thread, before spawning anyone (≈30 min)
1. Ask the user once: "OK to `git init` and make local commits at each phase?" (recommended, for rollback). Never push or force anything.
2. **Install all dependencies now, in one go.** Subagents must never run `npm install`.
   ```
   npm i three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing gsap @gsap/react motion recharts geist clsx
   npm i -D vitest @types/three
   ```
   - Fix peer-dependency warnings: R3F 9.x and drei 10.x match React 19.
   - Add `"test": "vitest run"` to `package.json`.
3. Put the DESIGN.md tokens into `app/globals.css` (Tailwind v4 `@theme`). Load the Geist fonts in `app/layout.tsx`.
4. **Write the shared contract `lib/sim/types.ts` exactly** (agents build against it):
   ```ts
   export type StrategyId = 'fixed' | 'bypass' | 'wearLevel' | 'pitStop';
   export interface SimParams {
     strings: number; cellsPerString: number; cellAh: number; cellV: number;   // 14, 416, 280, 3.2
     sigmaQ0Frac: number; sigmaAging: number;      // 0.01, calibrated (see sim spec)
     obligationFrac: number;                        // 0.80
     years: number; cyclesPerYear: number;          // 15, 365
     nMinFrac: number;                              // 0.85 -> min active cells per string (inverter DC window)
     bypassLossFrac: number;                        // 0.003
     spreadUsdPerMWh: number; discountRate: number; // 60, 0.08
     cellPriceUsdPerKWh: number; augPriceUsdPerKWh: number; priceDeclinePerYr: number; // 55, 117*0.65, 0.06
     swapLaborUsdPerCell: number;                   // 15
     kgCo2PerKWhCell: number;                       // 83 (base), band 61–106
     seed: number;
   }
   export interface CellSnapshot { soh: Float32Array; active: Uint8Array; swapped: Uint8Array } // length strings*cellsPerString
   export interface YearResult {
     year: number; retention: number; deliveredMWh: number; powerFrac: number;
     augmentedKWh: number; swappedCells: number; capexUsd: number; revenueUsd: number; cumNpvUsd: number;
     snapshot: CellSnapshot;
   }
   export interface StrategyResult { id: StrategyId; years: YearResult[]; breachYear: number | null; npvUsd: number; newCellKWh: number }
   export interface Comparison { results: Record<StrategyId, StrategyResult>; extraYears: number; npvGainUsd: number; tco2Avoided: [low: number, base: number, high: number] }
   export declare function runSimulation(p: SimParams): Comparison;
   export declare function dischargeFrames(p: SimParams, snap: CellSnapshot, strategy: StrategyId, frames: number): { active: Uint8Array[]; soc: Float32Array[]; deliveredKWh: number; strandedKWh: number };
   export declare function sixteenCellExample(): { stringPct: number; avgPct: number }; // must be 70 and 84.0625
   ```
   Also write `lib/sim/index.ts`, which re-exports stubs returning plausible fake data. That way the UI agents can render immediately; the sim agent replaces the stubs.
5. Deploy a placeholder page to Vercel right away so the URL exists. Use the `vercel:deploy` skill (preview). If auth fails, ask the user to run `npx vercel login` in their terminal, then retry.

### 3.1 Spawn 3 subagents in ONE message (they run in parallel, in the same folder)
Each owns separate files. Tell each one: "Only create or edit files you own. Don't run `npm install`, `npm run build` or `npm run dev`. You may run `npx vitest run` and `npx tsc --noEmit`. Report what you built and any contract issue; don't change `lib/sim/types.ts`."

**Agent A: simulation engine** (`general-purpose`). Owns `lib/sim/**` except `types.ts`, plus `lib/assumptions.ts`. Spec to pass verbatim:

- **Cells:**
  - n = strings × cellsPerString.
  - Q0ᵢ ~ N(cellAh, sigmaQ0Frac·cellAh).
  - Aging multiplier kᵢ = exp(N(0, sigmaAging)).
  - Use a seeded PRNG (mulberry32) so results are deterministic.
- **Fade:** SOHᵢ = 1 − kᵢ·(A·√EFCᵢ + B·√t_years).
  - Calibrate A and B so the median cell reaches 80% SOH in about 14 years at 365 equivalent full cycles per year (typical LFP).
  - EFCᵢ grows by cyclesPerYear × participationᵢ each year.
- **Fixed string energy** = Σ_strings cellsPerString · cellV · min(Qᵢ). This is the weakest-cell limit.
- **Bypass string energy:** sort the string's capacities ascending, q₁ ≤ … ≤ qₙ, with N_min = ceil(nMinFrac·n).
  - E = cellV · Σ_{k=1}^{n−N_min+1} (q_k − q_{k−1})·(n−k+1), with q₀ = 0.
  - Then multiply by (1 − bypassLossFrac).
  - powerFrac = active/n at the end of discharge.
  - Unit-test it: E_bypass ≥ E_fixed always, and E_bypass = E_fixed when every cell is identical.
- **Wear-leveling:** participationᵢ = clamp(Qᵢ / median(Q_string), 0.6, 1). Weak cells cycle less, so their aging slows.
- **Pit Stop:** each year, if next year's retention would fall below obligationFrac + 0.02:
  - Choose the cheaper of two fixes that restore retention ≥ obligation for the next year:
    - (a) swap the worst m cells for fresh ones (SOH 1, EFC 0), costing m·cellV·cellAh/1000·cellPrice(t) + m·labor;
    - (b) augmentation.
  - Mark the swapped cells in `snapshot.swapped`.
  - Fixed and bypass-only strategies can only augment, at augPrice(t). Augmented capacity ages at the median rate.
  - Price(t) = price₀·(1 − priceDecline)^t.
- **Economics:**
  - Revenue = deliveredMWh/yr × spread.
  - Capex is discounted at discountRate. NPV is computed per strategy.
  - npvGainUsd = NPV(pitStop) − NPV(fixed).
  - extraYears = breach year of bypass without remedy − breach year of fixed without remedy.
  - tco2Avoided = (newCellKWh_fixed − newCellKWh_pitStop) × [61, 83, 106] / 1000.
- **Calibrate sigmaAging** so the fixed string's unremedied breach year is 17.7–22.8% earlier than the average cell's. This is the Nature Energy 2026 lifetime-shortening range. Put the result as the default in `assumptions.ts`, with a comment.
- **`assumptions.ts`:** export `DEFAULTS: SimParams`, plus a `SOURCES` array of `{key, value, label, source, url}` objects, using the sources listed in §6.
- **`dischargeFrames`:** per frame, which cells are active and their state of charge, for the animation.
- **`sixteenCellExample`:** 15 cells × 85 Ah plus 1 × 70 Ah → string 70%, average 84.0625%.
- **Tests (`lib/sim/__tests__/sim.test.ts`):**
  - the 16-cell numbers exactly
  - bypass ≥ fixed
  - identical cells → equal
  - SOH never increases without a swap
  - determinism by seed
  - fixed lifetime shortening lands in [17.7%, 22.8%]
  - `runSimulation` with defaults takes < 300 ms
- **Report:** the headline outputs with defaults (extraYears, npvGainUsd, tco2Avoided), in a table.

**Agent B: 3D** (`general-purpose`). Owns `components/three/**` and `components/hero/**`. Tell it to read `.claude/skills/creative-web-worlds/references/real-3d-recipe.md` and `motion-and-mobile.md`, plus `design/DESIGN.md` and the final-round captures. Build:
- **`CellWall.tsx`:**
  - One `InstancedMesh` of rounded-box cells (5,824 instances, 14 × 416 arranged in racks).
  - Props: `{ soh: Float32Array; active: Uint8Array; swapped?: Uint8Array; locked?: boolean; layout: 'wall' | 'racks' }`.
  - Set color per instance from the health ramp. Bypassed cells are dim. Swapped cells get a brief rise-and-drop animation.
  - When `locked`, overlay a frosted lock plane plus a visible "trapped charge" glow.
  - Use `frameloop="demand"` with `invalidate()` during transitions. Cap DPR at 1.75.
- **`ContainerExplode.tsx`:** the hero scene.
  - An authored container (shell, doors, vent detail and edge bevels, built from geometry; no external model needed).
  - Scroll-linked with GSAP ScrollTrigger and `useGSAP` cleanup: intact → lid lifts → racks fan out → modules → cell field.
  - Bloom through postprocessing, kept subtle. Fixed camera constants for desktop and mobile.
  - Reduced motion jumps straight to the end state.
  - If WebGL fails, fall back to a static poster (`public/hero-poster.jpg`; render one from the scene).
- Use the stub data from `lib/sim` for now. Export clean components with no page wiring.

**Agent C: pitch materials** (`general-purpose`). Owns `pitch/**`. Have it read `docs/PLAN.md` §"2-minute video and slide structure", plus the REON briefs. Write:
- **`pitch/slides.md`:** final copy for 6 slides.
  1. Title + one-liner
  2. Team
  3. Problem
  4. Big stat
  5. Product
  6. Live demo + QR code + URL

  For each slide, include a layout note matching the dark design tokens.
- **`pitch/video-script.md`:** 2:00 total, with the user's timings:
  - Slides 1 + 2: about 20 s
  - Slides 3 + 4: about 60 s
  - Slide 5: 20 s
  - Site screen recording: 40 s, shot list = hero explode → discharge race and STRING LOCKED → 15-year scrub and Pit Stop → URL end card
  - Spoken words must fit about 150 words per minute.
- **`pitch/judge-qa.md`:** the 8 hardest questions REON's CTO might ask, with crisp answers. Topics include:
  - Can cells be physically swapped online?
  - Why does N_min come from the inverter?
  - How was σ calibrated?
  - How is this different from Relectrify and TWAICE?
- **`pitch/coffee-chat-questions.md`:** questions the team can still ask REON (Tim Ren, Kayla Chen): inverter minimum DC voltage, swap feasibility, bypass loss, typical σ, target customer.
- Leave numbers as `{{EXTRA_YEARS}}`, `{{NPV_GAIN}}`, `{{TCO2}}` and so on. The main thread fills them in later.

### 3.2 Main thread while agents run: everything else
Build these with the approved mockup tokens:
- `app/page.tsx`: hero slot → problem (16-cell, uses `sixteenCellExample()`) → big stat (count-ups) → simulator teaser → footer.
- `app/sim/page.tsx`: two `CellWall`s, controls, discharge button, year scrubber.
- `components/charts/*`: Recharts retention and NPV charts.
- `components/ui/Counter.tsx` and the nav.
- `app/method/page.tsx` (rendered from `SOURCES`).
- Open Graph image and favicon.

Every slider and toggle calls `runSimulation` through `useMemo`. Keep frame-rate work in refs, not React state (per `real-3d-recipe.md`).

### 3.3 Integrate (when all agents report back)
- Replace the stubs, wire `CellWall` and `ContainerExplode` into the pages, and fill the `{{…}}` placeholders in `pitch/`.
- Run `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`. Fix everything.

### 3.4 Live-site critic (max 2 rounds)
- Run `npm run dev` via the Browser pane preview. Create `.claude/launch.json` with `npm run dev`, port 3000, then call `preview_start`.
- Capture at desktop 1440 and mobile 375:
  - hero at scroll 0%, 40% and 100%
  - problem
  - stats
  - simulator before discharge, after discharge, at year 15 and at the Pit Stop moment
- Spawn a **fresh** critic with the Phase 2 template plus: "This is the built site; also flag jank, layout shifts, overlapping text, unreadable small type, console errors" (paste the console errors into its prompt).
- Fix the top issues. Stop at ≥ 8 or after 2 rounds.

## Phase 4: Deploy and verify (≈45 min)
1. Run the `vercel:deploy` skill with argument `prod`. Record the URL in `README.md` and `pitch/slides.md`.
2. Open the production URL in the Browser pane and verify on desktop and mobile (`resize_window` presets; reset to desktop afterward):
   - hero scroll is smooth with no console errors
   - discharge works
   - scrubber changes the counters
   - Method page lists every source
   - no horizontal scroll at 375 px
3. Capture still frames for the deck into `pitch/assets/`. Tell the user to screen-record the 40-second segment following `pitch/video-script.md`. You can't record video.

## Phase 5: Report to the user
Tell the user:
- the production URL
- the headline numbers, each with its sensitivity band
- the critic scores per round (from `review-log.md`), including any round below 8
- the checks that passed, and anything left unverified

Offer to generate a `.pptx` of the deck with the `pptx` skill. It imports into Google Slides.

---

## 5. Guardrails
- **Credibility beats flash.** Every number on screen comes from `runSimulation` or `SOURCES`. No invented customers, quotes or "trusted by" logos. Label it as a model: "modeled, not measured."
- **No REON impersonation.** Use our wordmark, and put the credit line in the footer.
- **Subagent hygiene:**
  - Agents get the specs in this doc, not your conclusions about quality.
  - Critics are always fresh.
  - Two agents never own the same file.
  - Only the main thread installs packages, builds or starts servers.
- **If something blocks you** (Design type unavailable, Vercel auth, a dependency conflict), take the documented fallback and keep going. Ask the user only for things only they can do: Vercel login, git consent, team names for slide 2.

## 6. Sources to put in `SOURCES` (verify URLs resolve; mark any that don't)
- REON CES 2.5 MW / 5 MWh, 480 V 3-phase: `docs/briefs/reon-who-we-are.txt`, https://www.reoncorp.com/hardware
- Nature Energy 2026, Zhou et al., "Quantifying the impact of cell-to-cell inconsistency…" (health loss 6.2% cars / 7.5% buses; lifetime shortened 17.7% / 22.8%): https://www.nature.com/articles/s41560-026-02131-5
- BNEF 2025: 112 GW / 307 GWh of storage added in 2025: https://about.bnef.com/insights/clean-energy/energy-storage-enters-the-100-gigawatt-era-three-things-to-know/
- BNEF 2025: stationary pack $70/kWh; lowest LFP stationary cell $36/kWh; all-segment cell $74/kWh: https://www.ess-news.com/2025/12/09/bnef-lithium-ion-battery-pack-prices-fall-to-108-kwh-stationary-storage-becomes-lowest-price-segment/
- BNEF turnkey BESS $117/kWh (2025): https://www.energy-storage.news/battery-storage-system-prices-continue-to-fall-sharply-bnef-and-ember-reports-find/
- Augmentation at 60–70% of capex per kWh (vendor guide) and about 3%/yr reserve (Lazard method): https://howtostoreelectricity.com/battery-augmentation-strategy/
- Battery manufacturing 61–106 kg CO2e/kWh: IVL Swedish Environmental Research Institute, 2019 (C444). Find and verify the URL.
- Prior art (Method page "How this differs"): Relectrify https://www.relectrify.com/us · TWAICE augmentation https://www.twaice.com/industry-technology/bess-augmentation
- Headline arithmetic: 307 GWh × $117/kWh ≈ $35.9B; × 17.7–22.8% ≈ $6.4–8.2B. Show it as "≈ $6–8B of value from one year of installs," labeled as our estimate.
