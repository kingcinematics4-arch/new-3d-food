import type { Metadata } from 'next';
import SeoLandingPage from '@/components/site/SeoLandingPage';
import { getSeoPage } from '@/lib/seoContent';
import { buildPageMetadata } from '@/lib/seo';

const page = getSeoPage('qr-ordering-system-navi-mumbai');

export const metadata: Metadata = buildPageMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.slug,
});

export default function QrOrderingSystemNaviMumbaiPage() {
  return <SeoLandingPage page={page} />;
}