"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const BEATS = [
  { at: 0, eyebrow: "REON CES · 2.5 MW / 5 MWh", title: "One weak cell strands a whole battery.", body: "" },
  {
    at: 0.33,
    eyebrow: "5,824 cells · 14 strings",
    title: "Every string is only as strong as its weakest cell.",
    body: "Conventional battery systems control the whole pack at once. When one cell hits its limit, the whole string stops, and the energy left in the healthy cells can't be used.",
  },
  {
    at: 0.66,
    eyebrow: "Cell-level control",
    title: "CELLSCAPE makes every cell count.",
    body: "It models what REON-style sensing and bypass recover for a grid battery's owner: years of service, dollars and tonnes of CO₂.",
  },
];

export default function Hero() {
  const section = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = section.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      progress.current = p;
      const b = BEATS.reduce((acc, x, i) => (p >= x.at ? i : acc), 0);
      setBeat(b);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={section} className="relative h-[320vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <HeroScene progress={progress} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#07090a_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-16 md:px-10 md:pb-20">
          {BEATS.map((b, i) => (
            <div
              key={i}
              className="absolute bottom-16 left-6 right-6 max-w-3xl transition-all duration-700 md:bottom-20 md:left-10"
              style={{
                opacity: beat === i ? 1 : 0,
                transform: `translateY(${beat === i ? 0 : beat > i ? -24 : 24}px)`,
                transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <p className="eyebrow mb-4">{b.eyebrow}</p>
              <h1
                className={`font-light tracking-[-0.035em] ${i === 0 ? "text-5xl leading-[0.98] md:text-[88px]" : "text-4xl leading-[1.02] md:text-6xl"}`}
              >
                {i === 0 ? (
                  <>
                    One weak cell <span className="text-red">strands</span>
                    <br />a whole battery.
                  </>
                ) : (
                  b.title
                )}
              </h1>
              {b.body && <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{b.body}</p>}
              {i === 2 && (
                <a
                  href="#simulator"
                  className="pointer-events-auto mt-7 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 text-sm font-medium text-bg transition hover:brightness-110"
                >
                  Run the simulator <span aria-hidden>→</span>
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="absolute bottom-6 right-6 hidden items-center gap-3 md:flex md:right-10">
          <span className="eyebrow">Scroll</span>
          <span className="h-px w-16 bg-line">
            <span className="block h-px bg-accent transition-all" style={{ width: `${((beat + 1) / 3) * 100}%` }} />
          </span>
        </div>
      </div>
    </section>
  );
}
