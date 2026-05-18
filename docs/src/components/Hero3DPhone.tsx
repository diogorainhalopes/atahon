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

export default function Hero3DPhone({ base = '' }: { base?: string }) {
  useEffect(() => {
    document.querySelector('[data-hero-fallback]')?.remove();
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.7], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-2, -1, 2]} intensity={0.25} />
      <Suspense fallback={null}>
        <PresentationControls
          global={true}
          cursor
          snap={false}
          speed={1}
          rotation={[0.18, 0, 0]}
          polar={[-0.35, 0.35]}
          azimuth={[-Math.PI / 2.2, Math.PI / 2.2]}
        >
          <AutoSpinGroup>
            <Phone base={base} />
          </AutoSpinGroup>
        </PresentationControls>
      </Suspense>
    </Canvas>
  );
}
