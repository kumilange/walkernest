import { type Locator, type Page, expect } from "@playwright/test";

/**
 * Base Page class providing common functionality for all page objects
 * Following the Page Object Model pattern for maintainable test automation
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = "http://localhost:5173"; // Can be configured via env vars
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path = "/"): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    // Ensure React has rendered
    await this.page.waitForSelector("#root", { state: "visible" });
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector: string, timeout = 5000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: "visible", timeout });
    return element;
  }

  /**
   * Wait for an element to be hidden
   */
  async waitForElementHidden(selector: string, timeout = 5000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: "hidden", timeout });
  }

  /**
   * Click element with both mouse and touch support
   */
  async clickElement(selector: string, options?: { force?: boolean }): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click(options);
  }

  /**
   * Enhanced click for touch devices with proper event handling
   */
  async touchClick(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);

    // For touch devices, we need to handle both touch and click events
    await element.dispatchEvent("touchstart");
    await element.dispatchEvent("touchend");
    await element.click();
  }

  /**
   * Type text into input field
   */
  async typeText(selector: string, text: string, options?: { clear?: boolean }): Promise<void> {
    const element = await this.waitForElement(selector);

    if (options?.clear) {
      await element.clear();
    }

    await element.fill(text);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, option: string | number): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.selectOption(option.toString());
  }

  /**
   * Get text content of element
   */
  async getElementText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return (await element.textContent()) || "";
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: "visible", timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isElementEnabled(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isEnabled();
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `e2e/test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === "string") {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Clear browser storage
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Set localStorage item
   */
  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value });
  }

  /**
   * Get localStorage item
   */
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => localStorage.getItem(key), key);
  }

  /**
   * Press key with proper handling
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }
}
