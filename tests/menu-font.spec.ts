import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// The main dashboard stat cards render their numerical values with
// the `.d3-figure` class, which uses Inter / system-ui sans-serif
// (weight 600). The Menu Management page previously rendered its
// at-a-glance numbers in `var(--font-display)` (Cormorant Garamond
// serif), which looked inconsistent. This test verifies the menu
// page numbers now use the same `.d3-figure` class as the dashboard.

test('menu page numbers use d3-figure class', () => {
  const src = readFileSync(resolve('app/dashboard/menu/page.tsx'), 'utf-8');

  // At-a-glance stats must use the shared d3-figure class.
  expect(src).toContain('className="d3-figure"');

  // The old serif font must no longer be applied to the numerical
  // stat spans (it may still appear on headings, which is fine).
  const atAGlanceStart = src.indexOf("Dishes', value: menuItems.length");
  expect(atAGlanceStart).toBeGreaterThan(-1);
  const atAGlanceBlock = src.slice(atAGlanceStart, atAGlanceStart + 600);
  expect(atAGlanceBlock).not.toMatch(/fontFamily:\s*'var\(--font-display\)'/);

  // Category tab counts must also use d3-figure.
  expect(src).toContain('className="d3-figure" style={{ color: \'var(--text-dimmed)\', fontSize: \'0.6875rem\' }}');
});

test('d3-figure class uses sans-serif font', () => {
  const css = readFileSync(resolve('app/globals.css'), 'utf-8');
  const idx = css.indexOf('.d3-figure');
  expect(idx).toBeGreaterThan(-1);
  // Extract just the .d3-figure rule block (up to the closing brace).
  const blockStart = css.indexOf('{', idx);
  const blockEnd = css.indexOf('}', blockStart);
  const block = css.slice(idx, blockEnd + 1);
  expect(block).toContain('font-family:');
  // Must be a sans-serif stack, NOT the display/serif font.
  expect(block).not.toMatch(/Cormorant/);
  expect(block).not.toMatch(/Georgia/);
  expect(block).toMatch(/sans-serif/);
  expect(block).toMatch(/Inter/);
});