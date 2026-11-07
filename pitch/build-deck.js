const pptxgen = require("pptxgenjs");
const path = require("path");

const ASSETS = "C:/Users/brend/Downloads/cellscape/pitch/assets";
const OUT = "C:/Users/brend/Downloads/cellscape/pitch/CELLSCAPE_deck.pptx";

const BG = "07090A", SURF = "0E1214", LINE = "1C2326", TEXT = "E8ECEA", MUTED = "8A9592",
  GREEN = "3DDC84", RED = "E23B3B", AMBER = "F5B83D";
const FONT = "Arial";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.title = "CELLSCAPE";
pres.author = "Brendon Wu, Justin Lam";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

pres.defineSlideMaster({
  title: "DARK",
  background: { color: BG },
  objects: [
    { text: { text: "CELLSCAPE", options: { x: 0.6, y: 5.12, w: 3, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, charSpacing: 4, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.12, w: 0.4, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: "right" },
});

const eyebrow = (s, text, x, y, w = 6) =>
  s.addText(text.toUpperCase(), { x, y, w, h: 0.3, fontFace: FONT, fontSize: 10, color: MUTED, charSpacing: 4, margin: 0, isTextBox: true });
const title = (s, text, opts = {}) =>
  s.addText(text, { x: 0.6, y: 0.72, w: 8.8, h: 0.9, fontFace: FONT, fontSize: 32, color: TEXT, margin: 0, valign: "top", isTextBox: true, ...opts });

// 1. Title
{
  const s = pres.addSlide({ masterName: "DARK" });
  s.addImage({ path: path.join(ASSETS, "hero-intact.jpg"), x: 0, y: -0.05, w: 10, h: 5.68, objectName: "Hero render" });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 2.9, w: 10, h: 2.725, fill: { color: BG, transparency: 12 }, line: { type: "none" }, objectName: "Text scrim" });
  eyebrow(s, "REON challenge · MIT Energy & Climate Hack 2026", 0.6, 3.15, 8);
  s.addText("CELLSCAPE", { x: 0.6, y: 3.45, w: 8.8, h: 0.9, fontFace: FONT, fontSize: 54, color: TEXT, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(
    [
      { text: "One weak cell ", options: { color: TEXT } },
      { text: "strands", options: { color: RED } },
      { text: " a whole battery. We make every cell count.", options: { color: TEXT } },
    ],
    { x: 0.6, y: 4.35, w: 8.8, h: 0.5, fontFace: FONT, fontSize: 18, margin: 0, isTextBox: true }
  );
  s.addNotes("Every battery has a weakest cell, and today that one cell decides how much the whole battery can deliver. We built CELLSCAPE to change that.");
}

// 2. Team
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "Team", 0.6, 0.5);
  title(s, "Built by");
  const people = [
    { initials: "BW", name: "Brendon Wu", line: "Computer Science, Stanford '29" },
    { initials: "JL", name: "Justin Lam", line: "Course 6-4, MIT '28" },
  ];
  people.forEach((p, i) => {
    const x = 0.6 + i * 4.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.85, w: 4.2, h: 2.6, rectRadius: 0.12, fill: { color: SURF }, line: { color: LINE, width: 0.75 }, objectName: `${p.name} card` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.4, y: 2.25, w: 1.0, h: 1.0, fill: { color: GREEN }, line: { type: "none" }, objectName: `${p.name} avatar` });
    s.addText(p.initials, { x: x + 0.4, y: 2.25, w: 1.0, h: 1.0, fontFace: FONT, fontSize: 22, bold: true, color: BG, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(p.name, { x: x + 0.4, y: 3.45, w: 3.5, h: 0.45, fontFace: FONT, fontSize: 22, color: TEXT, margin: 0, isTextBox: true });
    s.addText(p.line, { x: x + 0.4, y: 3.9, w: 3.5, h: 0.35, fontFace: FONT, fontSize: 14, color: MUTED, margin: 0, isTextBox: true });
  });
  s.addNotes("I'm Brendon Wu, Computer Science at Stanford. I'm Justin Lam, Course 6-4 at MIT.");
}

// 3. Problem
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "The problem", 0.6, 0.5);
  title(s, "The weakest cell sets the limit");
  const cells = [...Array(15).fill(85), 70];
  const bx = 0.6, by = 1.95, cw = 0.27, gap = 0.08, ch = 2.3;
  cells.forEach((q, i) => {
    const x = bx + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: by, w: cw, h: ch, rectRadius: 0.04, fill: { color: SURF }, line: { color: LINE, width: 0.75 }, objectName: `Cell ${i + 1} shell` });
    const fh = (ch * q) / 100;
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.03, y: by + ch - fh + 0.03, w: cw - 0.06, h: fh - 0.06, fill: { color: q < 80 ? RED : GREEN, transparency: q < 80 ? 0 : 15 }, line: { type: "none" }, objectName: `Cell ${i + 1} charge` });
  });
  s.addShape(pres.shapes.LINE, { x: bx, y: by + ch * 0.3, w: 16 * (cw + gap) - gap, h: 0, line: { color: AMBER, width: 1, dashType: "dash" }, objectName: "70% limit" });
  s.addText("15 cells at 85 Ah · 1 cell at 70 Ah · REON's example", { x: bx, y: by + ch + 0.15, w: 5.6, h: 0.3, fontFace: FONT, fontSize: 11, color: MUTED, margin: 0, isTextBox: true });

  s.addText("84.06%", { x: 6.6, y: 1.9, w: 2.9, h: 0.75, fontFace: FONT, fontSize: 44, color: TEXT, margin: 0, isTextBox: true });
  s.addText("Average cell health", { x: 6.6, y: 2.62, w: 2.9, h: 0.3, fontFace: FONT, fontSize: 13, color: MUTED, margin: 0, isTextBox: true });
  s.addText("70%", { x: 6.6, y: 3.2, w: 2.9, h: 0.75, fontFace: FONT, fontSize: 44, color: RED, margin: 0, isTextBox: true });
  s.addText("What the whole string can deliver", { x: 6.6, y: 3.92, w: 2.9, h: 0.3, fontFace: FONT, fontSize: 13, color: MUTED, margin: 0, isTextBox: true });
  s.addNotes(
    "Grid batteries wire hundreds of cells in series, so the same current flows through all of them. When the weakest one hits its limit, the whole string stops. Take REON's own example: fifteen cells at 85 percent and one at 70. The average cell is at 84 percent, but the string can only deliver 70. The healthy cells still hold energy, and it's trapped. Balancing can't fix that, because aging takes away capacity for good."
  );
}

