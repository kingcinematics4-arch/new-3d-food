'use client';

// components/site/HeroDishScene.tsx
//
// The hero's 3D dish demonstration.
//
// This is NOT the product's dish viewer. A restaurant's own GLB is loaded by
// FoodModelViewer on the guest menu and in the dashboard, and that component is
// left exactly as it was. What belongs on the landing page is a single finished
// plate that a visitor can turn with a finger, so the offer reads in one glance:
// this is what a guest sees on their phone before they order.
//
// It is therefore drawn from geometry rather than loaded from a file. Nothing on
// screen is a mockup of the dashboard, there is no toolbar, no status line and no
// caption explaining a control — the dish itself is the demonstration. Orbit,
// zoom and a slow idle turn are left enabled because that is how the product is
// used, not because they need announcing.
//
// Isolated in its own client component so the hero can stay a Server Component,
// and dynamically imported with `ssr: false` by HeroViewer because
// react-three-fiber touches WebGL during render.

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/* ============================================================
   THE PLATE
   Built to be recognisable in silhouette from across a room: a
   wide shallow coupe, a sauce pooled off-centre, one seared main
   item raised above it, two supporting slices and a little garnish.
   Asymmetric on purpose — a symmetrical arrangement reads as a
   product render, not as food someone plated.
   ============================================================ */

/** Shallow coupe: a wide rim that turns down into a small foot. */
function Plate() {
  return (
    <group>
      {/* Rim, built as a lathe so the profile curves rather than steps. */}
      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.62, 1.34, 0.05, 72, 1, false]} />
        <meshStandardMaterial color="#1A1815" roughness={0.42} metalness={0.18} />
      </mesh>

      {/* The shallow well the food sits in. */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.33, 1.18, 0.03, 72]} />
        <meshStandardMaterial color="#15130F" roughness={0.55} metalness={0.12} />
      </mesh>

      {/* Champagne hairline along the rim. The only bright edge on the plate. */}
      <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.012, 10, 96]} />
        <meshStandardMaterial color="#B8A47A" roughness={0.32} metalness={0.75} />
      </mesh>

      {/* Foot. Barely visible, but the plate reads as lifted rather than painted on. */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.52, 0.46, 0.09, 48]} />
        <meshStandardMaterial color="#141210" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** Sauce pooled low and wide so the food mounds out of it. */
function Sauce() {
  return (
    <mesh position={[-0.12, 0.075, 0.06]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]}>
      <circleGeometry args={[1.02, 64]} />
      <meshStandardMaterial color="#5C3A1A" roughness={0.38} metalness={0.05} />
    </mesh>
  );
}

/** The hero form: a thick medallion, seared dark on the underside. */
function Main() {
  return (
    <group position={[0.06, 0.16, -0.02]} rotation={[0, 0.22, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.55, 0.19, 56]} />
        <meshStandardMaterial color="#A9773C" roughness={0.52} metalness={0.08} />
      </mesh>

      {/* Seared face. Slightly domed so the light moves across it as it turns. */}
      <mesh castShadow position={[0, 0.1, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[0.56, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#C4913F" roughness={0.46} metalness={0.1} />
      </mesh>

      {/* Glaze, kept to the near edge so the top stays matte and carved. */}
      <mesh position={[0, 0.055, 0.34]} scale={[1, 0.34, 0.7]}>
        <sphereGeometry args={[0.5, 32, 16]} />
        <meshStandardMaterial color="#7A4E1E" roughness={0.3} metalness={0.16} />
      </mesh>
    </group>
  );
}

/** Two supporting slices, offset so the plating is not symmetrical. */
function Slices() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0.66, 0.11, 0.2]} rotation={[0.1, 0.4, 0.14]}>
        <cylinderGeometry args={[0.4, 0.38, 0.13, 48]} />
        <meshStandardMaterial color="#B98A48" roughness={0.58} metalness={0.06} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.58, 0.1, 0.34]} rotation={[0.08, -0.3, -0.1]}>
        <cylinderGeometry args={[0.32, 0.3, 0.11, 40]} />
        <meshStandardMaterial color="#8E6531" roughness={0.6} metalness={0.06} />
      </mesh>
    </group>
  );
}

/** A few leaves. Muted, so they read as herbs rather than as confetti. */
function Garnish() {
  const leaves: Array<[number, number, number, number]> = [
    [-0.02, 0.3, 0.14, -0.5],
    [0.3, 0.28, 0.26, 0.42],
    [-0.26, 0.26, 0.3, 0.7],
    [0.44, 0.16, 0.5, -0.2],
  ];

  return (
    <group>
      {leaves.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.1, r, 0.25]} scale={[1, 0.22, 0.5]}>
          <sphereGeometry args={[0.11, 20, 12]} />
          <meshStandardMaterial color={i % 2 ? '#6E7A48' : '#56613A'} roughness={0.72} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function Dish() {
  return (
    <group position={[0, -0.18, 0]}>
      <Plate />
      <Sauce />
      <Slices />
      <Main />
      <Garnish />
    </group>
  );
}

export default function HeroDishScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.55, 3.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* A single warm key from the upper left, the direction the Dine3D
          artwork is lit from, with a dim champagne fill so the far side of the
          plate does not fall into black. No coloured light: nothing here
          competes with the page's palette. */}
      <ambientLight intensity={0.42} />
      <directionalLight position={[-3.4, 4.6, 3.2]} intensity={1.5} color="#FFF3DC" castShadow />
      <directionalLight position={[3.6, 2.2, -3]} intensity={0.34} color="#C9A96E" />

      <Suspense fallback={null}>
        <Dish />
      </Suspense>

      {/* The same controls a guest has. Enabled, never explained. */}
      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={2.2}
        maxDistance={6}
      />
    </Canvas>
  );
}