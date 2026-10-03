'use client';

// components/site/HeroViewer.tsx
//
// Client-only wrapper around the WebGL 3D viewer.
//
// Isolated in its own client component so the surrounding hero can stay a
// Server Component. `ssr: false` is required because react-three-fiber touches
// WebGL during render.

import dynamic from 'next/dynamic';

const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), { ssr: false });

export default function HeroViewer({ height = 420 }: { height?: number }) {
  return (
    <div style={{ height }}>
      <FoodModelViewer className="h-full w-full" />
    </div>
  );
}