// 4. Big stat
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "Why it matters", 0.6, 0.5);
  title(s, "At grid scale, weak cells cost billions");
  const stats = [
    { k: "307 GWh", c: TEXT, l: "of battery storage installed worldwide in 2025, about $36B of hardware", src: "BNEF 2025" },
    { k: "18–23%", c: RED, l: "shorter pack life from cell-to-cell mismatch, measured in real fleets", src: "Nature Energy 2026" },
    { k: "≈$6–8B", c: GREEN, l: "of value lost from a single year of installs", src: "Our estimate · $36B × 18–23%" },
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 3.0;
    s.addText(st.k, { x, y: 2.0, w: 2.8, h: 0.9, fontFace: FONT, fontSize: 40, color: st.c, margin: 0, isTextBox: true });
    s.addText(st.l, { x, y: 2.95, w: 2.6, h: 0.9, fontFace: FONT, fontSize: 14, color: MUTED, margin: 0, valign: "top", isTextBox: true });
    s.addText(st.src.toUpperCase(), { x, y: 4.0, w: 2.8, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, charSpacing: 2, margin: 0, isTextBox: true });
  });
  s.addNotes(
    "Now scale that up. The world installed 307 gigawatt-hours of grid batteries in 2025, roughly 36 billion dollars of hardware. A Nature Energy study this year found that cell-to-cell mismatch cuts pack life by 18 to 23 percent. That's six to eight billion dollars of value lost from a single year of installs, and every year we install more."
  );
}

