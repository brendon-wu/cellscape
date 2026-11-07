# CELLSCAPE

Live: https://cellscape-beta.vercel.app

**REON’s savings, made visible:** simulate your battery and see exactly what cell-level control gives back.

Built for the REON challenge ("Beyond the Weakest Cell") at the MIT Energy & Climate Hack 2026 by Brendon Wu and Justin Lam. Not affiliated with REON.

## What it does
- Simulates all 5,824 cells of a REON CES container (2.5 MW / 5 MWh; 14 strings × 416 LFP cells) over 20 years.
- Compares a fixed series string, where the weakest cell limits the string, with cell-level bypass plus wear-leveling.
- Cell-to-cell aging spread is calibrated so fixed strings lose about 19% of their life, inside Nature Energy 2026's measured 17.7–22.8% range.
- Reports years until the contract capacity floor is breached, augmentation capex avoided, NPV, and tCO₂ avoided.

The engine is `lib/sim.ts`. Sources and assumptions are listed on the site's Method section.

## Run locally
```bash
npm install
npm run dev
```
