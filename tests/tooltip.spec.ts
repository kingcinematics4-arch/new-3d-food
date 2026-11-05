import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Verify the Revenue & Order Volume tooltip renders a three-column
// layout (colour dot | label | right-aligned value) with enough
// width and vertical spacing, and never clips or overflows the
// chart boundary.

test('tooltip uses three-column layout with min-width', () => {
  const src = readFileSync(resolve('app/dashboard/analytics/page.tsx'), 'utf-8');

  // Three-column grid layout per row.
  expect(src).toContain('grid-template-columns:8px 1fr auto');

  // Min-width on the tooltip wrapper so the longest label fits.
  expect(src).toContain('min-width:180px');
  expect(src).toContain('max-width:240px');

  // Right padding on the wrapper so values never touch the edge.
  expect(src).toContain('padding:8px 12px');

  // Consistent vertical spacing between all three rows.
  expect(src).toContain('padding:4px 0');

  // The label column must be able to shrink without pushing the value
  // off the right edge.
  expect(src).toContain('min-width:0');

  // Values stay on one line and are right-aligned.
  expect(src).toContain('text-align:right');
  expect(src).toContain('white-space:nowrap');

  // Revenue must still render with the ₹ symbol and INR grouping.
  expect(src).toContain("name === 'Revenue'");
  expect(src).toContain("toLocaleString('en-IN'");
  expect(src).toContain('₹');

  // Order counts must never carry a currency symbol.
  expect(src).toContain('order');
  expect(src).not.toMatch(/₹.*order/);
});

test('tooltip formatter is per-metric and positioning is responsive', () => {
  const src = readFileSync(resolve('app/dashboard/analytics/page.tsx'), 'utf-8');

  // The custom tooltip inspects the series name at each data point,
  // so Revenue uses the INR formatter and counts use the plain
  // integer formatter.
  expect(src).toContain("seriesNames[si] || ''");
  expect(src).toContain('seriesColors[si]');
  expect(src).toContain('dataPointIndex');

  // Responsive positioning: flips left when overflowing right, and
  // clamps inside the chart container for narrow/mobile screens.
  expect(src).toContain("querySelector('.apexcharts-tooltip')");
  expect(src).toContain("querySelector('.apexcharts-inner')");
  expect(src).toContain('wrap.style.left');
  expect(src).toContain('w2.width - 18'); // flip left of point
  expect(src).toContain('cRect.width - w2.width'); // clamp inside container
  expect(src).toContain('MutationObserver');
});