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
// `public/images/dine3d-logo.png` remains the FALLBACK: it is what renders
// before anything has been uploaded, and what "Remove Logo" reverts to, so the
// site is never left without a logo. That file is the official artwork cropped
// to its own content on a transparent background, so it sits directly on the
// page with no black box and no dead margin around it.
//
// DESIGN RULES ENFORCED HERE
// --------------------------
// 1. The asset is used as supplied. It is never redrawn, recreated or
//    substituted.
// 2. Aspect ratio is never modified. The REAL pixel dimensions of the current
//    file are handed to next/image so the browser reserves the correct box
//    before the image loads, and the rendered size is driven entirely by CSS:
//    one dimension is fixed and `width: auto` lets the other follow the
//    artwork's own ratio. `height` and `width` are therefore never both
//    forced, so the image can never be stretched or squashed. This holds for an
//    uploaded logo of any shape, not just the fallback's.
// 3. Rendered size is expressed as a CSS custom property (`--d3-logo-h`) on the
//    wrapper, never as an inline pixel value. That is what allows a surface to
//    override it responsively — the navbar logo, for instance, shrinks on small
//    screens — without this component knowing anything about viewports.
// 4. The fallback is transparent, so it is safe on any surface. It is still
//    kept on the dark palette where it was designed to sit, because that is
//    where its champagne and cream artwork was chosen for.
// 5. Sharpness: the intrinsic size is declared large and the image is downscaled
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
  const sizeClass = `d3-logo--${size}`;

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
      className="d3-logo__img"
    />
  );

  const classes = `d3-logo ${sizeClass}${className ? ` ${className}` : ''}`;

  if (!href) {
    return <span className={classes}>{image}</span>;
  }

  return (
    <Link href={href} className={classes}>
      {image}
    </Link>
  );
}