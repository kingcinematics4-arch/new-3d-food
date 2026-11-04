import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['order-tracking.spec.ts', 'dish-form.spec.ts'],
  use: { headless: true, viewport: null },
  webServer: undefined,
});