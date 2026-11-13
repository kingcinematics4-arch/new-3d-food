import type { Metadata } from 'next';
import SeoLandingPage from '@/components/site/SeoLandingPage';
import { getSeoPage } from '@/lib/seoContent';
import { buildPageMetadata } from '@/lib/seo';

const page = getSeoPage('restaurant-management-software');

export const metadata: Metadata = buildPageMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.slug,
});

export default function RestaurantManagementSoftwarePage() {
  return <SeoLandingPage page={page} />;
}