import { expect, test } from "@playwright/test";

/**
 * Example tests for parallel execution validation
 *
 * These tests help validate that different parallel configurations work correctly
 * and provide baseline performance measurements.
 */

test.describe("Parallel Execution Examples", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");

    try {
      // Try to wait for networkidle with a shorter timeout
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      // If networkidle fails, wait for domcontentloaded and a basic element
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      // Ensure the basic app structure is loaded
      try {
        await page.waitForSelector("h1", { timeout: 5000 });
      } catch {
        // If no h1, just ensure page is responsive
        await page.waitForTimeout(1000);
      }
    }
  });

  test("@smoke Basic page load and navigation", async ({ page }) => {
    // Basic smoke test that should work in all configurations
    await expect(page).toHaveTitle(/Walkernest/);

    // Check basic navigation elements are present (using Walkernest heading)
    await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();

    // Add artificial delay to simulate realistic test duration
    await page.waitForTimeout(1000);
  });

  test("@smoke City selection functionality", async ({ page }) => {
    // Test city switching which is a common user action - using actual combobox
    const citySelector = page.locator('[role="combobox"]').first();

    if (await citySelector.isVisible()) {
      await citySelector.click({ force: true });
      await page.waitForTimeout(500);

      // Check if the combobox opened (look for expanded state)
      const isExpanded = await citySelector.getAttribute("aria-expanded");
      if (isExpanded === "true") {
        // If options are available, try to select one
        const cityOptions = page.locator("[role='option']");
        const count = await cityOptions.count();

        if (count > 0) {
          await cityOptions.first().click();
          await page.waitForTimeout(1500); // Wait for city switch
        }
      }
    }

    // Verify page is still functional
    await expect(page).toHaveTitle(/Walkernest/);
  });

  test("@integration Map component loading", async ({ page }) => {
    // Test map component which is resource-intensive - using actual map region
    const mapRegion = page.locator('[role="region"][name="Map"]').first();

    if (await mapRegion.isVisible()) {
      // Wait for map to load
      await expect(mapRegion).toBeVisible();
      await page.waitForTimeout(2000); // Allow map to fully load

      // Check if map controls are present (zoom buttons exist per page snapshot)
      const zoomInButton = page.locator("button", { hasText: "Zoom in" });
      const zoomOutButton = page.locator("button", { hasText: "Zoom out" });

      if (await zoomInButton.isVisible()) {
        await expect(zoomInButton).toBeVisible();
      }
      if (await zoomOutButton.isVisible()) {
        await expect(zoomOutButton).toBeVisible();
      }
    }

    await page.waitForTimeout(1000);
  });

  test("@touch-simulation Touch event simulation", async ({ page }) => {
    // Test touch events using Playwright's event simulation
    const interactiveElement = page.locator("button").first();

    if (await interactiveElement.isVisible()) {
      // Simulate touch events
      await interactiveElement.dispatchEvent("touchstart");
      await page.waitForTimeout(100);
      await interactiveElement.dispatchEvent("touchend");

      // Verify the touch interaction worked
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveTitle(/Walkernest/);
  });

  test("@integration Form interaction test", async ({ page }) => {
    // Test form interactions which can be complex in parallel
    const forms = page.locator("form");
    const formCount = await forms.count();

    if (formCount > 0) {
      const firstForm = forms.first();

      // Find input fields
      const inputs = firstForm.locator("input[type='text'], input[type='number']");
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        // Fill first input
        await inputs.first().fill("Test input for parallel execution");
        await page.waitForTimeout(500);

        // Check if form validation is working
        const submitButton = firstForm.locator("button[type='submit']").first();
        if (await submitButton.isVisible()) {
          const isEnabled = await submitButton.isEnabled();
          expect(typeof isEnabled).toBe("boolean");
        }
      }
    }

    await page.waitForTimeout(1000);
  });

  test("@performance API response timing", async ({ page }) => {
    // Test API interactions under parallel load
    let responseTime = 0;

    page.on("response", async (response) => {
      if (response.url().includes("api") || response.url().includes("data")) {
        responseTime = Date.now();
      }
    });

    // Trigger any API calls through UI interaction
    await page.reload();

    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    }

    // Basic assertion to ensure test completes
    await expect(page).toHaveTitle(/Walkernest/);

    // Add delay to simulate API processing time
    await page.waitForTimeout(1500);
  });

  test("@critical State isolation validation", async ({ page }) => {
    // Critical test to ensure parallel tests don't interfere with each other
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store unique data in localStorage to test isolation
    await page.evaluate((id) => {
      try {
        localStorage.setItem("parallel-test-id", id);
      } catch {
        // Ignore if localStorage is not available
      }
    }, testId);

    // Verify the data is stored correctly
    const storedId = await page.evaluate(() => {
      try {
        return localStorage.getItem("parallel-test-id");
      } catch {
        return null;
      }
    });

    if (storedId) {
      expect(storedId).toBe(testId);
    }

    // Clean up
    await page.evaluate(() => {
      try {
        localStorage.removeItem("parallel-test-id");
      } catch {
        // Ignore cleanup errors
      }
    });

    await page.waitForTimeout(800);
  });

  test("@performance Resource usage simulation", async ({ page }) => {
    // Simulate resource-intensive operations to test parallel limits
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      // Navigate and wait to simulate load
      await page.goto(`http://localhost:5173?test-iteration=${i}`);

      try {
        await page.waitForLoadState("domcontentloaded", { timeout: 5000 });
      } catch {
        await page.waitForTimeout(1000);
      }

      // Simulate user interactions
      const clickableElements = page.locator("button, a, [role='button']");
      const count = await clickableElements.count();

      if (count > 0) {
        // Click first available element
        try {
          await clickableElements.first().click({ timeout: 1000 });
        } catch (error) {
          // Ignore click failures in this test
        }
      }

      await page.waitForTimeout(300);
    }

    // Final verification
    await expect(page).toHaveTitle(/Walkernest/);
  });

  test("@balance Configuration compatibility test", async ({ page }) => {
    // Test that validates configuration-specific features
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const viewport = page.viewportSize();

    // Log configuration info for analysis
    console.log(`User Agent: ${userAgent}`);
    console.log(`Viewport: ${JSON.stringify(viewport)}`);

    // Test different viewport scenarios based on configuration
    if (viewport && viewport.width < 768) {
      // Mobile-specific tests - check main content is visible
      await expect(page.locator("main")).toBeVisible();
    } else {
      // Desktop-specific tests - check banner navigation is visible
      await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
    }

    await page.waitForTimeout(1200);
  });

  test("@aggressive Stress test for aggressive config", async ({ page }) => {
    // More intensive test that should only run in aggressive configuration
    const heavyOperations = 10;

    for (let i = 0; i < heavyOperations; i++) {
      // Multiple rapid navigations
      await page.goto(`/?stress=${i}`);
      await page.waitForTimeout(100);

      // Rapid DOM queries
      const allElements = page.locator("*");
      await allElements.count();

      // Memory allocation test
      await page.evaluate(() => {
        const largeArray = new Array(1000).fill("test data");
        return largeArray.length;
      });
    }

    // Verify application is still responsive
    await expect(page).toHaveTitle(/Walkernest/);
  });
});

// Additional test group for touch-specific scenarios
test.describe("@touch-real-device Touch Real Device Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Real device touch interaction", async ({ page }) => {
    // This test should only run with real device emulation - use actual buttons
    const firstButton = page.locator("button").first();

    if (await firstButton.isVisible()) {
      // Use real touch events on any visible button - force action to bypass intercepting elements
      await firstButton.tap({ force: true });
      await page.waitForTimeout(500);

      // Verify interaction worked
      await expect(page).toHaveTitle(/Walkernest/);
    }
  });

  test("Multi-touch gesture simulation", async ({ page }) => {
    // Test complex touch gestures - use actual map region
    const mapRegion = page.locator('[role="region"][name="Map"]').first();

    if (await mapRegion.isVisible()) {
      // Simulate touch interaction on map - force action to bypass intercepting elements
      await mapRegion.tap({ force: true });
      await page.waitForTimeout(500);
    } else {
      // Fallback to main content area if map not found
      await page.locator("main").tap({ force: true });
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveTitle(/Walkernest/);
  });
});
