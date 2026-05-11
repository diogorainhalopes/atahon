import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PresentationControls, RoundedBox, useTexture } from '@react-three/drei';

const SCREENSHOTS = [
  'lib_page.jpg',
  'browse_page.jpg',
  'read_page.jpg',
  'downloads_page.jpg',
  'details_page.jpg',
];

function AutoSpinGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  const lastInteractRef = useRef(0);
  const { gl } = useThree();
  const prefersReduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const el = gl.domElement;
    const mark = () => {
      lastInteractRef.current = performance.now();
    };
    el.addEventListener('pointerdown', mark);
    el.addEventListener('pointermove', mark);
    return () => {
      el.removeEventListener('pointerdown', mark);
      el.removeEventListener('pointermove', mark);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!ref.current || prefersReduced) return;
    if (performance.now() - lastInteractRef.current > 2000) {
      tRef.current += delta;
      // ~20° amplitude (0.35 rad), period ~10s — screen always on display
      ref.current.rotation.y = Math.sin(tRef.current * ((2 * Math.PI) / 10)) * 0.35;
    }
  });

  return <group ref={ref}>{children}</group>;
}

function Phone({ base }: { base: string }) {
  const urls = useMemo(
    () => SCREENSHOTS.map((f) => `${base}/screenshots/${f}`),
    [base],
  );
  const textures = useTexture(urls) as THREE.Texture[];

  const { gl } = useThree();
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.needsUpdate = true;
    }
  }, [textures, gl]);

  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [fade, setFade] = useState(0);

  useEffect(() => {
    let raf = 0;
    let fadeStart = 0;
    const FADE_MS = 500;
    const HOLD_MS = 3500;
    const tick = (now: number) => {
      if (!fadeStart) fadeStart = now + HOLD_MS;
      if (now >= fadeStart) {
        const p = Math.min(1, (now - fadeStart) / FADE_MS);
        setFade(p);
        if (p >= 1) {
          setCurrent((c) => (c + 1) % urls.length);
          setNext((n) => (n + 1) % urls.length);
          setFade(0);
          fadeStart = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [urls.length]);

  return (
    <group>
      <RoundedBox
        args={[1.0, 2.0, 0.14]}
        radius={0.04}
        smoothness={4}
        creaseAngle={0.4}
      >
        <meshStandardMaterial color="#111118" roughness={0.55} metalness={0.25} />
      </RoundedBox>

      {/* Screen — sits flat on the body's front face. The dark body itself forms the bezel. */}
      <mesh position={[0, 0, 0.0701]}>
        <planeGeometry args={[0.88, 1.88]} />
        <meshBasicMaterial map={textures[current]} toneMapped={false} />
      </mesh>

      {/* Crossfade overlay */}
      <mesh position={[0, 0, 0.0702]}>
        <planeGeometry args={[0.88, 1.88]} />
        <meshBasicMaterial
          map={textures[next]}
          transparent
          opacity={fade}
          toneMapped={false}
        />
      </mesh>

      {/* Hole-punch front camera — sits on top of the screen */}
      <mesh position={[0, 0.82, 0.0703]}>
        <circleGeometry args={[0.028, 32]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      <mesh position={[0, -0.92, 0.073]}>
        <planeGeometry args={[0.28, 0.018]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function ZoomController() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z + e.deltaY * 0.005,
        2.4,
        5.0,
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [camera, gl]);
  return null;
}

function PhoneCanvas({
  base,
  mode,
}: {
  base: string;
  mode: 'hero' | 'focus';
}) {
  const isFocus = mode === 'focus';
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, isFocus ? 5.0 : 3.8], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-2, -1, 2]} intensity={0.25} />
      {isFocus && <ZoomController />}
      <Suspense fallback={null}>
        <PresentationControls
          global={false}
          cursor
          snap={false}
          speed={1}
          rotation={[0.18, 0, 0]}
          polar={isFocus ? [-Math.PI / 2.2, Math.PI / 2.2] : [-0.35, 0.35]}
          azimuth={
            isFocus
              ? [-Infinity, Infinity]
              : [-Math.PI / 2.2, Math.PI / 2.2]
          }
          config={{ mass: 1, tension: 170, friction: 26 }}
        >
          {isFocus ? (
            <Phone base={base} />
          ) : (
            <AutoSpinGroup>
              <Phone base={base} />
            </AutoSpinGroup>
          )}
        </PresentationControls>
      </Suspense>
    </Canvas>
  );
}

export default function Hero3DPhone({ base = '' }: { base?: string }) {
  const [focused, setFocused] = useState(false);
  const downRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    document.querySelector('[data-hero-fallback]')?.remove();
  }, []);

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [focused]);

  const onPointerDown = (e: React.PointerEvent) => {
    downRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = downRef.current;
    downRef.current = null;
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved < 6 && performance.now() - d.t < 300) setFocused(true);
  };

  return (
    <>
      <div
        className="absolute inset-0 cursor-zoom-in"
        style={{ touchAction: 'none' }}
        onPointerDownCapture={onPointerDown}
        onPointerUpCapture={onPointerUp}
      >
        <PhoneCanvas base={base} mode="hero" />
      </div>

      {focused && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setFocused(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Atahon screenshots — interactive phone preview"
        >
          <button
            onClick={() => setFocused(false)}
            aria-label="Close preview"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>

          <div className="relative h-[90vh] w-[min(90vw,520px)]">
            <PhoneCanvas base={base} mode="focus" />
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60">
            Drag to rotate · scroll to zoom · Esc to close
          </p>
        </div>
      )}
    </>
  );
}
