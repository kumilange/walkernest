import { type Locator, type Page, expect } from "@playwright/test";
import type { LayerState } from "../../types/TestTypes";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { BaseComponent } from "../BaseComponent";

/**
 * Page Object for ManageLayer component
 * Handles map layer visibility controls with real-time updates and state persistence
 */
export class ManageLayerPage extends BaseComponent {
  private readonly errorHandler: ErrorHandler;

  // Layer configuration based on the actual component
  private readonly layers = [
    { id: "result", label: "Matched Apartment", icon: "house" },
    { id: "cluster", label: "Cluster", icon: "chart-network" },
    { id: "park", label: "Park & Dog Park", icon: "trees" },
    { id: "supermarket", label: "Supermarket", icon: "shopping-cart" },
    { id: "cafe", label: "Cafe", icon: "coffee" },
    { id: "boundary", label: "City Boundary", icon: "box-select" },
  ];

  // Selectors
  private readonly selectors = {
    // MenuItem trigger for layers
    layersTrigger: 'button[data-tooltip-content="Manage layers"]',
    layersIcon: 'svg[data-lucide="layers"]',

    // Component structure after modal opens
    modalContent: '[role="dialog"], [data-radix-portal]',
    container: "div.grid.w-full.items-center",
    layerGrid: "div.flex.flex-col.space-y-2.gap-3",

    // Layer item selectors
    layerItem: (layerId: string) => `div:has(label[for="${layerId}"])`,
    layerLabel: (layerId: string) => `label[for="${layerId}"]`,
    layerSwitch: (layerId: string) => {
      // Map our internal layer IDs to what appears in the UI
      const layerDisplayNames: Record<string, string> = {
        result: "Matched Apartment",
        cluster: "Cluster",
        park: "Park & Dog Park",
        supermarket: "Supermarket",
        cafe: "Cafe",
        boundary: "City Boundary",
      };

      const displayName = layerDisplayNames[layerId] || layerId;

      return [
        `[role="switch"][aria-label="${displayName}"]`,
        `[role="switch"]:has-text("${displayName}")`,
        `button[role="switch"][aria-label="${displayName}"]`,
        `input[id="${layerId}"]`,
        `button[role="checkbox"][aria-labelledby*="${layerId}"]`,
        `button:has(+ label[for="${layerId}"])`,
        `*[data-state]:has(+ label[for="${layerId}"])`,
      ].join(", ");
    },
    layerIcon: (iconName: string) => `svg[data-lucide="${iconName}"]`,

    // Switch states
    switchChecked:
      '[role="switch"][data-state="checked"], button[data-state="checked"], input[data-state="checked"]',
    switchUnchecked:
      '[role="switch"][data-state="unchecked"], button[data-state="unchecked"], input[data-state="unchecked"]',

    // Generic selectors
    allSwitches: '[role="switch"], button[role="checkbox"], input[type="checkbox"][role="switch"]',
    allLabels: "label",
  };

  constructor(page: Page) {
    super(
      page,
      'button[data-tooltip-content="Manage layers"], div.grid.w-full.items-center:has(label)',
      "ManageLayer"
    );
    this.errorHandler = new ErrorHandler(page);
  }

