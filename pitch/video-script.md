# CELLSCAPE: 2-minute video script

**One-liner:** REON's savings, made visible: simulate your battery and see exactly what cell-level control gives back.

Pacing is about 150 words per minute, about 280 spoken words in total. Times are cumulative.

| Time | On screen | Voiceover |
|---|---|---|
| **0:00–0:10** | **Slide 1: Title** | "This is CELLSCAPE: REON's savings, made visible. Any battery owner can simulate their own fleet and see exactly what cell-level control gives back." |
| **0:10–0:20** | **Slide 2: Team** | "I'm Brendon Wu, Computer Science at Stanford. I'm Justin Lam, Course 6-4 at MIT." *(Each person says their own line, or one narrator says both.)* |
| **0:20–0:50** | **Slide 3: Easy to claim, hard to price** | "Battery owners buy on spreadsheets. They hear claims like two to three times more usable capacity, but before they sign they need a number for their own fleet: how many more years, how many dollars, how much carbon. Today nobody shows them that, so the value of cell-level control stays invisible, and every sale starts from a claim instead of a number." |
| **0:50–1:20** | **Slide 4: At grid scale, weak cells cost billions** | "And the number is big. The world installed 307 gigawatt-hours of grid batteries in 2025, roughly 36 billion dollars of hardware. A Nature Energy study this year found that cell-to-cell mismatch cuts pack life by 18 to 23 percent. That's six to eight billion dollars of value lost from a single year of installs. That's the value REON can win back, if customers can see it." |
| **1:20–1:40** | **Slide 5: Simulate your battery** | "CELLSCAPE shows them. You enter your fleet, and it simulates every cell in every REON container over twenty years, with and without cell-level control. For a 100-megawatt-hour fleet: a year and a half more service, 700 thousand dollars of augmentation avoided, and over a thousand tonnes of CO₂." |
| **1:40–2:00** | **Screen recording of the live site** (see shot list) | "Here's that fleet, ten years in. With a conventional BMS, the strings lock up with energy stranded behind weak cells. With REON, those cells are bypassed and the strings keep delivering, and the owner sees exactly what that's worth. REON's savings, made visible." |

## Screen-recording shot list (20–40 s; record at 1920×1080, browser full screen)
1. **Hero (4 s).** Load https://cellscape-beta.vercel.app and hold on "REON's savings, made visible." Then scroll slowly so the container opens up.
2. **Simulator (2 s).** Click "Simulate your battery."
3. **Your fleet (3 s).** Drag **Your fleet size** to 100 MWh and leave **Years in service** at Y10.
4. **Discharge (8 s).** Click **Discharge both batteries** and hold until the left panel shows "STRINGS LOCKED."
5. **Your number (3 s).** Scroll to "What REON gives back" and hold on the four tiles.

If the demo runs the full 40 s, trim slides 3 and 4 to 25 s each to stay under 2:00.

## Numbers used (from the live model and the cited sources)
- 307 GWh installed in 2025; $117/kWh turnkey, about $36B (BNEF 2025).
- 17.7–22.8% shorter pack life from cell mismatch (Nature Energy 2026, Zhou et al.).
- About $6–8B lost: our estimate, $36B × 17.7–22.8%.
- "2–3× more usable capacity": REON's own claim on reoncorp.com.
- 100 MWh fleet (19.2 CES containers), modeled: +1.5 years before the 80% floor; $707k augmentation capex avoided over 20 years; +$302k NPV; 1,083 tCO₂ avoided (range 796–1,383).
