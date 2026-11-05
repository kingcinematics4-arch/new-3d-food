import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// The dashboard header previously rendered a "LIVE" badge next to the
// "View Menu" button. This test verifies the badge is gone while the
// button and all live-order functionality remain intact.

test('dashboard header LIVE badge removed', () => {
  const src = readFileSync(resolve('app/dashboard/layout.tsx'), 'utf-8');

  // Split the file into the header section and the sidebar section so
  // we can assert on the header independently. The sidebar "Live
  // Orders" nav item intentionally keeps its indicator.
  const headerMarker = '{/* Right — Actions */}';
  const headerIdx = src.indexOf(headerMarker);
  expect(headerIdx).toBeGreaterThan(-1);
  const header = src.slice(headerIdx);

  // The header must NOT contain the LIVE badge markup.
  expect(header).not.toContain('d3-live-dot');
  expect(header).not.toMatch(/<span className="d3-badge d3-badge-gold">/);

  // The View Menu button must still be present in the header.
  expect(header).toContain('View Menu');
  expect(header).toContain('d3-btn-ghost');

  // The sidebar "Live Orders" nav item must remain so live order
  // tracking is unaffected.
  expect(src).toContain("item.label === 'Live Orders'");
});

test('globals.css still defines the badge/dot classes', () => {
  // The CSS classes are still defined so other consumers (e.g. the
  // sidebar "Live Orders" nav indicator) keep working.
  const css = readFileSync(resolve('app/globals.css'), 'utf-8');
  expect(css).toContain('.d3-live-dot');
  expect(css).toContain('.d3-badge-gold');
});