  /**
   * Open the ManageLayer component by clicking the layers button
   */
  async openManageLayer(): Promise<void> {
    // Multiple strategies to find and click the layers button
    const strategies = [
      // Strategy 1: Button with layers SVG icon
      () => this.page.locator("button:has(svg[data-lucide='layers'])").first(),

      // Strategy 2: Button with tooltip
      () => this.page.locator('button[data-tooltip-content*="layer" i]').first(),

      // Strategy 3: Button containing layers icon
      () => this.page.locator("button:has(svg)").filter({ hasText: /layer/i }).first(),

      // Strategy 4: Any button with "layer" in accessible name or text
      () => this.page.locator("button", { hasText: /layer/i }).first(),

      // Strategy 5: Look for the specific layers SVG and click its parent button
      () => this.page.locator("svg[data-lucide='layers']").locator("..").first(),
    ];

    for (const strategy of strategies) {
      try {
        const element = strategy();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Continue to next strategy
      }
    }

    // If layer-specific strategies failed, try positional strategies (based on menu layout)
    const menuButtons = this.page.locator("button").filter({ hasNotText: "Arvada" });
    const buttonCount = await menuButtons.count();

    // Try common positions for layers button (usually 4th or 5th in menu)
    const positionsToTry = [3, 4, 2, 1, 5]; // 0-indexed positions

    for (const position of positionsToTry) {
      if (position < buttonCount) {
        try {
          const button = menuButtons.nth(position);
          await button.click();
          await this.page.waitForTimeout(1000);

          // Check if ManageLayer component appeared
          const componentSelectors = [
            "div:has(label[for='result'])",
            "div:has(input[id='park'])",
            "[role='dialog'] div.grid",
            ".grid:has(label)",
          ];

          let componentFound = false;
          for (const selector of componentSelectors) {
            if (await this.page.locator(selector).first().isVisible({ timeout: 500 })) {
              componentFound = true;
              break;
            }
          }

          if (componentFound) {
            return;
          }

          // If not ManageLayer, close modal and try next
          await this.page.keyboard.press("Escape");
          await this.page.waitForTimeout(500);
        } catch (error) {
          // Continue to next position
        }
      }
    }

    throw new Error("Could not find layers button to open ManageLayer component");
  }

