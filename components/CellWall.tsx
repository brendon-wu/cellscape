"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useLayoutEffect, useMemo, useRef } from "react";
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

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const d = drawn.current ?? 0;
    const t = state.clock.elapsedTime;
    const pulse = 0.75 + 0.25 * Math.sin(t * 4);
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
          c.copy(TRAPPED).multiplyScalar((0.35 + 1.6 * soc) * pulse); // trapped energy
        } else {
          healthColor(h, c).multiplyScalar((h < 0.8 ? 0.5 : 0.1) + (h < 0.8 ? 1.6 : 0.6) * soc);
        }
      }
      m.setColorAt(i, c);
    }
    m.instanceColor!.needsUpdate = true;
    m.rotation.y = Math.sin(t * 0.25) * 0.05;
  });

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, N]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default function CellWall(props: Props) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 30, position: [0, -4, 175], near: 1, far: 800 }}>
      <color attach="background" args={["#0b0e10"]} />
      <Wall {...props} />
      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
