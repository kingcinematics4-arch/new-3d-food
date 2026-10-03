import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/authContext';
import { BrandLogoProvider } from '@/components/branding/BrandLogoProvider';
import { getLogoReference } from '@/lib/branding.server';
import { FALLBACK_LOGO_REFERENCE, withCacheBust } from '@/lib/branding';

export const runtime = 'nodejs';

/**
 * Favicons follow the uploaded logo, not the bundled fallback, so a rebrand
 * reaches the browser tab as well as the page.
 *
 * `generateMetadata` rather than a static `metadata` export because the icon
 * lives in the database now. When the row or the bucket is missing,
 * `getLogoReference` degrades to the bundled asset rather than failing the
 * build, and the static entry below is what applies in that case.
 */
export async function generateMetadata(): Promise<Metadata> {
  const logo = await getLogoReference();

  const icon = withCacheBust(logo.logoUrl, logo.logoVersion);

  // A favicon must be square-ish; the full wordmark is wrong at 16px, so the
  // bundled logo is used unless the owner has pointed at something else.
  const iconUrl = logo.hasCustomLogo ? icon : FALLBACK_LOGO_REFERENCE.logoUrl;

  return {
    title: 'Dine3D — See It. Experience It. Dine It.',
    description:
      'Turn your restaurant menu into an interactive 3D dining experience. Scan a QR code, explore dishes in 3D, and understand your meal before ordering.',
    keywords:
      'restaurant 3d menu, ar food menu, interactive dining, qr code menu, 3d food visualization, restaurant technology',
    icons: {
      icon: [{ url: iconUrl, type: 'image/jpeg' }],
      shortcut: [{ url: iconUrl, type: 'image/jpeg' }],
      apple: [{ url: iconUrl, type: 'image/jpeg' }],
    },
    openGraph: {
      title: 'Dine3D — Premium 3D Restaurant Menu Platform',
      description: 'Turn your restaurant menu into an interactive 3D dining experience.',
      type: 'website',
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