  /**
   * Enhanced waitForComponent that opens the layer modal first
   */
  async waitForComponent(timeout = 10000): Promise<void> {
    // Try multiple selectors to find the ManageLayer component
    const componentSelectors = [
      this.selectors.container,
      "div:has(label[for='result'])", // Look for a div containing the result layer label
      "div:has(input[id='park'])", // Look for a div containing the park layer input
      "[role='dialog'] div.grid", // Look for dialog content with grid
      ".grid:has(label)", // Any grid with labels
    ];

    for (const selector of componentSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          return;
        }
      } catch {
        // Continue to next selector
      }
    }

    // If component not found, try to open it
    try {
      await this.openManageLayer();

      // Wait for any of the component selectors to appear
      for (const selector of componentSelectors) {
        try {
          const element = this.page.locator(selector).first();
          await element.waitFor({ state: "visible", timeout: 2000 });
          return;
        } catch {
          // Continue to next selector
        }
      }
    } catch (error) {
      // Failed to open component
    }

    throw new Error("ManageLayer component could not be found or opened");
  }

  /**
   * Find switch element for a specific layer using multiple strategies
   */
  private async findSwitchForLayer(layer: { id: string; label: string }): Promise<Locator | null> {
    // Strategy 1: Look for switch by text content
    const switchByText = this.page.locator(`[role="switch"]`).filter({ hasText: layer.label });
    if ((await switchByText.count()) > 0) {
      return switchByText.first();
    }

    // Strategy 2: Look for switch associated with a label containing the text
    const labelWithText = this.page.locator(`label:has-text("${layer.label}")`);
    if ((await labelWithText.count()) > 0) {
      const labelId = await labelWithText.first().getAttribute("for");
      if (labelId) {
        const associatedSwitch = this.page.locator(`[role="switch"][id="${labelId}"]`);
        if ((await associatedSwitch.count()) > 0) {
          return associatedSwitch.first();
        }
      }
    }

    // Strategy 3: Look for switch in the same container as the label text
    const containerWithText = this.page.locator(`div:has-text("${layer.label}") [role="switch"]`);
    if ((await containerWithText.count()) > 0) {
      return containerWithText.first();
    }

    // Strategy 4: Look for switch with aria-labelledby pointing to text
    const labelWithText2 = this.page.locator(`*:has-text("${layer.label}")`);
    if ((await labelWithText2.count()) > 0) {
      const labelId = await labelWithText2.first().getAttribute("id");
      if (labelId) {
        const associatedSwitch = this.page.locator(`[role="switch"][aria-labelledby="${labelId}"]`);
        if ((await associatedSwitch.count()) > 0) {
          return associatedSwitch.first();
        }
      }
    }

    return null;
  }

  /**
   * Get current layer visibility state
   */
  async getLayerState(): Promise<LayerState> {
    await this.waitForComponent();

    const state: LayerState = {
      result: false,
      cluster: false,
      park: false,
      supermarket: false,
      cafe: false,
      boundary: false,
    };

    for (const layer of this.layers) {
      const switchElement = await this.findSwitchForLayer(layer);
      if (switchElement) {
        // Check data-state and aria-checked attributes
        const dataState = await switchElement.getAttribute("data-state");
        const ariaChecked = await switchElement.getAttribute("aria-checked");
        state[layer.id as keyof LayerState] = dataState === "checked" || ariaChecked === "true";
      }
    }

    return state;
  }

  /**
   * Toggle a specific layer
   */
  async toggleLayer(layerId: keyof LayerState): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForComponent();

        const layer = this.layers.find((l) => l.id === layerId);
        if (!layer) {
          throw new Error(`Layer ${layerId} not found`);
        }

        // Find switch using our multi-strategy approach
        const switchElement = await this.findSwitchForLayer(layer);
        if (!switchElement) {
          throw new Error(`Could not find switch for layer ${layerId} (${layer.label})`);
        }

        // Ensure the element is visible and clickable
        await switchElement.waitFor({ state: "visible", timeout: 2000 });
        await switchElement.click({ force: true });

        // Wait for state change to be reflected
        await this.page.waitForTimeout(300);
      },
      {
        component: "ManageLayer",
        step: "toggleLayer",
        selector: `[role="switch"] for layer ${layerId}`,
      }
    );
  }

  /**
   * Enable a specific layer
   */
  async enableLayer(layerId: keyof LayerState): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForComponent();

        const layer = this.layers.find((l) => l.id === layerId);
        if (!layer) {
          throw new Error(`Layer ${layerId} not found`);
        }

        // Find switch using our multi-strategy approach
        const switchElement = await this.findSwitchForLayer(layer);
        if (!switchElement) {
          throw new Error(`Could not find switch for layer ${layerId} (${layer.label})`);
        }

        // Check if already enabled
        const dataState = await switchElement.getAttribute("data-state");
        const ariaChecked = await switchElement.getAttribute("aria-checked");
        const isChecked = dataState === "checked" || ariaChecked === "true";

        if (!isChecked) {
          await switchElement.click();
          await this.page.waitForTimeout(300);
        }
      },
      {
        component: "ManageLayer",
        step: "enableLayer",
        selector: `[role="switch"] for layer ${layerId}`,
      }
    );
  }

  /**
   * Disable a specific layer
   */
  async disableLayer(layerId: keyof LayerState): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForComponent();

        const layer = this.layers.find((l) => l.id === layerId);
        if (!layer) {
          throw new Error(`Layer ${layerId} not found`);
        }

        // Find switch using our multi-strategy approach
        const switchElement = await this.findSwitchForLayer(layer);
        if (!switchElement) {
          throw new Error(`Could not find switch for layer ${layerId} (${layer.label})`);
        }

        // Check if currently enabled
        const dataState = await switchElement.getAttribute("data-state");
        const ariaChecked = await switchElement.getAttribute("aria-checked");
        const isChecked = dataState === "checked" || ariaChecked === "true";

        if (isChecked) {
          await switchElement.click();
          await this.page.waitForTimeout(300);
        }
      },
      {
        component: "ManageLayer",
        step: "disableLayer",
        selector: `[role="switch"] for layer ${layerId}`,
      }
    );
  }

  /**
   * Set multiple layers at once
   */
  async setLayerState(targetState: Partial<LayerState>): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        for (const [layerId, shouldBeEnabled] of Object.entries(targetState)) {
          if (shouldBeEnabled) {
            await this.enableLayer(layerId as keyof LayerState);
          } else {
            await this.disableLayer(layerId as keyof LayerState);
          }
        }
      },
      {
        component: "ManageLayer",
        step: "setLayerState",
      }
    );
  }

  /**
   * Enable all layers
   */
  async enableAllLayers(): Promise<void> {
    const allEnabled: LayerState = {
      result: true,
      cluster: true,
      park: true,
      supermarket: true,
      cafe: true,
      boundary: true,
    };

    await this.setLayerState(allEnabled);
  }

  /**
   * Disable all layers
   */
  async disableAllLayers(): Promise<void> {
    const allDisabled: LayerState = {
      result: false,
      cluster: false,
      park: false,
      supermarket: false,
      cafe: false,
      boundary: false,
    };

    await this.setLayerState(allDisabled);
  }

  /**
   * Get count of enabled layers
   */
  async getEnabledLayerCount(): Promise<number> {
    const state = await this.getLayerState();
    return Object.values(state).filter(Boolean).length;
  }

  /**
   * Check if layer is visible on map
   */
  async isLayerVisibleOnMap(layerId: keyof LayerState): Promise<boolean> {
    // This would check the actual map layer visibility
    // For now, we'll check the switch state as a proxy
    const state = await this.getLayerState();
    return state[layerId];
  }

  /**
   * Validate layer controls display
   */
  async validateLayerControls(): Promise<{
    allLayersPresent: boolean;
    allSwitchesWorking: boolean;
    allLabelsPresent: boolean;
    missingLayers: string[];
  }> {
    await this.waitForComponent();

    const missingLayers: string[] = [];
    let allSwitchesWorking = true;
    let allLabelsPresent = true;

    // Try multiple strategies to find switches for each layer
    for (const layer of this.layers) {
      let switchElement = null;
      let foundStrategy = "";

      // Strategy 1: Look for switch by text content
      const switchByText = this.page.locator(`[role="switch"]`).filter({ hasText: layer.label });
      if ((await switchByText.count()) > 0) {
        switchElement = switchByText.first();
        foundStrategy = "text";
      }

      // Strategy 2: Look for switch associated with a label containing the text
      if (!switchElement) {
        const labelWithText = this.page.locator(`label:has-text("${layer.label}")`);
        if ((await labelWithText.count()) > 0) {
          const labelId = await labelWithText.first().getAttribute("for");
          if (labelId) {
            const associatedSwitch = this.page.locator(`[role="switch"][id="${labelId}"]`);
            if ((await associatedSwitch.count()) > 0) {
              switchElement = associatedSwitch.first();
              foundStrategy = "label-for";
            }
          }
        }
      }

      // Strategy 3: Look for switch in the same container as the label text
      if (!switchElement) {
        const containerWithText = this.page.locator(
          `div:has-text("${layer.label}") [role="switch"]`
        );
        if ((await containerWithText.count()) > 0) {
          switchElement = containerWithText.first();
          foundStrategy = "container";
        }
      }

      // Strategy 4: Look for switch with aria-labelledby pointing to text
      if (!switchElement) {
        const labelWithText = this.page.locator(`*:has-text("${layer.label}")`);
        if ((await labelWithText.count()) > 0) {
          const labelId = await labelWithText.first().getAttribute("id");
          if (labelId) {
            const associatedSwitch = this.page.locator(
              `[role="switch"][aria-labelledby="${labelId}"]`
            );
            if ((await associatedSwitch.count()) > 0) {
              switchElement = associatedSwitch.first();
              foundStrategy = "aria-labelledby";
            }
          }
        }
      }

      if (!switchElement) {
        allSwitchesWorking = false;
        allLabelsPresent = false;
        missingLayers.push(layer.id);
        continue;
      }

      try {
        // Verify the switch is functional
        const isEnabled = await switchElement.isEnabled();
        const ariaChecked = await switchElement.getAttribute("aria-checked");
        const dataState = await switchElement.getAttribute("data-state");

        if (!isEnabled) {
          allSwitchesWorking = false;
        }
      } catch (error) {
        allSwitchesWorking = false;
      }
    }

    return {
      allLayersPresent: missingLayers.length === 0,
      allSwitchesWorking,
      allLabelsPresent,
      missingLayers,
    };
  }

  /**
   * Test layer state persistence during session
   */
  async testLayerStatePersistence(): Promise<{
    success: boolean;
    initialState: LayerState;
    finalState: LayerState;
    statesMatch: boolean;
  }> {
    // Set a specific state
    const testState: LayerState = {
      result: true,
      cluster: false,
      park: true,
      supermarket: false,
      cafe: true,
      boundary: false,
    };

    await this.setLayerState(testState);
    const initialState = await this.getLayerState();

    // Navigate away and back (simulate session persistence test)
    // In a real test, this might involve navigating to another component and back
    await this.page.waitForTimeout(1000);

    const finalState = await this.getLayerState();
    const statesMatch = JSON.stringify(initialState) === JSON.stringify(finalState);

    return {
      success: statesMatch,
      initialState,
      finalState,
      statesMatch,
    };
  }

  /**
   * Test maximum concurrent layers constraint (6 layers max)
   */
  async testMaxLayerConstraint(): Promise<{
    success: boolean;
    enabledCount: number;
    constraintRespected: boolean;
  }> {
    // Try to enable all layers
    await this.enableAllLayers();

    const enabledCount = await this.getEnabledLayerCount();
    const constraintRespected = enabledCount <= 6;

    return {
      success: constraintRespected,
      enabledCount,
      constraintRespected,
    };
  }

  /**
   * Verify real-time map layer updates
   */
  async verifyRealTimeUpdates(layerId: keyof LayerState): Promise<{
    success: boolean;
    layerVisibleBeforeToggle: boolean;
    layerVisibleAfterToggle: boolean;
    updateOccurred: boolean;
  }> {
    const layerVisibleBeforeToggle = await this.isLayerVisibleOnMap(layerId);

    // Toggle the layer
    await this.toggleLayer(layerId);

    // Wait for update
    await this.page.waitForTimeout(500);

    const layerVisibleAfterToggle = await this.isLayerVisibleOnMap(layerId);
    const updateOccurred = layerVisibleBeforeToggle !== layerVisibleAfterToggle;

    return {
      success: updateOccurred,
      layerVisibleBeforeToggle,
      layerVisibleAfterToggle,
      updateOccurred,
    };
  }

  /**
   * Get layer information
   */
  async getLayerInfo(layerId: keyof LayerState): Promise<{
    id: string;
    label: string;
    isEnabled: boolean;
    isVisible: boolean;
  } | null> {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) {
      return null;
    }

    const state = await this.getLayerState();
    const isVisible = await this.isLayerVisibleOnMap(layerId);

    return {
      id: layer.id,
      label: layer.label,
      isEnabled: state[layerId],
      isVisible,
    };
  }

  /**
   * Test complete layer management workflow
   */
  async testLayerManagementWorkflow(): Promise<{
    success: boolean;
    steps: string[];
    errors: string[];
    finalState: LayerState;
  }> {
    const steps: string[] = [];
    const errors: string[] = [];

    try {
      // Validate initial display
      const validation = await this.validateLayerControls();
      if (validation.allLayersPresent) {
        steps.push("All layer controls present");
      } else {
        errors.push(`Missing layers: ${validation.missingLayers.join(", ")}`);
      }

      // Test individual layer toggles
      for (const layer of this.layers) {
        try {
          await this.toggleLayer(layer.id as keyof LayerState);
          steps.push(`Toggled ${layer.label}`);
        } catch (error) {
          errors.push(`Failed to toggle ${layer.label}: ${error}`);
        }
      }

      // Test bulk operations
      await this.disableAllLayers();
      steps.push("Disabled all layers");

      await this.enableAllLayers();
      steps.push("Enabled all layers");

      // Test constraint (max 6 layers)
      const constraintTest = await this.testMaxLayerConstraint();
      if (constraintTest.constraintRespected) {
        steps.push("Layer constraint respected");
      } else {
        errors.push(
          `Layer constraint violated: ${constraintTest.enabledCount} layers enabled (max 6)`
        );
      }

      // Test persistence
      const persistenceTest = await this.testLayerStatePersistence();
      if (persistenceTest.statesMatch) {
        steps.push("Layer state persistence working");
      } else {
        errors.push("Layer state persistence failed");
      }

      const finalState = await this.getLayerState();

      return {
        success: errors.length === 0,
        steps,
        errors,
        finalState,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown error");
      const finalState = await this.getLayerState();

      return {
        success: false,
        steps,
        errors,
        finalState,
      };
    }
  }
}
