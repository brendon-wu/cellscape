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
      { text: "REON’s savings, made visible. ", options: { color: GREEN } },
      { text: "Simulate your battery and see exactly what cell-level control gives back.", options: { color: TEXT } },
    ],
    { x: 0.6, y: 4.3, w: 8.8, h: 0.65, fontFace: FONT, fontSize: 17, margin: 0, valign: "top", isTextBox: true }
  );
  s.addNotes("This is CELLSCAPE: REON's savings, made visible. Any battery owner can simulate their own fleet and see exactly what cell-level control gives back.");
}

// 2. Team
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "Team", 0.6, 0.5);
  title(s, "Built by");
  const people = [
    { photo: "brendon.jpg", name: "Brendon Wu", line: "Computer Science, Stanford '29" },
    { photo: "justin.jpg", name: "Justin Lam", line: "Course 6-4, MIT '28" },
  ];
  people.forEach((p, i) => {
    const x = 0.6 + i * 4.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.7, w: 4.2, h: 3.05, rectRadius: 0.12, fill: { color: SURF }, line: { color: LINE, width: 0.75 }, objectName: `${p.name} card` });
    s.addImage({ path: path.join(ASSETS, p.photo), x: x + 0.4, y: 1.95, w: 1.6, h: 1.6, rounding: true, altText: `Headshot of ${p.name}`, objectName: `${p.name} headshot` });
    s.addText(p.name, { x: x + 0.4, y: 3.72, w: 3.5, h: 0.45, fontFace: FONT, fontSize: 22, color: TEXT, margin: 0, isTextBox: true });
    s.addText(p.line, { x: x + 0.4, y: 4.17, w: 3.5, h: 0.35, fontFace: FONT, fontSize: 14, color: MUTED, margin: 0, isTextBox: true });
  });
  s.addNotes("I'm Brendon Wu, Computer Science at Stanford. I'm Justin Lam, Course 6-4 at MIT.");
}

