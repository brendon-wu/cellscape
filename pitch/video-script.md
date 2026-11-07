# CELLSCAPE: 2-minute video script

Pacing: about 150 words per minute, about 290 spoken words in total. Times are cumulative.

| Time | On screen | Voiceover |
|---|---|---|
| **0:00–0:10** | **Slide 1: Title.** CELLSCAPE over the glowing container. | "Every battery has a weakest cell, and today that one cell decides how much the whole battery can deliver. We built CELLSCAPE to change that." |
| **0:10–0:20** | **Slide 2: Team** | "I'm Brendon Wu, Computer Science at Stanford. I'm Justin Lam, Course 6-4 at MIT." *(Each person says their own line, or one narrator says both.)* |
| **0:20–0:50** | **Slide 3: Problem.** The 16-cell string. | "Grid batteries wire hundreds of cells in series, so the same current flows through all of them. When the weakest one hits its limit, the whole string stops. Take REON's own example: fifteen cells at 85 percent and one at 70. The average cell is at 84 percent, but the string can only deliver 70. The healthy cells still hold energy, and it's trapped. Balancing can't fix that, because aging takes away capacity for good." |
| **0:50–1:20** | **Slide 4: Big stat** | "Now scale that up. The world installed 307 gigawatt-hours of grid batteries in 2025, roughly 36 billion dollars of hardware. A Nature Energy study this year found that cell-to-cell mismatch cuts pack life by 18 to 23 percent. That's six to eight billion dollars of value lost from a single year of installs, and every year we install more." |
| **1:20–1:40** | **Slide 5: Product** | "CELLSCAPE is a digital twin of REON's 5-megawatt-hour container. It simulates all 5,824 cells over twenty years and compares a conventional fixed string with REON's cell-level bypass and wear-leveling. It gives the owner a decision: years of service, augmentation dollars and tonnes of CO₂." |
| **1:40–2:00** | **Screen recording of the live site** (see shot list) | "Here's year ten. We discharge both. The fixed strings lock up with energy trapped behind weak cells. CELLSCAPE bypasses those cells and keeps delivering: a year and a half more service, thirty-seven thousand dollars of augmentation avoided, and fifty-six tonnes of CO₂ saved, per container. Every cell counts." |

## Screen-recording shot list (20–40 s; record at 1920×1080, browser full screen)
1. **Hero (4 s).** Load https://cellscape-beta.vercel.app and scroll slowly so the container lid lifts and the racks spread out.
2. **Jump to the simulator (2 s).** Click "Simulator" in the top nav.
3. **Discharge (8 s).** Leave the year at Y10 and click **Discharge both batteries**. Hold until the left panel shows "STRINGS LOCKED".
4. **Scrub (4 s).** Drag the year slider from Y10 toward Y14 so both curves move past the 80% contract floor on the chart.
5. **Counters (2 s).** Hold on the four result tiles at the bottom.

If the demo section runs the full 40 s, trim slides 3 and 4 to 25 s each to stay under 2:00.

## Numbers used (from the live model and the cited sources)
- 16-cell example: 70% string capacity vs 84.06% average (REON challenge brief).
- 307 GWh installed in 2025; $117/kWh turnkey, about $36B (BNEF 2025).
- 17.7–22.8% shorter pack life from cell mismatch (Nature Energy 2026, Zhou et al.).
- About $6–8B lost: our estimate, $36B × 17.7–22.8%.
- Per container, modeled: +1.5 years before the 80% floor; $37k augmentation capex avoided over 20 years; +$16k NPV; 56 tCO₂ avoided (range 42–72).
