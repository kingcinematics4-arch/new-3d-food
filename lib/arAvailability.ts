export type ArPlatform = 'ios' | 'android' | 'other';

export function detectArPlatform(): ArPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports as MacIntel with touch points
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && ((navigator as { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

/** True when this device/platform can use AR with the uploaded format(s). */
export function isArSupportedForDevice(
  platform: ArPlatform,
  glbUrl?: string | null,
  usdzUrl?: string | null
): boolean {
  const glb = Boolean(glbUrl?.trim());
  const usdz = Boolean(usdzUrl?.trim());
  if (platform === 'ios') return usdz;
  if (platform === 'android') return glb;
  // Other/desktop: allow attempt when GLB exists (WebXR-capable browsers may support AR).
  return glb;
}

export function arAvailabilityLabel(
  platform: ArPlatform,
  glbUrl?: string | null,
  usdzUrl?: string | null
): string {
  const glb = Boolean(glbUrl?.trim());
  const usdz = Boolean(usdzUrl?.trim());
  if (platform === 'ios') {
    if (usdz) return 'AR available on this Apple device (Quick Look).';
    if (glb) return 'AR is unavailable on this Apple device because no USDZ model is uploaded. 3D preview is available.';
    return 'AR is unavailable because no compatible AR model is uploaded for this dish.';
  }
  if (platform === 'android') {
    if (glb) return 'AR available on this Android device (Scene Viewer).';
    if (usdz) return 'AR is unavailable on this Android device because no GLB model is uploaded. 3D preview may be limited without GLB.';
    return 'AR is unavailable because no compatible AR model is uploaded for this dish.';
  }
  if (glb) return 'AR may be available in supported browsers/devices (WebXR or Scene Viewer). Device support varies.';
  if (usdz) return 'AR is unavailable on this device because no GLB model is uploaded for it.';
  return 'AR is unavailable because no AR-compatible model is uploaded for this dish.';
}

export function arCapabilityStatus(glbUrl?: string | null, usdzUrl?: string | null) {
  const glb = Boolean(glbUrl?.trim());
  const usdz = Boolean(usdzUrl?.trim());
  return {
    glb,
    usdz,
    androidAr: glb,
    appleAr: usdz,
    anyAr: glb || usdz,
  };
}
