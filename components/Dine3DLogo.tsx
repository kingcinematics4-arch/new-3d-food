// components/Dine3DLogo.tsx
//
// THE SINGLE SOURCE OF TRUTH FOR THE DINE3D LOGO.
//
// Every logo surface in the app renders through this component, so replacing
// the asset file updates the entire product at once. There are no duplicate
// logos and no inline redrawn SVG marks anywhere.
//
// DESIGN RULES ENFORCED HERE
// --------------------------
// 1. The asset is used as supplied. It is never redrawn, recreated or
//    substituted.
// 2. Aspect ratio is never modified. The real pixel dimensions are handed to
//    next/image so the browser reserves the correct box, and the rendered size
//    is constrained with max-width/max-height only. `width` and `height` are
//    never both forced, so the image can never be stretched or squashed.
// 3. The asset is an opaque JPEG with a baked-in near-black background and a
//    gold mark, so it is always placed on a dark surface where that background
//    blends into the page. It is never dropped onto a light background, which
//    would show a black rectangle.
// 4. Sharpness: the intrinsic size is declared large (1376x768) and the image is
//    downscaled by the browser / Next image optimiser, so it stays crisp on
//    both desktop and mobile. `priority` is opt-in for above-the-fold use.

import Image from 'next/image';
import Link from 'next/link';

/**
 * Path to the official logo asset.
 * Change the file at this path (or this one constant) to rebrand everywhere.
 */
export const LOGO_SRC = '/images/dine3d-logo.jpg';

/** Real intrinsic dimensions of the asset above. Never distort away from these. */
const LOGO_WIDTH = 1376;
const LOGO_HEIGHT = 768;

/** Exported so a custom owner-supplied logo is also sized without distortion. */
export const LOGO_INTRINSIC = { width: LOGO_WIDTH, height: LOGO_HEIGHT };

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
}

export default function Dine3DLogo({
  size = 'md',
  href = '/',
  alt = 'Dine3D',
  priority = false,
  className = '',
}: Dine3DLogoProps) {
  const box = SIZES[size];

  const image = (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
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