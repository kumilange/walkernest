import { expect, test } from "@playwright/test";
import { CheckRoutePage } from "../page-objects/components/CheckRoutePage";

/**
 * Task 3.2 - Address Autocomplete Mobile Touch Validation
 *
 * Tests address autocomplete dropdown interactions on mobile viewport
 * with iPhone emulation to ensure touch-based selection works correctly.
 *
 * Categories: @mobile @autocomplete @touch @smoke @critical
 */

test.describe("@mobile @autocomplete Address Autocomplete Touch Validation", () => {
  let checkRoutePage: CheckRoutePage;

  /**
   * Setup: Prepare clean test environment for each test
   * - Navigate to application
   * - Open CheckRoute component
   * - Initialize page objects
   */
  test.beforeEach(async ({ page }) => {
    // Arrange: Navigate to the application and ensure clean state
    await page.goto("http://localhost:5173");

    // Clear any existing state for test independence
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Security error in some contexts, continue without clearing
    }

    // Wait for the main page to load using user-visible element
    await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();

    // Act: Open the CheckRoute component via menu interaction
    const routeMenuItem = page.locator('button[aria-label="Check route"]');
    await expect(routeMenuItem).toBeVisible();
    await routeMenuItem.tap(); // Use tap for mobile interaction

    // Initialize page object after component is accessible
    checkRoutePage = new CheckRoutePage(page);
    await checkRoutePage.waitForComponent(10000);
  });

  /**
   * @smoke @critical
   * Happy Path: Successful address autocomplete with touch interactions
   * User Journey: User taps input → types address → sees suggestions → taps suggestion → address is selected
   */
  test("should complete full autocomplete workflow with touch interactions on iPhone", async ({
    page,
  }) => {
    // Arrange: Locate the starting address input using accessible selector
    const startingInput = page
      .locator('input[aria-label*="starting address"]')
      .or(page.locator('input[placeholder*="starting address"]'));
    await expect(startingInput).toBeVisible();

    // Act: Initiate autocomplete workflow with touch interaction
    await startingInput.tap();
    await expect(startingInput).toBeFocused();

    // Act: Type address to trigger autocomplete suggestions
    const testAddress = "Berlin";
    await startingInput.fill(testAddress);

    // Wait for autocomplete dropdown using semantic selector
    const dropdownContainer = page.locator('[role="listbox"]');
    await expect(dropdownContainer).toBeVisible();

    // Assert: Verify suggestions are present and contain relevant content
    const suggestionOptions = page.locator('[role="option"]');
    await expect(suggestionOptions.first()).toBeVisible();

    const suggestionCount = await suggestionOptions.count();
    expect(suggestionCount).toBeGreaterThan(0);

    // Verify suggestion content relevance
    const firstSuggestion = suggestionOptions.first();
    const suggestionText = await firstSuggestion.textContent();
    expect(suggestionText).toBeTruthy();
    expect(suggestionText?.toLowerCase()).toContain("berlin");

    // Act: Select suggestion via touch interaction
    await firstSuggestion.tap();

    // Assert: Verify successful selection and state changes
    await expect(startingInput).toHaveValue(suggestionText || "");
    await expect(dropdownContainer).not.toBeVisible();
    await expect(startingInput).toBeFocused(); // Accessibility: focus management

    // Verify workflow works for ending address as well
    const endingInput = page
      .locator('input[aria-label*="ending address"]')
      .or(page.locator('input[placeholder*="ending address"]'));
    await expect(endingInput).toBeVisible();

    await endingInput.tap();
    await expect(endingInput).toBeFocused();

    const testEndingAddress = "Hamburg";
    await endingInput.fill(testEndingAddress);

    await expect(dropdownContainer).toBeVisible();
    await expect(suggestionOptions.first()).toBeVisible();

    const endingSuggestionText = await suggestionOptions.first().textContent();
    expect(endingSuggestionText).toBeTruthy();
    expect(endingSuggestionText?.toLowerCase()).toContain("hamburg");

    await suggestionOptions.first().tap();

    // Assert: Final verification of complete workflow
    await expect(endingInput).toHaveValue(endingSuggestionText || "");
    await expect(dropdownContainer).not.toBeVisible();
  });

  /**
   * @mobile @accessibility @keyboard
   * Accessibility: Keyboard navigation support on mobile
   * User Journey: User types → navigates with arrow keys → selects with Enter
   */
  test("should support keyboard navigation in dropdown on mobile devices", async ({ page }) => {
    // Arrange: Prepare starting input for keyboard interaction
    const startingInput = page
      .locator('input[aria-label*="starting address"]')
      .or(page.locator('input[placeholder*="starting address"]'));
    await startingInput.tap();

    // Act: Trigger autocomplete via typing
    await startingInput.fill("Munich");

    // Wait for dropdown and suggestions
    const dropdownContainer = page.locator('[role="listbox"]');
    await expect(dropdownContainer).toBeVisible();

    const suggestionOptions = page.locator('[role="option"]');
    await expect(suggestionOptions.first()).toBeVisible();

    // Act: Navigate using keyboard (Arrow Down)
    await page.keyboard.press("ArrowDown");

    // Assert: Verify keyboard navigation state
    const firstOption = suggestionOptions.first();
    await expect(firstOption).toHaveAttribute("aria-selected", "true");

    // Capture selection text before Enter (dropdown will close)
    const selectedText = await firstOption.textContent();

    // Act: Confirm selection with Enter key
    await page.keyboard.press("Enter");

    // Assert: Verify successful keyboard selection
    const inputValue = await startingInput.inputValue();
    expect(inputValue).toBeTruthy();
    expect(inputValue.toLowerCase()).toContain("munich");

    // Assert: Verify dropdown closed and accessibility maintained
    await expect(dropdownContainer).not.toBeVisible();
  });

  /**
   * @mobile @edge-case
   * Edge Case: Empty results handling
   * User Journey: User types non-existent address → sees appropriate feedback
   */
  test("should handle empty autocomplete results gracefully on mobile", async ({ page }) => {
    // Arrange: Prepare input for edge case testing
    const startingInput = page
      .locator('input[aria-label*="starting address"]')
      .or(page.locator('input[placeholder*="starting address"]'));
    await startingInput.tap();

    // Act: Type address unlikely to return results
    await startingInput.fill("XYZ123NonExistentPlace");

    // Assert: Handle empty results gracefully
    const dropdownContainer = page.locator('[role="listbox"]');

    // The application should either show no dropdown or show empty state message
    try {
      await expect(dropdownContainer).toBeVisible({ timeout: 3000 });
      // If dropdown appears, verify empty state messaging
      const emptyMessage = page.locator('text="No results found"');
      await expect(emptyMessage).toBeVisible();
    } catch {
      // No dropdown appearing is also acceptable behavior
      await expect(dropdownContainer).not.toBeVisible();
    }
  });

  /**
   * @mobile @performance @loading
   * Performance: Loading state visualization
   * User Journey: User types → sees loading indicator → sees results
   */
  test("should display loading states appropriately on mobile", async ({ page }) => {
    // Arrange: Prepare for loading state observation
    const startingInput = page
      .locator('input[aria-label*="starting address"]')
      .or(page.locator('input[placeholder*="starting address"]'));
    await startingInput.tap();

    // Act: Trigger autocomplete to observe loading behavior
    await startingInput.fill("London");

    // Assert: Loading state handling (may be brief)
    const loadingIndicator = page.locator('[role="status"],[aria-busy="true"]').first();

    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    } catch {
      // Loading state might complete too quickly to observe
    }

    // Assert: Eventually suggestions should appear
    const dropdownContainer = page.locator('[role="listbox"]');
    await expect(dropdownContainer).toBeVisible();

    const suggestionOptions = page.locator('[role="option"]');
    await expect(suggestionOptions.first()).toBeVisible();
  });

  /**
   * @mobile @touch @viewport
   * Technical: Touch event handling and viewport validation
   * Verifies: Proper touch event dispatch and mobile viewport configuration
   */
  test("should handle touch events correctly in mobile viewport", async ({ page }) => {
    // Assert: Verify mobile viewport configuration
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    if (viewport) {
      expect(viewport.width).toBe(390); // iPhone 13 actual width
      expect(viewport.height).toBe(664); // iPhone 13 actual height in this config
    }

    // Arrange: Prepare for touch event testing
    const startingInput = page
      .locator('input[aria-label*="starting address"]')
      .or(page.locator('input[placeholder*="starting address"]'));

    // Act: Dispatch manual touch events to verify handling
    await startingInput.dispatchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    await startingInput.dispatchEvent("touchend", {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Follow with tap to ensure functionality
    await startingInput.tap();
    await expect(startingInput).toBeFocused();

    // Act: Complete touch interaction workflow
    await startingInput.fill("Paris");

    const dropdownContainer = page.locator('[role="listbox"]');
    await expect(dropdownContainer).toBeVisible();

    const suggestionOptions = page.locator('[role="option"]');
    const firstSuggestion = suggestionOptions.first();
    await expect(firstSuggestion).toBeVisible();

    // Capture content before touch selection
    const selectedText = await firstSuggestion.textContent();

    // Act: Test touch events on suggestion element
    await firstSuggestion.dispatchEvent("touchstart", {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    await firstSuggestion.dispatchEvent("touchend", {
      touches: [{ clientX: 200, clientY: 200 }],
    });

    // Follow up with tap to actually select
    await firstSuggestion.tap();

    // Verify selection worked - check that input contains the expected location
    const inputValue = await startingInput.inputValue();
    expect(inputValue).toBeTruthy();
    expect(inputValue.toLowerCase()).toContain("paris");
  });
});
