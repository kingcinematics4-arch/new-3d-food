'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import BottomNav from '@/components/nav/BottomNav';

const EndlessRunner = dynamic(() => import('@/components/games/EndlessRunner'), { ssr: false });
const BlockBlast = dynamic(() => import('@/components/games/BlockBlast'), { ssr: false });
const BubbleShooter = dynamic(() => import('@/components/games/BubbleShooter'), { ssr: false });
const TrafficRacer = dynamic(() => import('@/components/games/TrafficRacer'), { ssr: false });

export default function GameRoutePage({ params }: { params: { game: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug') || '';
  const table = searchParams.get('table') || '';
  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}${table ? `?table=${encodeURIComponent(table)}` : ''}` : '/';
  const gamesListHref = slug ? `/games?slug=${encodeURIComponent(slug)}${table ? `&table=${encodeURIComponent(table)}` : ''}` : '/games';
  const [activeTab, setActiveTab] = useState('Games');

  const map: Record<string, JSX.Element> = {
    'endless-runner': <EndlessRunner backHref={gamesListHref} />,
    'block-blast': <BlockBlast backHref={gamesListHref} />,
    'bubble-shooter': <BubbleShooter backHref={gamesListHref} />,
    'traffic-racer': <TrafficRacer backHref={gamesListHref} />,
  };

  const node = map[params.game];
  if (!node) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0A] text-[#F3EFE7] p-6">
        <div className="text-center">
          <p className="text-white/60 mb-4">Game not found.</p>
          <button type="button" onClick={() => router.push(gamesListHref)} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-sm">Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {node}
      <BottomNav
        activeTab={activeTab}
        cartCount={0}
        menuSlug={slug || null}
        tableNumber={table || null}
        onTabChange={setActiveTab}
      />
    </>
  );
}
