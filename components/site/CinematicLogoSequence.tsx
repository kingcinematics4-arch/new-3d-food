'use client';

// components/site/CinematicLogoSequence.tsx
//
// THE DINE3D BRAND SEQUENCE
//
// A scroll-driven cinematic that assembles the supplied logo piece by piece,
// then lifts the cloche to reveal the meal.
//
// SCROLL IS THE ONLY CLOCK
// ------------------------
// There is no `setTimeout`, no autoplay, no loop and no random timing anywhere
// in this file or in the timeline it drives. Every visual value is a pure
// function of one number: this section's scroll progress between 0 and 1.
// Scroll to 0.62 and the cloche hangs exactly 62% of the way down; stop, and it
// stops there. Scroll back up and the sequence runs backwards, because the same
// function is being evaluated at a smaller number rather than being played in
// reverse. All of the arithmetic lives in lib/cinematicTimeline.ts.
//
// DETERMINISM AND COST
// --------------------
// `apply()` writes transforms and opacity straight to the DOM nodes. It never
// calls `setState`, so React does not re-render while the visitor scrolls and
// the work stays confined to compositor-only properties. Frames are coalesced
// into a single `requestAnimationFrame` and the scroll listener is passive, so
// the sequence costs at most one style write per layer per frame, and nothing
// at all while the page is still.
//
// WHY SEPARATE LAYERS
// --------------------
// The logo ships as one flattened PNG. Animating that as a single object would
// be a cross-fade, not a build. scripts/build-logo-layers.js partitions the
// ORIGINAL pixels into seven exact layers, so each component genuinely arrives
// on its own. Rendered together at rest they recompose dine3d-logo.png pixel
// for pixel, which is why the assembled state is the official artwork and not
// an approximation of it.
//
// REDUCED MOTION
// --------------
// Nothing here checks `prefers-reduced-motion` in JavaScript. The stylesheet
// forces every layer to its resting state and collapses the section to one
// screen, so the fallback holds even if this script never runs — the same rules
// cover a visitor with JavaScript disabled. Either way they see the finished
// logo and the page below scrolls normally.

import { useEffect, useRef } from 'react';
import {
  LOGO_FOOD_BOX,
  LOGO_LAYER_BOXES,
  LOGO_LAYER_SRC,
  layerBoxStyle,
  type LogoLayerId,
} from '@/lib/logoLayers';
import {
  ambientOpacity,
  captionFor,
  clamp01,
  ghostFrame,
  hintOpacity,
  layerFrame,
  LAYER_ORDER,
  stageScale,
  wellOpacity,
  type MovingId,
} from '@/lib/cinematicTimeline';

type TrackedId = MovingId | 'ghost' | 'stage' | 'glow' | 'well' | 'hint' | 'rail';

