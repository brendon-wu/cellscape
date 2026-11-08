"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, Color, InstancedMesh, Object3D } from "three";
import { CHARGE, CULPRIT, DEAD, TRAPPED, healthColor } from "./cellColor";

const STRINGS = 14, COLS = 8, ROWS = 52, CPS = COLS * ROWS;
const N = STRINGS * CPS;
const GAP = 1.6;

interface Props {
  soh: Float32Array;
  mode: "fixed" | "cellscape";
  drawn: React.RefObject<number>; // Ah drawn per series string, as a fraction of nameplate cell Ah
  nMinFrac: number;
}

function Wall({ soh, mode, drawn, nMinFrac }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new BoxGeometry(0.82, 0.82, 0.82), []);
  const dummy = useMemo(() => new Object3D(), []);
  const c = useMemo(() => new Color(), []);
  const width = STRINGS * COLS + (STRINGS - 1) * GAP;
  const invalidate = useThree((s) => s.invalidate);
  const lastD = useRef(-1);

  const gl = useThree((s) => s.gl);

  // Render on demand: redraw when the discharge level moves or the cells change, otherwise stay idle.
  // The poll that watches the discharge level only runs while the wall is on screen.
  useEffect(() => {
    lastD.current = -1;
    invalidate();
    let raf = 0;
    const poll = () => {
      if ((drawn.current ?? 0) !== lastD.current) invalidate();
      raf = requestAnimationFrame(poll);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(poll);
    });
    io.observe(gl.domElement);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [drawn, invalidate, soh, mode, nMinFrac, gl]);

  // Per-string stop point: fixed = weakest cell; cellscape = when active cells drop below nMin.
  const stops = useMemo(() => {
    const out = new Float32Array(STRINGS);
    const nMin = Math.ceil(nMinFrac * CPS);
    for (let s = 0; s < STRINGS; s++) {
      const sl = soh.slice(s * CPS, (s + 1) * CPS).sort();
      out[s] = mode === "fixed" ? sl[0] : sl[CPS - nMin];
    }
    return out;
  }, [soh, mode, nMinFrac]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < N; i++) {
      const s = Math.floor(i / CPS), j = i % CPS;
      dummy.position.set(s * (COLS + GAP) + (j % COLS) - width / 2 + 0.5, Math.floor(j / COLS) - ROWS / 2, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [dummy, width]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const d = drawn.current ?? 0;
    if (d === lastD.current) return;
    lastD.current = d;
    for (let i = 0; i < N; i++) {
      const s = Math.floor(i / CPS);
      const h = soh[i];
      const stop = stops[s];
      const locked = d >= stop && d > 0;
      const used = Math.min(d, stop);
      const soc = Math.max(0, h - used) / h;
      if (d === 0) {
        // At rest: color by health so the weak cells stand out.
        healthColor(h, c).multiplyScalar(h < 0.8 ? 2.1 : 0.7);
      } else if (mode === "fixed" && locked && h <= stop + 1e-6) {
        c.copy(CULPRIT).multiplyScalar(2.4); // the weak cell that stopped this string
      } else if (mode === "cellscape" && h <= used) {
        c.copy(DEAD); // emptied and bypassed; the string keeps running
      } else if (locked && soc > 0.02) {
        c.copy(TRAPPED).multiplyScalar(0.3 + 1.7 * soc); // energy stranded in healthy cells
      } else {
        c.copy(CHARGE).multiplyScalar(0.06 + 1.15 * soc); // draining charge
      }
      m.setColorAt(i, c);
    }
    m.instanceColor!.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, N]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default function CellWall(props: Props) {
  const [ready, setReady] = useState(false);
  return (
    <Canvas
      onCreated={() => requestAnimationFrame(() => setReady(true))}
      style={{ opacity: ready ? 1 : 0, transition: "opacity 700ms ease-out" }}
      frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 30, position: [0, -1, 106], near: 1, far: 800 }}>
      <color attach="background" args={["#0b0e10"]} />
      <Wall {...props} />
      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
