"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, InstancedMesh, Object3D } from "three";
import { DEAD, TRAPPED, healthColor } from "./cellColor";

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

  // Render on demand: redraw when the discharge level moves or the cells change, otherwise stay idle.
  useEffect(() => {
    lastD.current = -1;
    invalidate();
    let raf = 0;
    const poll = () => {
      if ((drawn.current ?? 0) !== lastD.current) invalidate();
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [drawn, invalidate, soh, mode, nMinFrac]);

  // Per-string stop point: fixed = weakest cell; cellscape = when active cells drop below nMin.
  const stops = useMemo(() => {
    const out = new Float32Array(STRINGS);
    const nMin = Math.ceil(nMinFrac * CPS);
    for (let s = 0; s < STRINGS; s++) {
      const sl = Array.from(soh.subarray(s * CPS, (s + 1) * CPS)).sort((a, b) => a - b);
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
      if (mode === "cellscape" && h <= used) {
        c.copy(DEAD); // emptied and bypassed; string keeps running
      } else {
        const soc = Math.max(0, h - used) / h;
        if (locked && soc > 0.02) {
          c.copy(TRAPPED).multiplyScalar(0.35 + 1.6 * soc); // trapped energy
        } else {
          healthColor(h, c).multiplyScalar((h < 0.8 ? 0.5 : 0.1) + (h < 0.8 ? 1.6 : 0.6) * soc);
        }
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
  return (
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 30, position: [0, -4, 175], near: 1, far: 800 }}>
      <color attach="background" args={["#0b0e10"]} />
      <Wall {...props} />
      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
