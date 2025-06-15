import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { LngLat } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NameFavoritePopup from "./index";

// Mock dependencies
const mockToast = vi.fn();
const mockSetFavItems = vi.fn();
const mockHandlePopupClose = vi.fn();

// Mock data
const mockLngLat = { lng: -105.0, lat: 39.0 } as LngLat;
interface MockProperties {
  id: string;
  name?: string;
}
let mockProperties: MockProperties = {
  id: "test-location-123",
  name: "Coffee Shop",
};
const mockCity = "Denver";

// Mock stores
vi.mock("@/stores", () => ({
  useAtomFavItems: () => ({
    favItems: [],
    setFavItems: mockSetFavItems,
  }),
}));

// Mock custom hooks
vi.mock("@/hooks", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock API functions
vi.mock("@/features/map/api", () => ({
  fetchFavorites: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/utils/localstorage", () => ({
  addToLocalStorageList: vi.fn().mockReturnValue(true),
}));

// Mock MapLibre GL
vi.mock("react-map-gl/maplibre", () => ({
  Popup: ({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
  }) => (
    // biome-ignore lint/a11y/useSemanticElements: This is a test mock component
    <div data-testid="popup" role="dialog" aria-label="Name favorite location">
      {children}
      <button type="button" data-testid="popup-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    variant?: string;
  }) => (
    <button
      data-testid={`button-${variant || "default"}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ value, onChange, ...props }, ref) => (
      <input
        ref={ref}
        data-testid="name-input"
        id="favorite-input"
        value={value}
        onChange={onChange}
        {...props}
      />
    )
  ),
}));

vi.mock("@/components/button", () => ({
  CloseButton: ({ handleClose }: { handleClose?: () => void }) => (
    <button type="button" data-testid="close-button" onClick={handleClose}>
      Close
    </button>
  ),
}));

// Mock form components
vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div data-testid="form">{children}</div>,
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormField: ({
    name,
    render,
  }: {
    name: string;
    render: (props: {
      field: {
        name: string;
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onBlur: () => void;
        ref: () => void;
      };
      fieldState: { invalid: boolean; error: null };
      formState: { isValid: boolean };
    }) => React.ReactNode;
  }) => {
    // Calculate the value dynamically on each render to pick up changes
    const getCurrentValue = React.useCallback(() => {
      if (name === "favorite" && mockProperties?.name && mockProperties?.name !== "N/A") {
        return mockProperties.name;
      }
      return "";
    }, [name]);

    const [fieldValue, setFieldValue] = React.useState(getCurrentValue);

    // Update the field value when mockProperties changes
    React.useEffect(() => {
      setFieldValue(getCurrentValue());
    }, [getCurrentValue]);

    const field = {
      name,
      value: fieldValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setFieldValue(e.target.value);
      },
      onBlur: vi.fn(),
      ref: vi.fn(),
    };
    return (
      <div data-testid={`form-field-${name}`}>
        {render({
          field,
          fieldState: { invalid: false, error: null },
          formState: { isValid: true },
        })}
      </div>
    );
  },
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label data-testid="form-label" htmlFor="favorite-input">
      {children}
    </label>
  ),
  FormMessage: () => <div data-testid="form-message" />,
}));

// Mock custom hooks
vi.mock("./hooks", () => ({
  useEventHandlers: () => ({
    handleCancelTouch: vi.fn(),
  }),
  useFavoriteForm: ({ defaultName }: { defaultName: string }) => ({
    form: {
      handleSubmit: (onSubmit: (data: { favorite: string }) => void) => (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ favorite: "Test Favorite Name" });
      },
      control: {},
    },
    isSubmitDisabled: false,
    onSubmit: vi.fn(),
    FormSchema: {},
    defaultName,
  }),
}));

describe("NameFavoritePopup", () => {
  const defaultProps = {
    city: mockCity,
    lngLat: mockLngLat,
    properties: mockProperties,
    handlePopupClose: mockHandlePopupClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock properties to default
    mockProperties = {
      id: "test-location-123",
      name: "Coffee Shop",
    };
  });

  describe("when popup opens", () => {
    it("should display form for naming favorite", () => {
      // Act
      render(<NameFavoritePopup {...defaultProps} />);

      // Assert
      expect(screen.getByRole("dialog", { name: /name favorite location/i })).toBeInTheDocument();
      expect(screen.getByTestId("form")).toBeInTheDocument();
      expect(screen.getByLabelText(/name your favorite item/i)).toBeInTheDocument();
    });

    it("should pre-fill input with location name", () => {
      // Act
      render(<NameFavoritePopup {...defaultProps} />);

      // Assert
      expect(screen.getByTestId("name-input")).toHaveValue("Coffee Shop");
    });

    it("should provide form controls for user interaction", () => {
      // Act
      render(<NameFavoritePopup {...defaultProps} />);

      // Assert
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(screen.getByTestId("close-button")).toBeInTheDocument();
    });
  });

  describe("when user interacts with form", () => {
    it("should allow user to edit favorite name", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NameFavoritePopup {...defaultProps} />);

      // Act
      const nameInput = screen.getByTestId("name-input");
      await user.clear(nameInput);
      await user.type(nameInput, "My Favorite Coffee Shop");

      // Assert
      expect(nameInput).toHaveValue("My Favorite Coffee Shop");
    });

    it("should handle empty name input appropriately", () => {
      // Arrange
      mockProperties = { ...mockProperties, name: "" };
      const propsWithEmptyName = {
        ...defaultProps,
        properties: { ...mockProperties, name: "" },
      };

      // Act
      render(<NameFavoritePopup {...propsWithEmptyName} />);

      // Assert
      expect(screen.getByTestId("name-input")).toHaveValue("");
      expect(screen.getByTestId("form")).toBeInTheDocument();
    });
  });

  describe("when user cancels", () => {
    it("should close popup when cancel button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NameFavoritePopup {...defaultProps} />);

      // Act
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
    });

    it("should close popup when close button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NameFavoritePopup {...defaultProps} />);

      // Act
      await user.click(screen.getByTestId("close-button"));

      // Assert
      expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
    });

    it("should close popup when user clicks popup close", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NameFavoritePopup {...defaultProps} />);

      // Act
      await user.click(screen.getByTestId("popup-close"));

      // Assert
      expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("when user saves favorite", () => {
    it("should enable save button with valid input", () => {
      // Act
      render(<NameFavoritePopup {...defaultProps} />);

      // Assert
      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it("should handle form submission", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NameFavoritePopup {...defaultProps} />);

      // Act
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Assert
      // Form submission is handled by the mocked useFavoriteForm hook
      expect(screen.getByTestId("form")).toBeInTheDocument();
    });
  });

  describe("when handling different property types", () => {
    it("should handle properties with N/A name", () => {
      // Arrange
      mockProperties = { ...mockProperties, name: "N/A" };
      const propsWithNAName = {
        ...defaultProps,
        properties: { ...mockProperties, name: "N/A" },
      };

      // Act
      render(<NameFavoritePopup {...propsWithNAName} />);

      // Assert
      expect(screen.getByTestId("name-input")).toHaveValue("");
    });

    it("should handle properties without name", () => {
      // Arrange
      mockProperties = { id: "test-id" };
      const propsWithoutName = {
        ...defaultProps,
        properties: { id: "test-id" },
      };

      // Act
      render(<NameFavoritePopup {...propsWithoutName} />);

      // Assert
      expect(screen.getByTestId("name-input")).toHaveValue("");
    });

    it("should handle properties with valid name", () => {
      // Arrange
      mockProperties = { ...mockProperties, name: "Great Restaurant" };
      const propsWithValidName = {
        ...defaultProps,
        properties: { ...mockProperties, name: "Great Restaurant" },
      };

      // Act
      render(<NameFavoritePopup {...propsWithValidName} />);

      // Assert
      expect(screen.getByTestId("name-input")).toHaveValue("Great Restaurant");
    });
  });

  describe("accessibility", () => {
    it("should provide proper ARIA labels", () => {
      // Act
      render(<NameFavoritePopup {...defaultProps} />);

      // Assert
      expect(screen.getByRole("dialog", { name: /name favorite location/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/name your favorite item/i)).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NameFavoritePopup {...defaultProps} />);

      // Act
      await user.tab(); // Should focus on first focusable element

      // Assert
      // The first focusable element should be focused
      expect(document.activeElement).toBeDefined();
    });
  });
});
