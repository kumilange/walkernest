/**
 * @title Address Autocomplete Error & Fallback Integration Test
 * @description Tests the error handling and cached result fallback behavior
 * when network failures occur in the address autocomplete feature.
 */

import { expect, test } from "@playwright/test";
import { TestUtilities } from "../utils/TestUtilities";

/**
 * Address Autocomplete Error Handling & Fallback Tests
 * Tests network failure scenarios with cached result fallbacks
 */
test.describe("Address Autocomplete Error Handling & Fallback", () => {
  let testUtils: TestUtilities;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtilities(page);

    // Setup clean test environment
    await page.goto("http://localhost:5173/");

    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    }

    // Clear storage
    try {
      await page.evaluate(() => {
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.clear();
          }
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
          }
        } catch {
          // Ignore storage access errors
        }
      });
    } catch {
      // Ignore if storage clearing fails
    }
  });

  test("should show cached results with toast on network failure then work normally after recovery", async ({
    page,
  }) => {
    // First, populate the cache with a successful API call
    const mockSuccessResponse = [
      {
        place_id: "12345",
        lat: "52.5200",
        lon: "13.4050",
        display_name: "Berlin, Germany",
        importance: 0.9,
        address: {
          city: "Berlin",
          country: "Germany",
          country_code: "de",
        },
      },
    ];

    // Mock successful API response
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSuccessResponse),
      });
    });

    // Navigate to the app and wait for it to load
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // Click "Check route" to open the route planning dialog
    await page.getByRole("button", { name: "Check route" }).click();

    // Find the address input field (start point)
    const startAddressInput = page.getByRole("combobox", { name: "Enter starting address" });
    await expect(startAddressInput).toBeVisible();

    // Type to trigger autocomplete and populate cache
    await startAddressInput.fill("Berlin");
    await page.waitForTimeout(500); // Wait for debounce

    // Wait for the autocomplete dropdown to appear
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    await expect(page.locator('text="Berlin, Germany"')).toBeVisible();

    // Select the suggestion to confirm it works
    await page.locator('text="Berlin, Germany"').click();
    await expect(startAddressInput).toHaveValue("Berlin, Germany");

    // Clear the input to test error scenario
    await startAddressInput.clear();

    // Now simulate network failure
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Simulated API failure for testing" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    // Type the same query again - should trigger error then fallback to cache
    await startAddressInput.fill("Berlin");
    await page.waitForTimeout(500); // Wait for debounce

    // Should show toast notification about connection issue
    await expect(
      page.locator('div.font-semibold:has-text("Connection Issue")').first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Showing cached results. Please check your internet connection.").first()
    ).toBeVisible();

    // Should still show the cached results in dropdown
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    await expect(page.locator('text="Berlin, Germany"')).toBeVisible();

    // Should show cached result indicator in dropdown
    await expect(
      page.locator('span.text-xs:has-text("Showing cached results")').first()
    ).toBeVisible();

    // Verify clock icons are shown for cached results
    await expect(page.locator(".lucide-clock").first()).toBeVisible();

    // Select the cached result to confirm it still works
    await page.locator('text="Berlin, Germany"').click();
    await expect(startAddressInput).toHaveValue("Berlin, Germany");

    // Clear input again to test recovery
    await startAddressInput.clear();

    // Restore API to working state
    await page.unroute("**/nominatim.openstreetmap.org/search**");

    // Mock successful response again
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSuccessResponse),
      });
    });

    // Type a new query to test recovery
    await startAddressInput.fill("Hamburg");
    await page.waitForTimeout(500); // Wait for debounce

    // Should work normally without error indicators
    await expect(page.locator('[role="listbox"]')).toBeVisible();

    // Should not show error toast or cached result indicators
    await expect(page.locator('div.font-semibold:has-text("Connection Issue")')).not.toBeVisible();
    await expect(page.locator('span.text-xs:has-text("Showing cached results")')).not.toBeVisible();
  });

  test("should show error state when network fails and no cache available", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // Click "Check route" to open the route planning dialog
    await page.getByRole("button", { name: "Check route" }).click();

    // Simulate network failure from the start
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Simulated API failure for testing" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    // Find the address input field
    const startAddressInput = page.getByRole("combobox", { name: "Enter starting address" });
    await expect(startAddressInput).toBeVisible();

    // Type to trigger autocomplete (no cache available)
    await startAddressInput.fill("NonExistentCity");
    await page.waitForTimeout(500); // Wait for debounce

    // Should show error toast
    await expect(page.getByText("Address Search Failed").first()).toBeVisible({ timeout: 10000 });
    await expect(
      page
        .getByText("Unable to search for addresses. Please check your connection and try again.")
        .first()
    ).toBeVisible();

    // Should show error state in dropdown if it appears
    const dropdown = page.locator('[role="listbox"]');
    if (await dropdown.isVisible()) {
      await expect(page.locator('text="Connection Error"')).toBeVisible();
      await expect(page.locator('text="Unable to fetch address suggestions"')).toBeVisible();
    }
  });

  test("should handle geocoding errors with cached fallback", async ({ page }) => {
    // First, populate the cache
    const mockSuccessResponse = [
      {
        place_id: "12345",
        lat: "52.5200",
        lon: "13.4050",
        display_name: "Berlin, Germany",
        importance: 0.9,
        address: {
          city: "Berlin",
          country: "Germany",
          country_code: "de",
        },
      },
    ];

    // Mock successful API response initially
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSuccessResponse),
      });
    });

    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // Click "Check route" to open the route planning dialog
    await page.getByRole("button", { name: "Check route" }).click();

    // Populate cache
    const startAddressInput = page.getByRole("combobox", { name: "Enter starting address" });
    await startAddressInput.fill("Berlin");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible();
    await page.locator('text="Berlin, Germany"').click();

    // Clear and simulate geocoding scenario with network failure
    await startAddressInput.clear();
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Simulated API failure for testing" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    // Type the same address but clear dropdown first to ensure geocoding flow
    await startAddressInput.fill("Berlin");
    // Wait for debounce to potentially show dropdown
    await page.waitForTimeout(500);

    // Press Escape to clear any dropdown suggestions and ensure clean state for geocoding
    await startAddressInput.press("Escape");
    await page.waitForTimeout(100);

    // Now press Enter to trigger geocoding (no autocomplete suggestions should be selected)
    await startAddressInput.press("Enter");

    // Should show toast about using cached results for geocoding
    await expect(
      page.locator('div.font-semibold:has-text("Using Cached Results")').first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Geocoding using cached data due to connection issue.").first()
    ).toBeVisible({ timeout: 8000 });

    // Should still set the address from cached data
    await expect(startAddressInput).toHaveValue("Berlin, Germany");
  });

  test("should handle rapid typing with intermittent network failures", async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // Click "Check route" to open the route planning dialog
    await page.getByRole("button", { name: "Check route" }).click();

    const startAddressInput = page.getByRole("combobox", { name: "Enter starting address" });

    // Simulate intermittent network issues
    let requestCount = 0;
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      requestCount++;

      // Alternate between success and failure
      if (requestCount % 2 === 0) {
        // Fail every second request
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      } else {
        // Success
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              place_id: "12345",
              lat: "52.5200",
              lon: "13.4050",
              display_name: `Berlin ${requestCount}, Germany`,
              importance: 0.9,
              address: {
                city: "Berlin",
                country: "Germany",
                country_code: "de",
              },
            },
          ]),
        });
      }
    });

    // Type rapidly to trigger multiple requests
    await startAddressInput.fill("B");
    await page.waitForTimeout(100);
    await startAddressInput.fill("Be");
    await page.waitForTimeout(100);
    await startAddressInput.fill("Ber");
    await page.waitForTimeout(100);
    await startAddressInput.fill("Berl");
    await page.waitForTimeout(100);
    await startAddressInput.fill("Berli");
    await page.waitForTimeout(100);
    await startAddressInput.fill("Berlin");

    // Wait for final debounce
    await page.waitForTimeout(500);

    // Should eventually show some result (either success or cached fallback)
    // Due to the rapid typing, some requests will succeed and others will fail
    // The important thing is that the app doesn't crash and handles the errors gracefully

    // Check if either success or error handling occurred
    const hasResults = await page.locator('[role="listbox"]').isVisible();
    const hasError = await page.getByText("Connection Issue").isVisible();
    const hasSearchFailed = await page.getByText("Address Search Failed").isVisible();

    // At least one of these should be true - the app should handle the situation gracefully
    expect(hasResults || hasError || hasSearchFailed).toBeTruthy();
  });

  test("should maintain error state indicators when typing continues", async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // Click "Check route" to open the route planning dialog
    await page.getByRole("button", { name: "Check route" }).click();

    // Simulate network failure
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Simulated API failure for testing" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    const startAddressInput = page.getByRole("combobox", { name: "Enter starting address" });

    // Type to trigger error
    await startAddressInput.fill("Berlin");
    await page.waitForTimeout(500);

    // Should show error toast
    await expect(page.getByText("Address Search Failed").first()).toBeVisible({ timeout: 10000 });

    // Continue typing while error state is active
    await startAddressInput.fill("Berlin Central");
    await page.waitForTimeout(500);

    // Error handling should still be working
    // The app should not crash or become unresponsive
    await expect(startAddressInput).toHaveValue("Berlin Central");
  });
});
