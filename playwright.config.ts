import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração moderna e production-ready do Playwright para o Linkanban.
 * Cobre execução paralela, tolerância a falhas, coleta de evidências e múltiplos dispositivos.
 */
const PORT = Number(process.env.PORT) || 5193;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    launchOptions: {
      slowMo: process.env.SLOWMO ? Number.parseInt(process.env.SLOWMO, 10) : 0,
    },
  },

  projects: [
    // Desktop Browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile Viewports para validação responsiva crítica
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  webServer: {
    command: `pnpm --filter @fio/web dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
