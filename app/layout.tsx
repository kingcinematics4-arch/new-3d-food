import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/authContext';
import { BrandLogoProvider } from '@/components/branding/BrandLogoProvider';
import { getLogoReference } from '@/lib/branding.server';
import { withCacheBust } from '@/lib/branding';
import { getPublicSiteUrl } from '@/lib/siteUrl';

export const runtime = 'nodejs';

/** Social preview card. The same official artwork, on the brand background. */
const OG_IMAGE = '/images/dine3d-og.png';

/** MIME type of an owner-supplied logo, so the tab icon is declared correctly. */
function logoMimeType(url: string): string {
  const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'svg' || extension === 'svg+xml') return 'image/svg+xml';
  return 'image/jpeg';
}

/**
 * Favicons follow the uploaded logo, not the bundled fallback, so a rebrand
 * reaches the browser tab as well as the page.
 *
 * When nothing has been uploaded the bundled `app/icon.png` and
 * `app/apple-icon.png` apply instead: a square container built from the same
 * official mark. Emitting `icons` here would suppress those file conventions,
 * and pointing them at the horizontal wordmark is what made the mark illegible
 * at 16px.
 *
 * `generateMetadata` rather than a static `metadata` export because the icon
 * lives in the database now. When the row or the bucket is missing,
 * `getLogoReference` degrades to the bundled asset rather than failing the
 * build.
 */
export async function generateMetadata(): Promise<Metadata> {
  const logo = await getLogoReference();
  const description =
    'Turn your restaurant menu into an interactive 3D dining experience. Scan a QR code, explore dishes in 3D, and understand your meal before ordering.';

  // Resolves the relative social image and canonical paths. Configured first,
  // and never an untrusted request host.
  const metadataBase = new URL(getPublicSiteUrl());

  return {
    metadataBase,
    title: 'Dine3D — See It. Experience It. Dine It.',
    description,
    keywords:
      'restaurant 3d menu, ar food menu, interactive dining, qr code menu, 3d food visualization, restaurant technology',
    ...(logo.hasCustomLogo
      ? {
          icons: {
            icon: [
              { url: withCacheBust(logo.logoUrl, logo.logoVersion), type: logoMimeType(logo.logoUrl) },
            ],
            shortcut: [
              { url: withCacheBust(logo.logoUrl, logo.logoVersion), type: logoMimeType(logo.logoUrl) },
            ],
          },
        }
      : {}),
    openGraph: {
      title: 'Dine3D — Premium 3D Restaurant Menu Platform',
      description,
      type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Dine3D' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Dine3D — See It. Experience It. Dine It.',
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved once, on the server, so the first painted HTML already contains
  // the correct logo. The provider still revalidates in the browser, which is
  // what covers a page rendered at build time and a logo replaced in another tab.
  const initialLogo = await getLogoReference();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen antialiased" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <AuthProvider>
          <BrandLogoProvider initialLogo={initialLogo}>{children}</BrandLogoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}