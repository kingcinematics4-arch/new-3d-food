'use client';

// components/site/HeroViewer.tsx
//
// Client-only entry point for the hero's 3D dish demonstration.
//
// The scene itself lives in HeroDishScene, which is loaded dynamically with
// `ssr: false` because react-three-fiber touches WebGL during render and has no
// server-side equivalent. Isolating that here keeps the rest of the hero free to
// be a normal component.

import dynamic from 'next/dynamic';

const HeroDishScene = dynamic(() => import('./HeroDishScene'), { ssr: false });

export default function HeroViewer() {
  return <HeroDishScene />;
}