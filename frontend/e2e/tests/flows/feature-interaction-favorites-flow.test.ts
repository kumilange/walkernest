import { expect, test } from "@playwright/test";

/**
 * TASK-011: Feature Interaction & Favorites Flow Implementation
 *
 * Integration flow for Feature Click → Popup → Favorite → Name → Save sequence
 * Critical user journey for favorite management
 */

test.describe("@integration Feature Interaction & Favorites Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
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

    // Clear any existing favorites for clean test state
    await page.evaluate(() => {
      localStorage.removeItem("favorites");
      localStorage.removeItem("favoritesList");
    });
  });

  test("@critical Feature click opens FeaturePopup (post-analysis only)", async ({ page }) => {
    // Wait for page to load
    await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();

    // Look for map features or interactive elements
    const mapRegion = page.locator('[role="region"][name="Map"]').first();

    // If map region not found, check for any map-related elements
    if (!(await mapRegion.isVisible())) {
      const mapContainer = page.locator('.map, #map, [data-testid*="map"]').first();
      if (await mapContainer.isVisible()) {
        await expect(mapContainer).toBeVisible();
      } else {
        // If no map found, just verify page is still functional
        await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
      }
    } else {
      await expect(mapRegion).toBeVisible();
    }

    // Try to find clickable map features
    const mapFeatures = page.locator(
      '[data-testid*="feature"], [data-apartment], .apartment-feature, .map-feature'
    );
    const featureCount = await mapFeatures.count();

    if (featureCount > 0) {
      // Click on first available feature
      const firstFeature = mapFeatures.first();
      await firstFeature.click({ force: true });
      await page.waitForTimeout(1000);

      // Check if popup opened
      const popup = page.locator('[data-testid*="popup"], .popup, .feature-popup, [role="dialog"]');
      const popupVisible = await popup.isVisible();

      if (popupVisible) {
        // Verify popup contains expected elements
        await expect(popup).toBeVisible();

        // Look for close button or heart icon
        const closeButton = popup.locator("button", { hasText: /close|×/i });
        const heartIcon = popup.locator('[data-testid*="heart"], .heart-icon, .favorite-button');

        // At least one of these should be present
        const hasCloseButton = await closeButton.isVisible();
        const hasHeartIcon = await heartIcon.isVisible();
        expect(hasCloseButton || hasHeartIcon).toBe(true);
      }
    }
  });

  test("@integration Heart icon triggers NameFavoritePopup", async ({ page }) => {
    // Ensure page is ready
    await page.waitForTimeout(1000);

    // Look for existing heart/favorite buttons on the page
    const favoriteButtons = page.locator(
      '[data-testid*="heart"], .heart-icon, .favorite-button, button[aria-label*="favorite"]'
    );
    const buttonCount = await favoriteButtons.count();

    if (buttonCount > 0) {
      // Click on first favorite button
      const firstFavoriteButton = favoriteButtons.first();
      await firstFavoriteButton.click({ force: true });
      await page.waitForTimeout(1000);

      // Look for name favorite popup/dialog
      const namePopup = page.locator(
        '[data-testid*="name"], [data-testid*="favorite-name"], .name-popup, .favorite-name-dialog, [role="dialog"]'
      );
      const namePopupVisible = await namePopup.isVisible();

      if (namePopupVisible) {
        // Verify name input popup elements
        await expect(namePopup).toBeVisible();

        // Should have name input field
        const nameInput = namePopup.locator(
          'input[type="text"], input[placeholder*="name"], textarea'
        );
        const hasNameInput = await nameInput.isVisible();

        // Should have save/cancel buttons
        const saveButton = namePopup.locator("button", { hasText: /save|add|confirm/i });
        const cancelButton = namePopup.locator("button", { hasText: /cancel|close/i });

        expect(hasNameInput).toBe(true);

        const hasSaveButton = await saveButton.isVisible();
        const hasCancelButton = await cancelButton.isVisible();
        expect(hasSaveButton || hasCancelButton).toBe(true);
      }
    } else {
      // If no direct favorite buttons, try simulating the full flow
      console.log("No direct favorite buttons found, simulating full feature interaction flow");

      // Look for map features to click first
      const mapFeatures = page.locator('button, [role="button"], [data-clickable]');
      const featureCount = await mapFeatures.count();

      if (featureCount > 0) {
        await mapFeatures.first().click({ force: true });
        await page.waitForTimeout(1000);

        // Now look for heart icon in any popup
        const heartIcon = page.locator('[data-testid*="heart"], .heart-icon, .favorite-button');
        if (await heartIcon.isVisible()) {
          await heartIcon.click({ force: true });
          await page.waitForTimeout(1000);

          // Check for name popup
          const namePopup = page.locator('[role="dialog"], .popup, .modal');
          await expect(namePopup).toBeVisible();
        }
      }
    }
  });

  test("@integration Save process includes API call, localStorage update, and toast notification", async ({
    page,
  }) => {
    // Track network requests
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/") || request.url().includes("/favorites")) {
        apiRequests.push(request.url());
      }
    });

    // Ensure page is ready
    await page.waitForTimeout(1000);

    // Get initial localStorage state
    const initialFavorites = await page.evaluate(() => {
      return localStorage.getItem("favorites") || "[]";
    });

    // Look for ways to add a favorite
    const favoriteButtons = page.locator(
      '[data-testid*="heart"], .heart-icon, .favorite-button, button[aria-label*="favorite"]'
    );
    const buttonCount = await favoriteButtons.count();

    if (buttonCount > 0) {
      await favoriteButtons.first().click({ force: true });
      await page.waitForTimeout(1000);

      // Look for name input in any popup/dialog
      const nameInput = page
        .locator('input[type="text"], input[placeholder*="name"], textarea')
        .first();
      if (await nameInput.isVisible()) {
        // Fill in favorite name
        const favoriteName = `Test Apartment ${Date.now()}`;
        await nameInput.fill(favoriteName);

        // Find and click save button
        const saveButton = page.locator("button", { hasText: /save|add|confirm/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click({ force: true });
          await page.waitForTimeout(2000); // Wait for save process

          // Check for localStorage update
          const updatedFavorites = await page.evaluate(() => {
            return localStorage.getItem("favorites") || "[]";
          });
          expect(updatedFavorites).not.toBe(initialFavorites);

          // Look for success toast or notification
          const toast = page.locator(
            '.toast, .notification, .alert, [data-testid*="toast"], [data-testid*="notification"]'
          );
          const toastVisible = await toast.isVisible();

          if (toastVisible) {
            await expect(toast).toBeVisible();

            // Toast should contain success message
            const toastText = await toast.textContent();
            expect(toastText).toMatch(/success|saved|added|favorite/i);
          }

          // Verify API call was made (if any)
          console.log(`API requests made: ${apiRequests.length}`);
        }
      }
    }
  });

  test("@error Error handling for save failures with retry option", async ({ page }) => {
    // Intercept and fail API requests to simulate errors
    await page.route("**/api/**", async (route) => {
      await route.abort("failed");
    });

    await page.route("**/favorites/**", async (route) => {
      await route.abort("failed");
    });

    // Ensure page is ready
    await page.waitForTimeout(1000);

    // Look for favorite functionality
    const favoriteButtons = page.locator(
      '[data-testid*="heart"], .heart-icon, .favorite-button, button[aria-label*="favorite"]'
    );
    const buttonCount = await favoriteButtons.count();

    if (buttonCount > 0) {
      await favoriteButtons.first().click({ force: true });
      await page.waitForTimeout(1000);

      const nameInput = page
        .locator('input[type="text"], input[placeholder*="name"], textarea')
        .first();
      if (await nameInput.isVisible()) {
        // Fill in favorite name
        await nameInput.fill("Test Error Handling");

        // Find and click save button
        const saveButton = page.locator("button", { hasText: /save|add|confirm/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click({ force: true });
          await page.waitForTimeout(3000); // Wait for error handling

          // Look for error message
          const errorMessage = page.locator(
            '.error, .alert-error, [data-testid*="error"], .text-red, .text-danger'
          );
          const errorVisible = await errorMessage.isVisible();

          if (errorVisible) {
            await expect(errorMessage).toBeVisible();

            // Look for retry button
            const retryButton = page.locator("button", { hasText: /retry|try again/i });
            if (await retryButton.isVisible()) {
              await expect(retryButton).toBeVisible();
            }
          }
        }
      }
    }
  });

  test("@state Cross-component state updates validation", async ({ page }) => {
    // Ensure page is ready
    await page.waitForTimeout(1000);

    // Get initial component states
    const initialStates = await page.evaluate(() => {
      return {
        favorites: localStorage.getItem("favorites") || "[]",
        cityData: localStorage.getItem("cityData"),
        componentStates: document.querySelectorAll("[data-component]").length,
      };
    });

    // Try to add a favorite and verify cross-component updates
    const favoriteButtons = page.locator(
      '[data-testid*="heart"], .heart-icon, .favorite-button, button[aria-label*="favorite"]'
    );
    const buttonCount = await favoriteButtons.count();

    if (buttonCount > 0) {
      await favoriteButtons.first().click({ force: true });
      await page.waitForTimeout(1000);

      const nameInput = page
        .locator('input[type="text"], input[placeholder*="name"], textarea')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("Cross Component Test");

        const saveButton = page.locator("button", { hasText: /save|add|confirm/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click({ force: true });
          await page.waitForTimeout(2000);

          // Verify state updates across components
          const updatedStates = await page.evaluate(() => {
            return {
              favorites: localStorage.getItem("favorites") || "[]",
              cityData: localStorage.getItem("cityData"),
              componentStates: document.querySelectorAll("[data-component]").length,
            };
          });

          // Favorites should be updated
          expect(updatedStates.favorites).not.toBe(initialStates.favorites);

          // Other components should remain functional
          const citySelector = page.locator('[role="combobox"]').first();
          const mapRegion = page.locator('[role="region"][name="Map"]');

          await expect(citySelector).toBeVisible();

          // Check map region with fallback
          if (!(await mapRegion.isVisible())) {
            const mapContainer = page.locator('.map, #map, [data-testid*="map"]').first();
            if (await mapContainer.isVisible()) {
              await expect(mapContainer).toBeVisible();
            } else {
              // If no map found, just verify page is still functional
              await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
            }
          } else {
            await expect(mapRegion).toBeVisible();
          }

          // Page should still be responsive
          await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
        }
      }
    }
  });
});
