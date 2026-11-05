import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['order-tracking.spec.ts', 'dish-form.spec.ts', 'currency-audit.spec.ts', 'dashboard-header.spec.ts', 'menu-font.spec.ts', 'tooltip.spec.ts'],
  use: { headless: true, viewport: null },
  webServer: undefined,
});