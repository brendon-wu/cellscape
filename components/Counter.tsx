"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `value` when first scrolled into view, then glides between values as inputs change. */
export default function Counter({ value, format, ms = 1100 }: { value: number; format: (n: number) => string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const [seen, setSeen] = useState(false);
  // React renders the starting text once; after that the animation owns the text node.
  const [initial] = useState(() => format(0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.current = value;
      el.textContent = format(value);
      return;
    }
    const from = shown.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = from + (value - from) * (1 - Math.pow(1 - t, 3));
      shown.current = v;
      el.textContent = format(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, seen, format, ms]);

  return <span ref={ref}>{initial}</span>;
}
