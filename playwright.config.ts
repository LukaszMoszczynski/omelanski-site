import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321/' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: false,
    timeout: 180_000,
    // Astro 7's CLI auto-detects coding-agent shells (e.g. this harness) and
    // silently daemonizes `astro preview`, which makes the wrapper command
    // exit immediately and Playwright report "Process from config.webServer
    // exited early." Forcing this env var opts back into the normal
    // foreground server so Playwright can manage its lifecycle.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
  },
});
