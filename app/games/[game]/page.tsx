'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const EndlessRunner = dynamic(() => import('@/components/games/EndlessRunner'), { ssr: false });
const BlockBlast = dynamic(() => import('@/components/games/BlockBlast'), { ssr: false });
const BubbleShooter = dynamic(() => import('@/components/games/BubbleShooter'), { ssr: false });
const TrafficRacer = dynamic(() => import('@/components/games/TrafficRacer'), { ssr: false });

export default function GameRoutePage({ params }: { params: { game: string } }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const table = searchParams.get('table') || '';
  const backHref = `/games${slug ? `?slug=${encodeURIComponent(slug)}${table ? `&table=${encodeURIComponent(table)}` : ''}` : ''}`;

  const map: Record<string, JSX.Element> = {
    'endless-runner': <EndlessRunner backHref={backHref} />,
    'block-blast': <BlockBlast backHref={backHref} />,
    'bubble-shooter': <BubbleShooter backHref={backHref} />,
    'traffic-racer': <TrafficRacer backHref={backHref} />,
  };

  const node = map[params.game];
  if (!node) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0A] text-[#F3EFE7] p-6">
        <div className="text-center">
          <p className="text-white/60 mb-4">Game not found.</p>
          <a href={backHref} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-sm">Back to Arcade</a>
        </div>
      </div>
    );
  }
  return node;
}
