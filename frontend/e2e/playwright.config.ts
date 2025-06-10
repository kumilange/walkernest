import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

// Ensure all paths are resolved relative to this config file (frontend/e2e/)
const E2E_BASE_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Walkernest E2E Testing Configuration
 *
 * Balanced parallel execution optimized for speed and resource usage.
 * Firefox excluded due to low target market usage and CI optimization.
 */
export default defineConfig({
  testDir: path.join(E2E_BASE_DIR, "tests"), // Tests located in frontend/e2e/tests/
  outputDir: path.join(E2E_BASE_DIR, "test-results"), // Results output to frontend/e2e/test-results/

  // Balanced settings
  timeout: 45000, // 45 seconds per test
  expect: { timeout: 8000 }, // 8 second assertions

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Moderate parallelism
  workers: process.env.CI ? 4 : 2, // 4 workers in CI, 2 locally
  fullyParallel: true, // Allow test files to run in parallel
  retries: process.env.CI ? 2 : 1, // More retries in CI

  // Reporter configuration - ALL E2E outputs under frontend/e2e/
  reporter: [
    ["html", { outputFolder: path.join(E2E_BASE_DIR, "playwright-report") }], // HTML report in e2e/playwright-report/
    ["json", { outputFile: path.join(E2E_BASE_DIR, "test-results", "results.json") }], // JSON results in e2e/test-results/
    ["list"], // Console output
  ],

  // Shared settings for all the projects below
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",

    // Balanced timeout settings
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },

  // Configure projects for balanced parallel execution
  projects: [
    // Desktop browsers - parallel execution (exclude touch-real-device tests)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@touch-real-device/,
    },
    // Edge only available on Windows (exclude touch-real-device tests)
    ...(process.platform === "win32"
      ? [
          {
            name: "edge",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
            grepInvert: /@touch-real-device/,
          },
        ]
      : []),

    // Mobile - limited to important devices with enhanced touch support
    {
      name: "mobile-iphone",
      use: {
        ...devices["iPhone 13"],
        hasTouch: true,
        isMobile: true,
        // Enhanced touch event configuration
        userAgent: devices["iPhone 13"].userAgent,
      },
    },

    // Touch simulation tests (fast)
    {
      name: "touch-simulation",
      use: {
        ...devices["iPhone 13"],
        headless: true,
        hasTouch: true,
        isMobile: true,
      },
      grep: /@touch-simulation/,
    },

    // Real device touch tests (only on mobile projects)
    {
      name: "touch-real-device",
      use: {
        ...devices["iPhone 13"],
        headless: false,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 812 },
      },
      grep: /@touch-real-device/,
    },
  ],

  // Run your local dev servers before starting the tests
  webServer: [
    // Backend server (Docker) - run from root level
    {
      command: "npm run dev",
      cwd: path.join(E2E_BASE_DIR, "..", ".."), // Run from root directory (walkernest)
      port: 3000,
      reuseExistingServer: !process.env.CI, // Auto-manage in CI, reuse locally
      timeout: 120000, // 2 minutes to start Docker services
    },
    // Frontend server - run from frontend directory
    {
      command: "npm run dev",
      cwd: path.join(E2E_BASE_DIR, ".."), // Run from frontend directory
      port: 5173,
      reuseExistingServer: true, // Use manually started server
      timeout: 90000, // 90 seconds to start server
    },
  ],
});