// 5. Product
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "The product", 0.6, 0.5);
  title(s, "A digital twin of every cell");
  s.addImage({ path: path.join(ASSETS, "hero-exploded.jpg"), x: 0.6, y: 1.75, w: 4.2, h: 2.38, rounding: false, objectName: "Exploded container render" });
  const rows = [
    ["Simulates", "All 5,824 cells of a 2.5 MW / 5 MWh CES container over 20 years"],
    ["Compares", "A conventional fixed string vs REON cell-level bypass and wear-leveling"],
    ["Decides", "Years of service, augmentation capex and tCO₂ for the battery owner"],
  ];
  rows.forEach(([h, b], i) => {
    const y = 1.75 + i * 0.8;
    s.addText(h, { x: 5.2, y, w: 4.2, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: GREEN, margin: 0, isTextBox: true });
    s.addText(b, { x: 5.2, y: y + 0.3, w: 4.2, h: 0.45, fontFace: FONT, fontSize: 13, color: TEXT, margin: 0, valign: "top", isTextBox: true });
  });
  const metrics = [["+1.5 yrs", "more service"], ["$37k", "capex avoided"], ["+$16k", "NPV"], ["56 tCO₂", "avoided"]];
  metrics.forEach(([k, l], i) => {
    const x = 0.6 + i * 2.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.3, w: 2.0, h: 0.7, rectRadius: 0.08, fill: { color: SURF }, line: { color: LINE, width: 0.75 }, objectName: `Metric ${l}` });
    s.addText(k, { x: x + 0.15, y: 4.33, w: 1.8, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: i === 0 ? GREEN : TEXT, margin: 0, isTextBox: true });
    s.addText(l + " · per container", { x: x + 0.15, y: 4.69, w: 1.8, h: 0.25, fontFace: FONT, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
  });
  s.addNotes(
    "CELLSCAPE is a digital twin of REON's 5-megawatt-hour container. It simulates all 5,824 cells over twenty years and compares a conventional fixed string with REON's cell-level bypass and wear-leveling. It gives the owner a decision: years of service, augmentation dollars and tonnes of CO2."
  );
}

// 6. Demo
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "Live demo", 0.6, 0.5);
  title(s, "Discharge both batteries. Watch one lock up");
  s.addImage({ path: path.join(ASSETS, "simulator.jpg"), x: 0.6, y: 1.6, w: 5.9, h: 3.35, objectName: "Simulator screenshot" });
  s.addText("Try it", { x: 6.85, y: 1.65, w: 2.6, h: 0.3, fontFace: FONT, fontSize: 13, color: MUTED, margin: 0, isTextBox: true });
  s.addText("cellscape-beta.vercel.app", {
    x: 6.85, y: 1.95, w: 2.7, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: GREEN, margin: 0, isTextBox: true,
    hyperlink: { url: "https://cellscape-beta.vercel.app" },
  });
  const steps = ["Pick a year in the container's life", "Discharge: fixed strings lock with energy trapped", "Scrub 20 years against the 80% contract floor"];
  s.addText(
    steps.map((t, i) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < steps.length - 1 } })),
    { x: 6.85, y: 2.65, w: 2.6, h: 1.6, fontFace: FONT, fontSize: 13, color: TEXT, paraSpaceAfter: 8, margin: 0, valign: "top", isTextBox: true }
  );
  s.addText("Modeled, not measured. Every input is cited on the site.", { x: 6.85, y: 4.45, w: 2.6, h: 0.5, fontFace: FONT, fontSize: 10, color: MUTED, margin: 0, valign: "top", isTextBox: true });
  s.addNotes(
    "Here's year ten. We discharge both. The fixed strings lock up with energy trapped behind weak cells. CELLSCAPE bypasses those cells and keeps delivering: a year and a half more service, thirty-seven thousand dollars of augmentation avoided, and fifty-six tonnes of CO2 saved, per container. Every cell counts."
  );
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("wrote", f));

