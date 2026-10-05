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
// site is never left without a logo.
//
// THE UPLOADED FILE IS NEVER TOUCHED
// ----------------------------------
// Owners upload real artwork, and real logo files arrive on a large empty
// canvas — the shipped 667x655 export carries its 289x234 mark inside ~30%
// padding on every side, which is only 15% of the picture. Displayed as a whole
// file that mark renders 24x19 pixels in a 55x54 box: present, technically
// correct, and far too small to read.
//
// So this component measures where the logo actually is inside the file
// (lib/logoContentBox.ts) and presents THAT rectangle. The stored bytes are
// read-only throughout: no crop is written back, no derived asset is generated,
// and the original file in Supabase Storage is exactly as the owner left it.
//
// DESIGN RULES ENFORCED HERE
// --------------------------
// 1. The asset is used as supplied. It is never redrawn, recreated or
//    substituted.
// 2. Aspect ratio is never modified. Two separate guarantees:
//      - uncropped, the image is laid out by height alone and `width: auto`
//        lets the artwork's own ratio follow, so it can never be stretched;
//      - cropped, the frame is given the detected box's own ratio and the image
//        is positioned inside it with a single uniform scale (the percentage
//        width and height are both derived from the same box, so the scale on x
//        and y is identical by construction). Nothing is ever squashed, for an
//        uploaded logo of any shape.
// 3. The frame is sized to the space the surface allows on whichever axis runs
//    out first, so a wide mark uses the full width allowance and a tall mark the
//    full height. The logo now occupies its allowance instead of a fraction of
//    it.
// 4. Rendered size is expressed as a CSS custom property on the wrapper, never
//    as an inline pixel value. That is what allows a surface to override it
//    responsively — the navbar logo shrinks on small screens — without this
//    component knowing anything about viewports.
// 5. Measuring is progressive. Until the bounds are known, and forever after if
//    they cannot be known, this renders exactly the plain uncropped logo it
//    always did. A logo that is briefly the wrong size beats a page that cannot
//    render one.
// 6. Sharpness: the intrinsic size is declared large and the image is downscaled
//    by the browser / Next image optimiser, so it stays crisp on both desktop and
//    mobile. `priority` is opt-in for above-the-fold use.

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBrandLogo } from '@/components/branding/BrandLogoProvider';
import { FALLBACK_LOGO_REFERENCE, withCacheBust } from '@/lib/branding';
import { measureLogoContentBox, type LogoContentBox } from '@/lib/logoContentBox';

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

  const resolvedSrc = withCacheBust(source, version);

  /**
   * Where the visible logo sits inside the file, or null while unknown and
   * whenever it cannot be determined. Every surface on the page shares one
   * measurement per URL, so this is a single canvas read no matter how many
   * logos are on screen.
   */
  const [box, setBox] = useState<LogoContentBox | null>(null);

  useEffect(() => {
    let live = true;
    void measureLogoContentBox(resolvedSrc).then((measured) => {
      if (live) setBox(measured);
    });
    return () => {
      live = false;
    };
  }, [resolvedSrc]);

  const image = (
    <Image
      src={resolvedSrc}
      alt={alt ?? logo.logoAlt}
      width={width}
      height={height}
      priority={priority}
      className={`d3-logo__img${box ? ' d3-logo__img--cropped' : ''}`}
      style={box ? croppedStyle(box) : undefined}
    />
  );

  // The frame is what actually occupies the logo's allowance. Uncropped it is
  // just the image's own box; cropped it becomes the crop window the mark is
  // displayed through, so the padding around the mark is never shown.
  const frame = (
    <span
      className="d3-logo__frame"
      style={box ? ({ '--d3-logo-ar': box.width / box.height } as CSSProperties) : undefined}
    >
      {image}
    </span>
  );

  const classes = `d3-logo ${sizeClass}${className ? ` ${className}` : ''}`;

  if (!href) {
    return <span className={classes}>{frame}</span>;
  }

  return (
    <Link href={href} className={classes}>
      {frame}
    </Link>
  );
}

/**
 * Positions the whole, untouched file so that the detected content box lands
 * exactly on the frame, which is itself the size of that same box.
 *
 * The frame is `box.width` wide and `box.height` tall in the logo's own units,
 * so the percentages below place a uniformly scaled copy of the source image
 * behind it:
 *
 *   scaleX = (naturalWidth  / box.width)  x (box.width / box.width) = 1:1
 *   scaleY = (naturalHeight / box.height) x (box.height / box.height) = 1:1
 *
 * Both axes resolve to the same factor, which is what guarantees the mark is
 * displayed undistorted however padded or oddly proportioned the source file is.
 */
function croppedStyle(box: LogoContentBox): CSSProperties {
  return {
    width: `${(100 * box.width + box.x) / box.width}%`,
    height: `${(100 * box.height + box.y) / box.height}%`,
    left: `${(-100 * box.x) / box.width}%`,
    top: `${(-100 * box.y) / box.height}%`,
  };
}
