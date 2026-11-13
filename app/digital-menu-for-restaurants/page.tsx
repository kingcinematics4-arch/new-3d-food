import type { Metadata } from 'next';
import SeoLandingPage from '@/components/site/SeoLandingPage';
import { getSeoPage } from '@/lib/seoContent';
import { buildPageMetadata } from '@/lib/seo';

const page = getSeoPage('digital-menu-for-restaurants');

export const metadata: Metadata = buildPageMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.slug,
});

export default function DigitalMenuForRestaurantsPage() {
  return <SeoLandingPage page={page} />;
}