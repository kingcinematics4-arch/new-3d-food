'use client';

// components/Dine3DLogo.tsx
//
// THE SINGLE SOURCE OF TRUTH FOR THE DINE3D LOGO.
//
// Every logo surface in the app renders through this component, so replacing the
// logo updates the entire product at once. There are no duplicate logos and no
// inline redrawn SVG marks anywhere.
//
// THE ASSET COMES FROM THE DATABASE
// --------------------------------
// The file is uploaded by the owner in admin -> Branding and stored in Supabase
// Storage. The current reference lives in `BrandLogoProvider`, which is mounted
// once in the root layout, so the header, footer, auth screens, admin panel,
// dashboard and guest menu all follow one uploaded file. Nothing here is
// hardcoded to a path any more.
//
// `public/images/dine3d-logo.jpg` remains the FALLBACK: it is what renders
// before anything has been uploaded, and what "Remove Logo" reverts to, so the
// site is never left without a logo.
//
// DESIGN RULES ENFORCED HERE
// --------------------------
// 1. The asset is used as supplied. It is never redrawn, recreated or
//    substituted.
// 2. Aspect ratio is never modified. The REAL pixel dimensions of the current
//    file are handed to next/image so the browser reserves the correct box
//    before the image loads, and the rendered size is constrained with
//    max-width/max-height only. `width` and `height` are never both forced, so
//    the image can never be stretched or squashed. This holds for an uploaded
//    logo of any shape, not just the fallback's.
// 3. The fallback asset is an opaque JPEG with a baked-in near-black background
//    and a gold mark, so it is always placed on a dark surface where that
//    background blends into the page. It is never dropped onto a light
//    background, which would show a black rectangle.
// 4. Sharpness: the intrinsic size is declared large and the image is downscaled
//    by the browser / Next image optimiser, so it stays crisp on both desktop and
//    mobile. `priority` is opt-in for above-the-fold use.

import Image from 'next/image';
import Link from 'next/link';
import { useBrandLogo } from '@/components/branding/BrandLogoProvider';
import { FALLBACK_LOGO_REFERENCE, withCacheBust } from '@/lib/branding';

/**
 * The logo shipped with the repo. Used as the fallback everywhere, and as the
 * default when this component is rendered outside a BrandLogoProvider.
 */
export const LOGO_SRC = FALLBACK_LOGO_REFERENCE.logoUrl;

/** Real intrinsic dimensions of the fallback asset. Never distort away from these. */
export const LOGO_INTRINSIC = {
  width: FALLBACK_LOGO_REFERENCE.logoWidth,
  height: FALLBACK_LOGO_REFERENCE.logoHeight,
};

export type Dine3DLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Rendered bounding boxes. The image is fitted inside these with its aspect
 * ratio intact, so a box that does not match the asset simply leaves margin
 * rather than stretching the artwork.
 */
const SIZES: Record<Dine3DLogoSize, { maxWidth: number; maxHeight: number }> = {
  xs: { maxWidth: 46, maxHeight: 24 },
  sm: { maxWidth: 108, maxHeight: 34 },
  md: { maxWidth: 148, maxHeight: 46 },
  lg: { maxWidth: 196, maxHeight: 60 },
  xl: { maxWidth: 264, maxHeight: 80 },
};

interface Dine3DLogoProps {
  size?: Dine3DLogoSize;
  /** Wraps the logo in a link. Pass null to render a bare image. */
  href?: string | null;
  alt?: string;
  /** Above-the-fold logos should set this to avoid a layout shift. */
  priority?: boolean;
  className?: string;

  /**
   * Overrides the database reference. Used only by the admin uploader to
   * preview a file the owner has chosen but not yet saved, so the preview is
   * pixel-identical to what the site will render.
   */
  previewSrc?: string | null;
  /** Intrinsic size of `previewSrc`, so the preview reserves the right box too. */
  previewWidth?: number;
  previewHeight?: number;
}

export default function Dine3DLogo({
  size = 'md',
  href = '/',
  alt,
  priority = false,
  className = '',
  previewSrc = null,
  previewWidth,
  previewHeight,
}: Dine3DLogoProps) {
  const { logo } = useBrandLogo();
  const box = SIZES[size];

  const isPreviewing = Boolean(previewSrc);
  const source = isPreviewing ? (previewSrc as string) : logo.logoUrl;
  const version = isPreviewing ? null : logo.logoVersion;

  const width =
    (isPreviewing ? previewWidth : logo.logoWidth) || FALLBACK_LOGO_REFERENCE.logoWidth;
  const height =
    (isPreviewing ? previewHeight : logo.logoHeight) || FALLBACK_LOGO_REFERENCE.logoHeight;

  const image = (
    <Image
      src={withCacheBust(source, version)}
      alt={alt ?? logo.logoAlt}
      width={width}
      height={height}
      priority={priority}
      className={`object-contain object-left ${className}`}
      style={{
        width: 'auto',
        height: 'auto',
        maxWidth: `${box.maxWidth}px`,
        maxHeight: `${box.maxHeight}px`,
      }}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex items-center" style={{ textDecoration: 'none' }}>
      {image}
    </Link>
  );
}