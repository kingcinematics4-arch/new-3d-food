'use client';

// components/site/HeroDishScene.tsx
//
// The hero's 3D product demonstration: a Vada Pav on an ivory plate with two
// fried green chillies, on the landing page's dark background.
//
// WHAT THIS IS NOT
// ----------------
// This is not a mockup of the dashboard, and it does not reuse FoodModelViewer.
// That component loads a restaurant's own GLB and stays untouched for the guest
// menu, the dish modal and the dashboard preview. What belongs on the landing
// page is a finished dish a visitor can turn with a finger, so the offer reads
// in a glance.
//
// CAMERA
// A three-quarter view from about 24 degrees up, the way plated food is
// actually photographed: high enough to read the top of the bun and the seam,
// low enough that the vada and the plate rim both stay in frame. A long-ish 32
// degree lens flattens the perspective the way a macro food lens does; a wide
// one would make the plate look like a stadium.
//
// LIGHT
// Warm key from the upper left — the direction the Dine3D wordmark is lit from
// — with a low neutral fill so the shadow side keeps its detail, and a dim warm
// rim behind to separate the plate from the black background. Nothing else: no
// bloom, no coloured lights, nothing that would make the food glow.
//
// The scene orbits the camera rather than spinning the dish. The lighting
// therefore stays fixed to the food, which is what an orbit viewer should do —
// a rotating light makes every surface read as plastic from some angle.

import React, { Suspense, useEffect, useState, Component, ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Lightformer, Center, useGLTF, useAnimations, Html } from '@react-three/drei';
import { useVadaPavTextures } from './vadaPav/assets';
import { Plate, VadaPav, Chillies, PLATE_SURFACE } from './vadaPav/VadaPavFood';

class ThreeErrorBoundary extends Component<{children: ReactNode, fallback: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode, fallback: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.warn('GLTF load error:', error); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function UploadedModel({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);
  
  useEffect(() => {
    if (animations.length > 0 && actions) {
      const actionName = animations[0].name;
      if (actions[actionName]) actions[actionName].play();
    }
  }, [animations, actions]);
  
  const clonedScene = React.useMemo(() => scene.clone(true), [scene]);

  return (
     <Center
       onCentered={({ container, width, height, depth }) => {
         const maxDim = Math.max(width, height, depth);
         const targetDim = 0.7; // matches roughly the Vada Pav plate size
         if (maxDim > 0) {
           container.scale.setScalar(targetDim / maxDim);
         }
       }}
     >
       <primitive object={clonedScene} />
     </Center>
  );
}

/**
 * The orbit pivots on the slit, which is the visual centre of the food: the pale
 * crumb and the dark vada sit either side of it, and that band is what the eye
 * goes to first.
 */
const FOCUS = new THREE.Vector3(0, 0.12, 0);

/**
 * Frames the dish from its bounding radius rather than from a fixed distance.
 *
 * A hard-coded camera distance is correct on exactly one viewport: on a wider
 * frame the plate crowds the edges, on a narrow phone frame it is cropped. This
 * keeps the viewing angle — the three-quarter elevation set on the Canvas — and
 * moves only the distance, so the whole plate sits inside the frame with a
 * margin at any aspect ratio.
 *
 * The value is the plate's radius plus about 8% of air, so the whole dish sits
 * inside the frame with a margin at any aspect ratio.
 */
const SUBJECT_RADIUS = 0.395;

function FrameTheDish() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const distance = SUBJECT_RADIUS / Math.tan(Math.min(vFov, hFov) / 2);

    // Keep the direction the Canvas configured — that is the three-quarter
    // angle — and change nothing but how far back we stand.
    const direction = camera.position.clone().sub(FOCUS).normalize();
    camera.position.copy(FOCUS).add(direction.multiplyScalar(distance));
    camera.lookAt(FOCUS);
    camera.updateProjectionMatrix();
  }, [camera, width, height, camera.aspect]);

  return null;
}

/**
 * Whether the visitor has asked the system for less movement.
 *
 * Read on the client and subscribed to rather than sampled once: a visitor can
 * flip the setting while the page is open, and the hero should notice. Starts
 * false so the server-rendered markup and the first client frame agree.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** Photographic tone mapping. Reinhard would grey out the highlights. */
function ToneMapping() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [gl]);
  return null;
}

