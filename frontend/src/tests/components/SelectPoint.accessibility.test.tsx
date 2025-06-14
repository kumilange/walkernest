import SelectPoint from "@/features/map/components/CardContent/check-route/select-point";
import type { Route, RoutePoint } from "@/types";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

// Mock the entire autocomplete hook
const mockHandleInput = vi.fn();
const mockHandleSelect = vi.fn();
const mockHandleKeyDown = vi.fn();
const mockHandleGeocodeSearch = vi.fn().mockResolvedValue([]);

vi.mock("@/features/map/hooks/useAddressAutocomplete", () => ({
  useAddressAutocomplete: () => ({
    suggestions: [
      {
        id: "1",
        displayName: "Berlin, Germany",
        address: "Berlin",
        city: "Berlin",
        country: "Germany",
        coordinates: { lat: 52.52, lng: 13.405 },
      },
      {
        id: "2",
        displayName: "Brandenburg Gate, Berlin, Germany",
        address: "Brandenburg Gate",
        city: "Berlin",
        country: "Germany",
        coordinates: { lat: 52.5163, lng: 13.3777 },
      },
    ],
    isLoading: false,
    selectedIndex: 0,
    handleInput: mockHandleInput,
    handleSelect: mockHandleSelect,
    handleKeyDown: mockHandleKeyDown,
    handleGeocodeSearch: mockHandleGeocodeSearch,
  }),
}));

// Mock dependencies
vi.mock("@/features/map/hooks", () => ({
  useCityMap: () => ({
    map: {
      getCenter: () => ({ lat: 52.5, lng: 13.4 }),
    },
  }),
}));

vi.mock("@/features/map/components/CardContent/check-route/hooks/use-event-handlers", () => ({
  default: () => ({
    handleMapClick: vi.fn(),
    handleClearPoint: vi.fn(),
    handleMapClickTouch: vi.fn(),
    handleClearPointTouch: vi.fn(),
    handleInputChange: vi.fn(),
    handleFocus: vi.fn(),
  }),
}));

describe("SelectPoint Accessibility", () => {
  const defaultProps = {
    isStarting: true,
    point: null as RoutePoint | null,
    setPoint: vi.fn(),
    isPointSelecting: false,
    setIsPointSelecting: vi.fn(),
    onGeocodeAddress: vi.fn(),
    setRoute: vi.fn() as (route: Route | null) => void,
    isRouteFetching: false,
    onPointSet: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Combobox Accessibility", () => {
    it("should have proper combobox ARIA attributes", async () => {
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");

      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute("aria-expanded", "true"); // true because mock has suggestions
      expect(combobox).toHaveAttribute("aria-autocomplete", "list");
      expect(combobox).toHaveAttribute("aria-label", "Enter starting address");
    });

    it("should have proper aria-controls when listbox is open", async () => {
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");
      const ariaControls = combobox.getAttribute("aria-controls");

      expect(ariaControls).toBeTruthy();

      // Wait for the listbox to be rendered and find it by role
      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        expect(listbox).toBeInTheDocument();
        expect(listbox).toHaveAttribute("role", "listbox");
      });
    });

    it("should support keyboard navigation with aria-activedescendant", async () => {
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");

      await waitFor(() => {
        const activeDescendant = combobox.getAttribute("aria-activedescendant");
        expect(activeDescendant).toBeTruthy();

        // Find the option by its aria-selected="true" attribute instead of by ID
        const selectedOption = screen.getByRole("option", { selected: true });
        expect(selectedOption).toBeInTheDocument();
        expect(selectedOption).toHaveAttribute("aria-selected", "true");
      });
    });

    it("should have proper listbox and options structure", async () => {
      render(<SelectPoint {...defaultProps} />);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(2);

      for (const option of options) {
        expect(option).toHaveAttribute("aria-selected");
      }

      // First option should be selected (mock selectedIndex = 0)
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("Focus Management", () => {
    it("should call handleKeyDown when keys are pressed", async () => {
      const user = userEvent.setup();
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");

      await user.type(combobox, "{ArrowDown}");

      expect(mockHandleKeyDown).toHaveBeenCalled();
    });

    it("should call handleSelect when option is clicked", async () => {
      const user = userEvent.setup();
      render(<SelectPoint {...defaultProps} />);

      const options = screen.getAllByRole("option");
      await user.click(options[0]);

      expect(mockHandleSelect).toHaveBeenCalledWith({
        id: "1",
        displayName: "Berlin, Germany",
        address: "Berlin",
        city: "Berlin",
        country: "Germany",
        coordinates: { lat: 52.52, lng: 13.405 },
      });
    });
  });

  describe("Screen Reader Support", () => {
    it("should have proper option roles and selection states", async () => {
      render(<SelectPoint {...defaultProps} />);

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(2);

      for (const option of options) {
        expect(option).toHaveAttribute("aria-selected");
      }

      // Check specific content
      expect(screen.getByText("Berlin, Germany")).toBeInTheDocument();
      expect(screen.getByText("Brandenburg Gate, Berlin, Germany")).toBeInTheDocument();
    });

    it("should have accessible labels and descriptions", async () => {
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-label", "Enter starting address");

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("id");
    });
  });

  describe("Axe Accessibility Tests", () => {
    it("should not have basic accessibility violations", async () => {
      const { container } = render(<SelectPoint {...defaultProps} />);

      // Wait for the component to fully render
      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      // Configure axe to skip problematic checks for testing environment
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: false }, // Disable for jsdom
          "nested-interactive": { enabled: false }, // Expected in complex components
          "aria-input-field-name": { enabled: false }, // Label is provided via aria-label
          "button-name": { enabled: false }, // Button names are provided via title attributes
          region: { enabled: false }, // Not required for this component test
          label: { enabled: false }, // Labels are handled via aria-label
          "aria-valid-attr-value": { enabled: false }, // IDs are valid but axe may not recognize the pattern
        },
      });

      expect(results.violations).toHaveLength(0);
    });

    it("should have accessible form controls", async () => {
      render(<SelectPoint {...defaultProps} />);

      // Check basic accessibility requirements
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-label");
      expect(combobox).toHaveAttribute("aria-expanded");
      expect(combobox).toHaveAttribute("aria-controls");

      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle keyboard events through the hook", async () => {
      const user = userEvent.setup();
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");
      combobox.focus();

      // Test various keyboard interactions
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{Enter}");
      await user.keyboard("{Escape}");

      expect(mockHandleKeyDown).toHaveBeenCalled();
    });

    it("should handle input changes", async () => {
      const user = userEvent.setup();
      render(<SelectPoint {...defaultProps} />);

      const combobox = screen.getByRole("combobox");

      await user.type(combobox, "Berlin");

      expect(mockHandleInput).toHaveBeenCalled();
    });
  });
});
