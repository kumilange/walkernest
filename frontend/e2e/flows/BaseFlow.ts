import type { Page } from "@playwright/test";
import { BasePage } from "../page-objects/BasePage";

/**
 * Base Flow class for integration flow orchestration
 * Coordinates interactions across multiple components and validates end-to-end scenarios
 */
export abstract class BaseFlow extends BasePage {
  protected readonly flowName: string;
  protected readonly steps: string[] = [];

  constructor(page: Page, flowName: string) {
    super(page);
    this.flowName = flowName;
  }

  /**
   * Execute the complete flow
   */
  abstract executeFlow(...args: unknown[]): Promise<FlowResult>;

  /**
   * Validate the flow completion
   */
  abstract validateFlowCompletion(): Promise<ValidationResult>;

  /**
   * Clean up after flow execution
   */
  async cleanupFlow(): Promise<void> {
    await this.clearStorage();
    // Additional cleanup can be added by specific flows
  }

  /**
   * Log flow step for debugging and reporting
   */
  protected logStep(step: string): void {
    this.steps.push(`${new Date().toISOString()}: ${step}`);
    console.log(`[${this.flowName}] ${step}`);
  }

  /**
   * Validate cross-component state synchronization
   */
  protected async validateStateSync(expectedStates: Record<string, unknown>): Promise<boolean> {
    // Check localStorage state
    for (const [key, expectedValue] of Object.entries(expectedStates)) {
      const actualValue = await this.getLocalStorage(key);
      if (actualValue !== expectedValue) {
        this.logStep(`State mismatch for ${key}: expected ${expectedValue}, got ${actualValue}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Wait for multiple API responses to complete
   */
  protected async waitForMultipleAPIs(
    patterns: (string | RegExp)[],
    timeout = 10000
  ): Promise<void> {
    const promises = patterns.map((pattern) => this.waitForAPIResponse(pattern, timeout));
    await Promise.all(promises);
  }

  /**
   * Handle flow errors with context
   */
  protected async handleFlowError(error: Error, step: string): Promise<void> {
    this.logStep(`Error in step '${step}': ${error.message}`);
    await this.takeScreenshot(`flow-error-${this.flowName}-${step}`);
    throw new Error(`Flow ${this.flowName} failed at step '${step}': ${error.message}`);
  }

  /**
   * Wait for flow completion with timeout
   */
  protected async waitForFlowCompletion(
    validationFn: () => Promise<boolean>,
    timeout = 15000,
    interval = 500
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await validationFn()) {
        return;
      }
      await this.page.waitForTimeout(interval);
    }

    throw new Error(`Flow ${this.flowName} did not complete within ${timeout}ms`);
  }

  /**
   * Get flow execution summary
   */
  getFlowSummary(): FlowSummary {
    return {
      flowName: this.flowName,
      steps: [...this.steps],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Flow execution result interface
 */
export interface FlowResult {
  success: boolean;
  data?: unknown;
  errors?: string[];
  duration?: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  issues?: string[];
  validatedComponents?: string[];
}

/**
 * Flow summary interface
 */
export interface FlowSummary {
  flowName: string;
  steps: string[];
  timestamp: string;
}
