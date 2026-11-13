// Playwright-Tests (Docker-Image mcr.microsoft.com/playwright:v1.48.2-jammy, siehe scripts/test.sh).
// Testet den fertigen Build in dist/ – ausgeliefert unter BASE wie auf GitHub Pages (Standard /waybuild_Akademie).
import { defineConfig, devices } from '@playwright/test';

const BASE = (process.env.BASE ?? '/waybuild_Akademie').replace(/\/+$/, '');
const PORT = 4321;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}${BASE}/`,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `node tests/server.mjs ${PORT}`,
    env: { BASE },
    url: `http://localhost:${PORT}${BASE}/`,
    reuseExistingServer: false,
  },
});