export default function CinematicLogoSequence() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const nodes = useRef<Partial<Record<TrackedId, HTMLElement | null>>>({});

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Measured on mount and on resize rather than inside the loop: reading a
    // box during the animation would force a synchronous layout every frame.
    let travel = 1;
    let origin = 0;

    const measure = () => {
      travel = Math.max(1, section.offsetHeight - window.innerHeight);
      origin = section.getBoundingClientRect().top + window.scrollY;
    };

    let caption = '';

    const apply = (progress: number) => {
      const p = clamp01(progress);

      // The moving pieces of the logo itself.
      for (const id of LAYER_ORDER) {
        const el = nodes.current[id];
        if (!el) continue;
        const frame = layerFrame(id, p);
        el.style.transform = frame.transform;
        el.style.opacity = frame.opacity.toFixed(4);
      }

      // The scene around the logo. Each is a single scalar of scroll progress.
      const stage = nodes.current.stage;
      if (stage) stage.style.transform = `scale(${stageScale(p).toFixed(4)})`;

      const glow = nodes.current.glow;
      if (glow) glow.style.opacity = ambientOpacity(p).toFixed(4);

      const ghost = nodes.current.ghost;
      if (ghost) {
        const g = ghostFrame(p);
        ghost.style.opacity = g.opacity.toFixed(4);
        ghost.style.transform = `translate(-50%, -50%) scale(${g.scale.toFixed(4)})`;
      }

      const well = nodes.current.well;
      if (well) well.style.opacity = wellOpacity(p).toFixed(4);

      const hint = nodes.current.hint;
      if (hint) hint.style.opacity = hintOpacity(p).toFixed(4);

      const rail = nodes.current.rail;
      if (rail) rail.style.transform = `scaleY(${p.toFixed(4)})`;

      const next = captionFor(p);
      if (next !== caption) {
        caption = next;
        const el = section.querySelector<HTMLElement>('[data-cine-caption]');
        if (el) el.textContent = caption;
      }
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        apply((window.scrollY - origin) / travel);
      });
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    apply((window.scrollY - origin) / travel);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const register =
    (id: TrackedId) =>
    (el: HTMLElement | null) => {
      nodes.current[id] = el;
    };

  const layer = (id: LogoLayerId, modifier: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={register(id)}
      className={`d3-cine-layer ${modifier}`}
      src={LOGO_LAYER_SRC[id]}
      alt=""
      width={LOGO_LAYER_BOXES[id].w}
      height={LOGO_LAYER_BOXES[id].h}
      style={layerBoxStyle(LOGO_LAYER_BOXES[id])}
    />
  );

  return (
    <section ref={sectionRef} className="d3-cine" aria-label="Dine3D">
      {/* Without scripting there is nothing to drive the sequence, so the visitor
          is shown the finished logo rather than an empty frame. */}
      <noscript>
        <style>{`.d3-cine-layer{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      <div className="d3-cine__viewport">
        <div className="d3-cine__glow" ref={register('glow')} aria-hidden="true" />

        <div className="d3-cine__ghost" ref={register('ghost')} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_LAYER_SRC.d}
            alt=""
            width={LOGO_LAYER_BOXES.d.w}
            height={LOGO_LAYER_BOXES.d.h}
          />
        </div>

        <div className="d3-cine__stageWrap">
          <div className="d3-cine__stage" ref={register('stage')}>
            {/* The plate's warm interior, raised with the reveal. */}
            <div
              className="d3-cine__well"
              ref={register('well')}
              style={layerBoxStyle(LOGO_FOOD_BOX)}
              aria-hidden="true"
            />

            {layer('dish', 'd3-cine-layer--dish')}
            {layer('utensil', 'd3-cine-layer--utensil')}
            {layer('lid', 'd3-cine-layer--lid')}
            {layer('d', 'd3-cine-layer--d')}
            {layer('typeIne', 'd3-cine-layer--type')}
            {layer('type3d', 'd3-cine-layer--type')}
            {layer('tagline', 'd3-cine-layer--tagline')}

            <div
              ref={register('food')}
              className="d3-cine-layer d3-cine-layer--food"
              style={layerBoxStyle(LOGO_FOOD_BOX)}
              aria-hidden="true"
            >
              <RevealedDish />
            </div>
          </div>
        </div>

        {/* Position in the sequence. A rail rather than a percentage: it tells the
            visitor there is more to come and roughly how much is left. */}
        <div className="d3-cine__rail" aria-hidden="true">
          <span className="d3-cine__railFill" ref={register('rail')} />
          {[0.3, 0.5, 0.7, 0.94].map((at) => (
            <span key={at} className="d3-cine__railTick" style={{ top: `${at * 100}%` }} />
          ))}
        </div>

        <p className="d3-cine__caption" data-cine-caption aria-hidden="true" />

        <div className="d3-cine__hint" ref={register('hint')} aria-hidden="true">
          <span>Scroll</span>
          <svg width="9" height="17" viewBox="0 0 9 17" fill="none">
            <rect
              x="0.75"
              y="0.75"
              width="7.5"
              height="15.5"
              rx="3.75"
              stroke="currentColor"
              strokeOpacity="0.4"
            />
            <path d="M4.5 4v3.6" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   THE MEAL
   Drawn rather than photographed, because the logo ships no food asset and
   substituting an unrelated stock render would change the brand's identity. It
   stays inside the emblem's champagne and gold palette, is lit from the same
   upper-left key light as the artwork, and is deliberately restrained: a warm
   sauce pool, a seared medallion, a garnish and specular highlights. No cartoon
   outlines, no saturated primaries, nothing that reads as clip art.
   ============================================================ */

function RevealedDish() {
  return (
    <svg viewBox="0 0 164 86" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="d3food-well" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#C9B18A" stopOpacity="0.16" />
          <stop offset="72%" stopColor="#8C7A5C" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#3A332A" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="d3food-sauce" cx="42%" cy="36%" r="72%">
          <stop offset="0%" stopColor="#9A6A31" />
          <stop offset="46%" stopColor="#6B451E" />
          <stop offset="100%" stopColor="#2E1C0D" />
        </radialGradient>

        <linearGradient id="d3food-medallion" x1="18%" y1="6%" x2="76%" y2="98%">
          <stop offset="0%" stopColor="#E4CB9C" />
          <stop offset="34%" stopColor="#C09A5E" />
          <stop offset="72%" stopColor="#8A6132" />
          <stop offset="100%" stopColor="#5E3F1D" />
        </linearGradient>

        <linearGradient id="d3food-slice" x1="10%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#D8BE92" />
          <stop offset="55%" stopColor="#A98049" />
          <stop offset="100%" stopColor="#63421F" />
        </linearGradient>

        <linearGradient id="d3food-garnish" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8C9A62" />
          <stop offset="100%" stopColor="#4E5A33" />
        </linearGradient>

        <radialGradient id="d3food-spec" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF6E2" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFF6E2" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The well the plate is holding. Reads as the inside of the dish rather
          than as a solid disc. */}
      <ellipse cx="82" cy="50" rx="76" ry="33" fill="url(#d3food-well)" />

      {/* Sauce. Kept low and wide so the food mounds out of it. */}
      <ellipse cx="82" cy="52" rx="57" ry="23" fill="url(#d3food-sauce)" />
      <ellipse cx="82" cy="47" rx="44" ry="14" fill="#C08A45" opacity="0.16" />

      {/* Seared medallion: the hero form, lit from the upper left. */}
      <g>
        <ellipse
          cx="74"
          cy="41"
          rx="27"
          ry="14.5"
          fill="url(#d3food-medallion)"
          transform="rotate(-7 74 41)"
        />
        <ellipse cx="66" cy="36" rx="12" ry="5" fill="#F2E1BE" opacity="0.34" transform="rotate(-9 66 36)" />
        <path
          d="M52 45c7 7 30 8 44 1"
          fill="none"
          stroke="#3E2711"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>

      {/* Two supporting forms, offset so the plating is not symmetrical. */}
      <ellipse cx="112" cy="52" rx="16" ry="8.5" fill="url(#d3food-slice)" transform="rotate(9 112 52)" />
      <ellipse cx="48" cy="56" rx="12.5" ry="6.5" fill="url(#d3food-slice)" transform="rotate(-13 48 56)" />

      {/* A small pool of finished jus catching the key light. */}
      <ellipse cx="96" cy="60" rx="13" ry="4.5" fill="#B98438" opacity="0.42" />

      {/* Garnish: a few leaves, kept muted so they read as herbs rather than as
          confetti. */}
      <g opacity="0.9">
        <ellipse cx="88" cy="35" rx="5.2" ry="2.1" fill="url(#d3food-garnish)" transform="rotate(-22 88 35)" />
        <ellipse cx="96" cy="39" rx="4.4" ry="1.8" fill="url(#d3food-garnish)" transform="rotate(16 96 39)" />
        <ellipse cx="60" cy="43" rx="4" ry="1.6" fill="url(#d3food-garnish)" transform="rotate(28 60 43)" />
      </g>

      {/* Specular highlights. These are what make the surface read as wet rather
          than as flat vector shapes. */}
      <ellipse cx="63" cy="33" rx="17" ry="5.5" fill="url(#d3food-spec)" opacity="0.5" />
      <ellipse cx="108" cy="48" rx="9" ry="2.8" fill="url(#d3food-spec)" opacity="0.32" />
      <ellipse cx="44" cy="52" rx="7" ry="2.2" fill="url(#d3food-spec)" opacity="0.24" />

      {/* Warm bounce along the near rim of the plate. */}
      <ellipse cx="82" cy="66" rx="58" ry="9" fill="#B08A4A" opacity="0.14" />
    </svg>
  );
}