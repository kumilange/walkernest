import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Base Component class for component-specific interactions
 * Extends BasePage with component-focused functionality
 */
export abstract class BaseComponent extends BasePage {
  protected readonly componentSelector: string;
  protected readonly componentName: string;

  constructor(page: Page, componentSelector: string, componentName: string) {
    super(page);
    this.componentSelector = componentSelector;
    this.componentName = componentName;
  }

  /**
   * Get the root component element
   */
  protected get component(): Locator {
    return this.page.locator(this.componentSelector);
  }

  /**
   * Wait for the component to be visible and loaded
   */
  async waitForComponent(timeout = 5000): Promise<void> {
    await this.component.waitFor({ state: "visible", timeout });
  }

  /**
   * Check if the component is visible
   */
  async isComponentVisible(): Promise<boolean> {
    return await this.isElementVisible(this.componentSelector);
  }

  /**
   * Find element within the component scope
   */
  protected getComponentElement(selector: string): Locator {
    return this.component.locator(selector);
  }

  /**
   * Click element within component with touch support
   */
  async clickComponentElement(selector: string, useTouchEvents = false): Promise<void> {
    const element = this.getComponentElement(selector);
    await element.waitFor({ state: "visible" });

    if (useTouchEvents) {
      await element.dispatchEvent("touchstart");
      await element.dispatchEvent("touchend");
    }

    await element.click();
  }

  /**
   * Type text into component input field
   */
  async typeInComponentInput(
    selector: string,
    text: string,
    options?: { clear?: boolean }
  ): Promise<void> {
    const element = this.getComponentElement(selector);
    await element.waitFor({ state: "visible" });

    if (options?.clear) {
      await element.clear();
    }

    await element.fill(text);
  }

  /**
   * Get text from component element
   */
  async getComponentElementText(selector: string): Promise<string> {
    const element = this.getComponentElement(selector);
    await element.waitFor({ state: "visible" });
    return (await element.textContent()) || "";
  }

  /**
   * Check if component element is enabled
   */
  async isComponentElementEnabled(selector: string): Promise<boolean> {
    const element = this.getComponentElement(selector);
    return await element.isEnabled();
  }

  /**
   * Wait for component element to be hidden
   */
  async waitForComponentElementHidden(selector: string, timeout = 5000): Promise<void> {
    await this.getComponentElement(selector).waitFor({ state: "hidden", timeout });
  }

  /**
   * Validate component state by checking specific attributes
   */
  async validateComponentState(expectedState: Record<string, unknown>): Promise<boolean> {
    // This will be implemented by specific components based on their validation needs
    return true;
  }

  /**
   * Handle component-specific error states
   */
  async handleComponentError(): Promise<void> {
    // Check for common error patterns within the component
    const errorSelectors = ['[role="alert"]', ".error", ".alert-error", '[aria-invalid="true"]'];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(`${this.componentSelector} ${selector}`)) {
        const errorText = await this.getElementText(`${this.componentSelector} ${selector}`);
        throw new Error(`Component ${this.componentName} error: ${errorText}`);
      }
    }
  }
}
