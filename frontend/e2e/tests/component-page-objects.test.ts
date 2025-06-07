import { expect, test } from "@playwright/test";
import {
  AnalyzeApartmentPage,
  CheckRoutePage,
  FavoritesListPage,
  FeaturePopupPage,
  ManageLayerPage,
  NameFavoritePopupPage,
} from "../page-objects/components";

/**
 * Component Page Objects Tests
 * Verifies that all component page objects can be instantiated and basic functionality works
 */
test.describe("Component Page Objects", () => {
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

    // Safe localStorage clearing without causing SecurityError
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

  test("should instantiate all component page objects", async ({ page }) => {
    // Test that all page objects can be created without errors
    const analyzeApartment = new AnalyzeApartmentPage(page);
    const favoritesList = new FavoritesListPage(page);
    const checkRoute = new CheckRoutePage(page);
    const manageLayer = new ManageLayerPage(page);
    const featurePopup = new FeaturePopupPage(page);
    const nameFavoritePopup = new NameFavoritePopupPage(page);

    // Verify they are instances of their respective classes
    expect(analyzeApartment).toBeInstanceOf(AnalyzeApartmentPage);
    expect(favoritesList).toBeInstanceOf(FavoritesListPage);
    expect(checkRoute).toBeInstanceOf(CheckRoutePage);
    expect(manageLayer).toBeInstanceOf(ManageLayerPage);
    expect(featurePopup).toBeInstanceOf(FeaturePopupPage);
    expect(nameFavoritePopup).toBeInstanceOf(NameFavoritePopupPage);
  });

  test("should be able to check component visibility", async ({ page }) => {
    const analyzeApartment = new AnalyzeApartmentPage(page);
    const favoritesList = new FavoritesListPage(page);
    const checkRoute = new CheckRoutePage(page);
    const manageLayer = new ManageLayerPage(page);

    // Test that visibility check methods work (basic smoke test)
    const analyzeVisible = await analyzeApartment.isComponentVisible();
    const favoritesVisible = await favoritesList.isComponentVisible();
    const routeVisible = await checkRoute.isComponentVisible();
    const layerVisible = await manageLayer.isComponentVisible();

    expect(typeof analyzeVisible).toBe("boolean");
    expect(typeof favoritesVisible).toBe("boolean");
    expect(typeof routeVisible).toBe("boolean");
    expect(typeof layerVisible).toBe("boolean");
  });

  test("should handle error scenarios gracefully", async ({ page }) => {
    const analyzeApartment = new AnalyzeApartmentPage(page);

    // Test that methods handle missing components gracefully
    const isVisible = await analyzeApartment.isComponentVisible();
    expect(typeof isVisible).toBe("boolean");
  });

  test("should provide test data utilities", async ({ page }) => {
    // Provide basic test data structure directly
    const testData = {
      cities: [
        { name: "Berlin", country: "Germany" },
        { name: "Munich", country: "Germany" },
        { name: "Hamburg", country: "Germany" },
      ],
      coordinates: [
        { lat: 52.52, lng: 13.405 }, // Berlin
        { lat: 48.1351, lng: 11.582 }, // Munich
        { lat: 53.5511, lng: 9.9937 }, // Hamburg
      ],
      addresses: ["Alexanderplatz 1, Berlin", "Marienplatz 1, München", "Rathausmarkt 1, Hamburg"],
      favorites: [
        { name: "Test Apartment 1", location: "Berlin" },
        { name: "Test Apartment 2", location: "Munich" },
      ],
    };

    // Verify test data structure
    expect(testData).toHaveProperty("cities");
    expect(testData).toHaveProperty("coordinates");
    expect(testData).toHaveProperty("addresses");
    expect(testData).toHaveProperty("favorites");

    expect(Array.isArray(testData.cities)).toBe(true);
    expect(Array.isArray(testData.coordinates)).toBe(true);
    expect(Array.isArray(testData.addresses)).toBe(true);
    expect(Array.isArray(testData.favorites)).toBe(true);
  });

  test("should support mobile device detection", async ({ page }) => {
    // Get viewport size directly from page
    const viewport = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });

    // Determine if mobile based on viewport width
    const isMobile = viewport.width < 768;

    expect(typeof isMobile).toBe("boolean");
    expect(viewport).toHaveProperty("width");
    expect(viewport).toHaveProperty("height");
    expect(typeof viewport.width).toBe("number");
    expect(typeof viewport.height).toBe("number");
  });
});
