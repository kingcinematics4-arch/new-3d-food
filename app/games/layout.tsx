import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Games | DinePixel',
  description:
    'Play quick browser games from DinePixel. A small set of 3D games for guests while they explore the restaurant experience.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function GamesLayout({ children }: { children: ReactNode }) {
  return children;
}