// 3. Problem
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "The problem", 0.6, 0.5);
  title(s, "Easy to claim, hard to price");
  const cards = [
    { label: "What a buyer hears", big: "“2–3× more usable capacity”", bigColor: TEXT, sub: "A strong claim, but the same for every customer" },
    { label: "What a buyer needs to sign", big: "“What is it worth for my fleet?”", bigColor: GREEN, sub: "In years of service, dollars and tonnes of CO₂" },
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 4.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w: 4.2, h: 2.3, rectRadius: 0.12, fill: { color: SURF }, line: { color: i ? GREEN : LINE, width: 0.75 }, objectName: `${c.label} card` });
    s.addText(c.label.toUpperCase(), { x: x + 0.35, y: 2.0, w: 3.5, h: 0.3, fontFace: FONT, fontSize: 10, color: MUTED, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(c.big, { x: x + 0.35, y: 2.4, w: 3.5, h: 1.0, fontFace: FONT, fontSize: 24, color: c.bigColor, margin: 0, valign: "top", isTextBox: true });
    s.addText(c.sub, { x: x + 0.35, y: 3.45, w: 3.5, h: 0.4, fontFace: FONT, fontSize: 13, color: MUTED, margin: 0, valign: "top", isTextBox: true });
  });
  s.addText("Battery owners approve purchases on spreadsheets. Without a number for their own fleet, the value of cell-level control stays invisible.", {
    x: 0.6, y: 4.3, w: 8.7, h: 0.6, fontFace: FONT, fontSize: 14, color: TEXT, margin: 0, valign: "top", isTextBox: true,
  });
  s.addNotes(
    "Battery owners buy on spreadsheets. They hear claims like two to three times more usable capacity, but what they need before they sign is a number for their own fleet: how many more years, how many dollars, how much carbon. Right now, nobody shows them that, so the value of cell-level control stays invisible."
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
  title(s, "Simulate your battery");
  s.addImage({ path: path.join(ASSETS, "hero-exploded.jpg"), x: 0.6, y: 1.75, w: 4.2, h: 2.38, objectName: "Exploded container render" });
  const rows = [
    ["Enter your fleet", "Fleet size, years in service and how mismatched your cells are"],
    ["See every cell", "5,824 cells per REON CES container, fixed string vs REON control, over 20 years"],
    ["Get your number", "Years of service, augmentation capex, NPV and tCO₂ for your fleet"],
  ];
  rows.forEach(([h, b], i) => {
    const y = 1.75 + i * 0.8;
    s.addText(h, { x: 5.2, y, w: 4.2, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: GREEN, margin: 0, isTextBox: true });
    s.addText(b, { x: 5.2, y: y + 0.3, w: 4.2, h: 0.45, fontFace: FONT, fontSize: 13, color: TEXT, margin: 0, valign: "top", isTextBox: true });
  });
  const metrics = [["+1.5 yrs", "more service"], ["$707k", "capex avoided"], ["+$302k", "added NPV"], ["1,083 tCO₂", "avoided"]];
  metrics.forEach(([k, l], i) => {
    const x = 0.6 + i * 2.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.3, w: 2.0, h: 0.7, rectRadius: 0.08, fill: { color: SURF }, line: { color: LINE, width: 0.75 }, objectName: `Metric ${l}` });
    s.addText(k, { x: x + 0.15, y: 4.33, w: 1.8, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: i === 0 ? GREEN : TEXT, margin: 0, isTextBox: true });
    s.addText(l + " · 100 MWh fleet", { x: x + 0.15, y: 4.69, w: 1.8, h: 0.25, fontFace: FONT, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
  });
  s.addNotes(
    "CELLSCAPE gives them that number. You enter your fleet: how big it is, how long it has been running, how mismatched your cells are. It simulates every one of the 5,824 cells in each REON container over twenty years, with and without cell-level control. For a typical 100-megawatt-hour fleet, that's a year and a half more service, 700 thousand dollars of augmentation avoided, 300 thousand dollars of added value and over a thousand tonnes of CO2."
  );
}

// 6. Demo
{
  const s = pres.addSlide({ masterName: "DARK" });
  eyebrow(s, "Live demo", 0.6, 0.5);
  title(s, "Your battery, with and without REON");
  s.addImage({ path: path.join(ASSETS, "simulator.jpg"), x: 0.6, y: 1.6, w: 5.9, h: 3.35, objectName: "Simulator screenshot" });
  s.addText("Try it", { x: 6.85, y: 1.65, w: 2.6, h: 0.3, fontFace: FONT, fontSize: 13, color: MUTED, margin: 0, isTextBox: true });
  s.addText("cellscape-beta.vercel.app", {
    x: 6.85, y: 1.95, w: 2.7, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: GREEN, margin: 0, isTextBox: true,
    hyperlink: { url: "https://cellscape-beta.vercel.app" },
  });
  const steps = ["Enter your fleet size and years in service", "Discharge: see what your weakest cells strand", "Read what REON gives back for your fleet"];
  s.addText(
    steps.map((t, i) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < steps.length - 1 } })),
    { x: 6.85, y: 2.65, w: 2.6, h: 1.6, fontFace: FONT, fontSize: 13, color: TEXT, paraSpaceAfter: 8, margin: 0, valign: "top", isTextBox: true }
  );
  s.addText("Modeled, not measured. Every input is cited on the site.", { x: 6.85, y: 4.45, w: 2.6, h: 0.5, fontFace: FONT, fontSize: 10, color: MUTED, margin: 0, valign: "top", isTextBox: true });
  s.addNotes(
    "Here's a 100-megawatt-hour fleet, ten years in. We discharge both versions. With a conventional BMS, the strings lock up with energy stranded behind weak cells. With REON, those cells are bypassed and the strings keep delivering. And the owner sees exactly what that's worth for their own fleet. REON's savings, made visible."
  );
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("wrote", f));


