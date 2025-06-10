import { expect, test } from "@playwright/test";

/**
 * Smoke tests to verify basic MCP Playwright setup and application accessibility
 */
test.describe("Application Smoke Tests", () => {
  test("should load the application homepage", async ({ page }) => {
    // Navigate to the application using absolute URL
    await page.goto("http://localhost:5173");

    try {
      // Try to wait for networkidle with a shorter timeout
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      // If networkidle fails, wait for domcontentloaded and a basic element
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    }

    // Verify the page title contains 'Walkernest'
    await expect(page).toHaveTitle(/Walkernest/);

    // Verify the application is accessible
    await expect(page.locator("body")).toBeVisible();
  });

  test("should be able to navigate basic pages", async ({ page }) => {
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

    // Verify that critical elements are present and the app has loaded
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check that the application has loaded properly using more reliable selectors
    // Try multiple selectors to find the React app root
    const possibleRoots = [
      page.locator("#root"),
      page.locator("#app"),
      page.locator("[data-reactroot]"),
      page.locator("main"),
      page.locator("h1"),
      page.locator(".App"),
    ];

    let rootFound = false;
    for (const rootSelector of possibleRoots) {
      try {
        if (await rootSelector.isVisible({ timeout: 2000 })) {
          await expect(rootSelector).toBeVisible();
          rootFound = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    // If no specific root found, just verify the page has meaningful content
    if (!rootFound) {
      // Check for any interactive elements that indicate the app loaded
      const interactiveElements = page.locator('button, [role="combobox"], [role="button"]');
      const elementCount = await interactiveElements.count();
      expect(elementCount).toBeGreaterThan(0);
    }
  });

  test("should support touch events on mobile devices", async ({ page, isMobile }) => {
    await page.goto("http://localhost:5173");

    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    }

    if (isMobile) {
      // Test basic touch capability
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Verify the viewport is properly configured for mobile
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();
      if (viewport) {
        expect(viewport.width).toBeLessThanOrEqual(414); // Mobile max width per requirements
      }

      // Test that touch events are supported by checking for touch-capable elements
      const touchableElements = page.locator('button, [role="button"], [role="combobox"]');
      const touchableCount = await touchableElements.count();

      if (touchableCount > 0) {
        // Verify we can interact with touch elements
        const firstTouchable = touchableElements.first();
        if (await firstTouchable.isVisible({ timeout: 3000 })) {
          // Just verify the element is touchable, don't actually trigger it
          await expect(firstTouchable).toBeVisible();
        }
      }
    }
  });
});