function Presentation({ modelUrl }: { modelUrl?: string | null }) {
  const textures = useVadaPavTextures();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <>
      <FrameTheDish />
      <ToneMapping />

      {/* Key. Warm, high, from the upper left — the only light that shapes the
          food. Shadowed so the vada drops a real shadow into the slit and the
          pav grounds itself on the plate. */}
      <directionalLight
        position={[-1.7, 2.9, 1.9]}
        intensity={2.3}
        color="#FFE9C6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0008}
        shadow-normalBias={0.012}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-0.9}
        shadow-camera-right={0.9}
        shadow-camera-top={0.9}
        shadow-camera-bottom={-0.9}
        shadow-radius={3}
      />

      {/* Fill. Generous enough that the seam between the two halves of the pav still
          reads after the dish has auto-rotated away from the key — a visitor
          must not have to wait for the turn to come back round to see it. Cool
          just enough to keep the shadow side from going muddy. */}
      <directionalLight position={[3.4, 1.6, 2.2]} intensity={0.55} color="#DCE2EA" />

      {/* Rim. Just enough to draw a line of light along the far edge of the
          plate so it separates from the black. */}
      <directionalLight position={[0.6, 1.8, -3.6]} intensity={0.6} color="#F3D9A8" />

      <ambientLight intensity={0.2} color="#C8BCA8" />

      {/*
        A tiny procedural studio, rendered locally by drei. This is what gives
        the glaze its soft reflections and puts a moving highlight on the
        ceramic as the dish turns. Built in-scene rather than downloaded as an
        HDRI, so it costs a 128px cubemap and no network.
      */}
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#0B0B0A']} />
        {/* The soft box the key light is standing in. */}
        <Lightformer form="rect" intensity={2.4} color="#FFF1DA" scale={[6, 4, 1]} position={[-3, 3, 2]} target={[0, 0, 0]} />
        {/* Dim bounce from the opposite side. */}
        <Lightformer form="rect" intensity={0.7} color="#B9C4D2" scale={[5, 3, 1]} position={[3.5, 1.4, 1.6]} target={[0, 0, 0]} />
        {/* Warm strip behind, matching the rim light. */}
        <Lightformer form="rect" intensity={0.9} color="#E8C286" scale={[4, 1.4, 1]} position={[0, 1.4, -3.4]} target={[0, 0, 0]} />
      </Environment>

      <Suspense fallback={
        <Html center>
          <div className="flex flex-col items-center justify-center space-y-3" style={{ color: 'var(--text-dimmed)' }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '1px solid rgba(201,169,110,0.2)',
                borderTopColor: 'var(--gold)',
                animation: 'spin 1.1s linear infinite',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Loading 3D
            </span>
          </div>
        </Html>
      }>
        <ThreeErrorBoundary fallback={
          <Html center>
            <div style={{ color: '#ff6b6b', fontSize: '0.8rem', background: 'rgba(20,20,20,0.8)', padding: '8px 12px', borderRadius: '6px' }}>
              Failed to load 3D model
            </div>
          </Html>
        }>
          <group rotation={[0, -0.12, 0]}>
            {modelUrl ? (
              <UploadedModel url={modelUrl} />
            ) : (
              <>
                <Plate textures={textures} />
                <VadaPav textures={textures} />
                <Chillies textures={textures} />
              </>
            )}
          </group>
        </ThreeErrorBoundary>
      </Suspense>

      {/*
        Contact occlusion. The single biggest thing separating a rendered plate
        from a photograph is that things touch the surface they sit on. One
        frame is enough: the dish itself never moves, only the camera does.

        Two details here were wrong for a while and both are load-bearing. The
        plane has to sit just ABOVE the plate's well, not below it — under the
        ceramic the shadow is occluded by the plate itself, so the food appeared
        to float on a clean dish with no shadow at all. And its scale has to
        match the plate rather than exceed it: a plane wider than the dish puts
        its semi-transparent dark falloff out in empty space, where it reads as
        a grey halo hanging around the plate against the transparent background.
        The silhouette probe caught the second one as an inflated bounding box.
      */}
      <ContactShadows
        position={[0, PLATE_SURFACE + 0.0015, 0]}
        opacity={0.62}
        scale={0.78}
        blur={1.6}
        far={0.3}
        resolution={512}
        frames={1}
        color="#000000"
      />

      <OrbitControls
        makeDefault
        target={FOCUS}
        enablePan={false}
        enableZoom
        // The slow turn is what shows a visitor the dish is a model and not a
        // photograph. Reduced motion drops it, but the drag and pinch stay: they
        // are direct responses to the visitor's own hand, not unrequested
        // animation.
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.75}
        minDistance={0.95}
        maxDistance={2.8}
        // Kept low and narrow on purpose. A pav is only 45% as tall as it is
        // wide, so a steep look-down flattens the slit out of view entirely and
        // leaves a pale oval of bread — the worst possible read. Holding the
        // visitor near the horizon keeps the vada visible at every angle.
        minPolarAngle={0.78}
        maxPolarAngle={1.5}
        dampingFactor={0.06}
        enableDamping
      />
    </>
  );
}

export default function HeroDishScene({ modelUrl }: { modelUrl?: string | null }) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      // A low three-quarter, only a little above the level of the slit.
      //
      // This angle is doing real work rather than being a default. A pav is a
      // flat roll, so looking down on it shows mostly the pale top of the bread
      // and hides the vada inside — and a featureless pale dome is exactly what a
      // hamburger bun looks like. Staying near the slit keeps the dark vada
      // visible along the front, with bread framing it above and below.
      camera={{ position: [0.5, 0.36, 1.28], fov: 32, near: 0.05, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // The page behind is black; a transparent canvas keeps the hero's own
      // gradient rather than stacking a lighter rectangle over it.
      style={{ background: 'transparent' }}
    >
      <Presentation modelUrl={modelUrl} />
    </Canvas>
  );
}

export { PLATE_SURFACE };