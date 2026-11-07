"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, EdgesGeometry, InstancedMesh, LineSegments, Object3D } from "three";
import { healthColor } from "./cellColor";

// CES container twin: 14 racks × 416 cells (8 wide × 26 tall × 2 deep), 2 rows of 7.
const RACKS = 14;
const RW = 8, RH = 26, RD = 2;
const PER = RW * RH * RD;
const N = RACKS * PER;

function seededSoh() {
  let a = 1234567;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const soh = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = rnd();
    soh[i] = r < 0.012 ? 0.68 + rnd() * 0.08 : r < 0.05 ? 0.82 + rnd() * 0.06 : 0.93 + rnd() * 0.06;
  }
  return soh;
}

// Per-instance constants, computed once so the frame loop does no trig per cell.
function layout() {
  const bx = new Float32Array(N), by = new Float32Array(N), bz = new Float32Array(N);
  const spreadX = new Float32Array(N), spreadZ = new Float32Array(N), rise = new Float32Array(N), tilt = new Float32Array(N);
  const jit = new Float32Array(N), drift = new Float32Array(N), rx = new Float32Array(N), ry = new Float32Array(N);
  for (let r = 0; r < RACKS; r++) {
    const row = r < 7 ? 0 : 1;
    const col = r % 7;
    for (let k = 0; k < PER; k++) {
      const i = r * PER + k;
      bx[i] = col * (RW + 1) - 31 + (k % RW);
      by[i] = (Math.floor(k / RW) % RH) - RH / 2;
      bz[i] = row * (RD + 1.5) - 2 + Math.floor(k / (RW * RH));
      spreadX[i] = (col - 3) * 7;
      spreadZ[i] = (row - 0.5) * 16;
      rise[i] = Math.sin((col / 6) * Math.PI) * 6;
      tilt[i] = (col - 3) * 0.08;
      jit[i] = Math.sin(i * 12.9898) * 3;
      drift[i] = Math.cos(i * 4.1) * 2.5;
      rx[i] = Math.sin(i) * 0.6;
      ry[i] = Math.cos(i) * 0.6;
    }
  }
  return { bx, by, bz, spreadX, spreadZ, rise, tilt, jit, drift, rx, ry };
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function Cells({ progress }: { progress: React.RefObject<number> }) {
  const mesh = useRef<InstancedMesh>(null);
  const shell = useRef<LineSegments>(null);
  const lid = useRef<LineSegments>(null);
  const { camera, size, invalidate } = useThree();
  const dummy = useMemo(() => new Object3D(), []);
  const geo = useMemo(() => new BoxGeometry(0.78, 0.78, 0.78), []);
  const soh = useMemo(seededSoh, []);
  const L = useMemo(layout, []);
  const shellGeo = useMemo(() => new EdgesGeometry(new BoxGeometry(66, 28, 8)), []);
  const lidGeo = useMemo(() => new EdgesGeometry(new BoxGeometry(66, 0.6, 8)), []);
  const mobile = size.width < 768;
  const shown = useRef(-1); // progress value currently drawn

  useLayoutEffect(() => {
    const m = mesh.current!;
    const c = new Color();
    for (let i = 0; i < N; i++) {
      healthColor(soh[i], c);
      m.setColorAt(i, c.multiplyScalar(soh[i] < 0.8 ? 2.6 : soh[i] < 0.9 ? 0.9 : 0.42));
    }
    m.instanceColor!.needsUpdate = true;
  }, [soh]);

  // Render on demand: wake the loop only when the scroll target differs from what is drawn,
  // so scrolling the rest of the page never re-renders a settled hero.
  useEffect(() => {
    // Check on the next frame: this listener can run before the parent's scroll handler updates `progress`.
    let pending = 0;
    const wake = () => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        if (Math.abs((progress.current ?? 0) - shown.current) > 0.0004) invalidate();
      });
    };
    const resize = () => {
      shown.current = -1;
      invalidate();
    };
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(pending);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", resize);
    };
  }, [invalidate, progress]);

  useFrame((state, delta) => {
    const target = progress.current ?? 0;
    // Ease toward the scroll position so wheel steps glide instead of jumping.
    const prev = shown.current < 0 ? target : shown.current;
    let p = prev + (target - prev) * (1 - Math.exp(-Math.min(delta, 0.05) * 7));
    if (Math.abs(target - p) < 0.0004) p = target;
    else state.invalidate();
    if (p === shown.current) return;
    shown.current = p;

    const lift = ease(p / 0.25); // lid lifts
    const fan = ease((p - 0.15) / 0.5); // racks fan out
    const field = ease((p - 0.55) / 0.4); // cells drift into a field
    const m = mesh.current!;
    for (let i = 0; i < N; i++) {
      const j = field * L.jit[i];
      dummy.position.set(
        L.bx[i] + L.spreadX[i] * fan + j * 0.4,
        L.by[i] + L.rise[i] * fan + L.drift[i] * field,
        L.bz[i] + L.spreadZ[i] * fan + j
      );
      dummy.rotation.set(field * L.rx[i], fan * L.tilt[i] + field * L.ry[i], 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;

    if (shell.current) (shell.current.material as { opacity: number }).opacity = 0.55 * (1 - fan);
    if (lid.current) {
      lid.current.position.y = 14.3 + lift * 18;
      (lid.current.material as { opacity: number }).opacity = 0.8 * (1 - fan);
    }
    const dist = (mobile ? 150 : 100) * (1 + 0.45 * p);
    camera.position.set(Math.sin(p * 0.9 - 0.45) * dist * 0.55, 18 - p * 14, Math.cos(p * 0.9 - 0.45) * dist);
    camera.lookAt(0, 2 * fan, 0);
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[geo, undefined, N]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments ref={shell} geometry={shellGeo}>
        <lineBasicMaterial color="#3ddc84" transparent opacity={0.55} />
      </lineSegments>
      <lineSegments ref={lid} geometry={lidGeo} position={[0, 14.3, 0]}>
        <lineBasicMaterial color="#e8ecea" transparent opacity={0.8} />
      </lineSegments>
    </>
  );
}

export default function HeroScene({ progress }: { progress: React.RefObject<number> }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ fov: 35, near: 1, far: 600, position: [0, 18, 95] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#07090a"]} />
      <fog attach="fog" args={["#07090a", 90, 220]} />
      <Cells progress={progress} />
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
