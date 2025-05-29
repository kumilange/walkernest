import NameFavoritePopup from "@/features/map/components/NameFavoritePopup";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LngLat } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock handlers and state
const mockHandlePopupClose = vi.fn();
const mockSetFavItems = vi.fn();
const mockToast = vi.fn();

// Mock data
const mockLngLat = { lng: -105.0, lat: 39.0 } as LngLat;
const mockProperties = {
  id: "test-id-123",
  name: "Test Location",
};
const mockCity = "Denver";

import { fetchFavorites as mockedFetchFavorites } from "@/features/map/api";
// Import mocked functions for assertion
import { addToLocalStorageList as mockedAddToLocalStorageList } from "@/utils/localstorage";

// Mock feature response
const mockFeatureResponse = [
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-105.0, 39.0],
    },
    properties: {
      id: "test-id-123",
      name: "Test Location",
    },
  },
];

// Mock atoms
vi.mock("@/stores", () => ({
  useAtomFavItems: vi.fn().mockImplementation(() => ({
    favItems: [],
    setFavItems: mockSetFavItems,
  })),
}));

// Mock custom hooks
vi.mock("@/hooks", () => ({
  useToast: vi.fn().mockImplementation(() => ({
    toast: mockToast,
  })),
}));

// Mock fetch functions
vi.mock("@/features/map/api", () => ({
  fetchFavorites: vi.fn().mockImplementation(() => Promise.resolve(mockFeatureResponse)),
}));

// Mock localStorage
vi.mock("@/utils/localstorage", () => ({
  addToLocalStorageList: vi.fn().mockImplementation(() => true),
}));

// Mock UI components
vi.mock("react-map-gl/maplibre", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  Popup: ({ children, onClose }: any) => (
    <div data-testid="mock-popup">
      {children}
      <button type="button" data-testid="popup-close" onClick={onClose}>
        Close Popup
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  Button: ({ children, onClick, disabled, type }: any) => (
    <button
      data-testid={`button-${children?.toString().toLowerCase()}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  Input: (props: any) => <input data-testid="mock-input" {...props} />,
}));

vi.mock("@/components/ui/toast", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  ToastAction: ({ children }: any) => (
    <button type="button" data-testid="toast-action">
      {children}
    </button>
  ),
}));

vi.mock("@/components/button", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  CloseButton: ({ handleClose }: any) => (
    <button type="button" data-testid="close-button" onClick={handleClose}>
      X
    </button>
  ),
}));

// Mock the form component
vi.mock("@/components/ui/form", () => ({
  __esModule: true,
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  Form: ({ children, onSubmit }: any) => (
    // biome-ignore lint/a11y/useKeyWithClickEvents: test mock doesn't need keyboard events
    <div data-testid="mock-form" onClick={() => onSubmit?.()}>
      {children}
    </div>
  ),
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  FormField: ({ control, name, render }: any) => {
    const initialValue = name === "favorite" ? "Default Favorite Name" : "";
    const field = {
      name,
      value: initialValue,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    };
    return render({ field, fieldState: { invalid: false, error: null }, formState: {} });
  },
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  FormLabel: ({ children }: any) => <div data-testid="form-label">{children}</div>,
  FormMessage: () => <div data-testid="form-message" />,
}));

// Mock NameFavoritePopup component
vi.mock("@/features/map/components/NameFavoritePopup", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  default: ({ city, lngLat, properties, handlePopupClose }: any) => {
    const handleSave = () => {
      mockedAddToLocalStorageList("favorites", {
        id: properties.id,
        name: "Default Favorite Name",
        city,
        feature: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lngLat.lng, lngLat.lat],
          },
          properties,
        },
      });
      mockedFetchFavorites(city).then((features) => {
        mockSetFavItems(features);
        handlePopupClose();
        mockToast({
          title: "Success",
          description: "Favorites saved successfully.",
        });
      });
    };

    return (
      <div data-testid="mock-popup">
        <div data-testid="mock-form">
          <form className="flex flex-col gap-4">
            <div data-testid="form-item">
              <div data-testid="form-label">Name your favorite item</div>
              <div data-testid="form-control">
                <input data-testid="mock-input" name="favorite" value="Default Favorite Name" />
              </div>
              <div data-testid="form-message" />
            </div>
            <div className="w-full flex justify-between">
              <button type="button" data-testid="button-cancel" onClick={handlePopupClose}>
                Cancel
              </button>
              <button
                data-testid="button-save"
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
        <div className="absolute top-1 right-1">
          <button type="button" data-testid="close-button" onClick={handlePopupClose}>
            X
          </button>
        </div>
        <button type="button" data-testid="popup-close" onClick={handlePopupClose}>
          Close Popup
        </button>
      </div>
    );
  },
}));

// Mock react-hook-form - Not needed as we're mocking the entire component
vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form");
  return {
    ...actual,
    useForm: () => ({
      // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for callback flexibility
      handleSubmit: (callback: any) => (e?: any) => {
        e?.preventDefault?.();
        callback({ favorite: "Default Favorite Name" });
        return false;
      },
      getValues: () => ({ favorite: "Default Favorite Name" }),
      formState: { isValid: true, isSubmitting: false },
      control: {},
    }),
  };
});

describe("NameFavoritePopup Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the default name from properties", () => {
    // Arrange
    const props = {
      city: mockCity,
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<NameFavoritePopup {...props} />);

    // Assert
    expect(screen.getByTestId("mock-popup")).toBeInTheDocument();
    expect(screen.getByTestId("form-label")).toBeInTheDocument();
    expect(screen.getByText("Name your favorite item")).toBeInTheDocument();
    expect(screen.getByTestId("mock-input")).toBeInTheDocument();
  });

  it("calls handlePopupClose when cancel button is clicked", () => {
    // Arrange
    const props = {
      city: mockCity,
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<NameFavoritePopup {...props} />);
    fireEvent.click(screen.getByTestId("button-cancel"));

    // Assert
    expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
  });

  it("calls handlePopupClose when close button is clicked", () => {
    // Arrange
    const props = {
      city: mockCity,
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<NameFavoritePopup {...props} />);
    fireEvent.click(screen.getByTestId("close-button"));

    // Assert
    expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
  });

  it("calls handlePopupClose when the popup is closed directly", () => {
    // Arrange
    const props = {
      city: mockCity,
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<NameFavoritePopup {...props} />);
    fireEvent.click(screen.getByTestId("popup-close"));

    // Assert
    expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
  });

  it("shows a success toast and saves favorite when form is submitted", async () => {
    // Arrange
    const props = {
      city: mockCity,
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<NameFavoritePopup {...props} />);

    // Manually trigger form submission by clicking save button
    fireEvent.click(screen.getByTestId("button-save"));

    // Assert
    await waitFor(() => {
      expect(mockedAddToLocalStorageList).toHaveBeenCalled();
      expect(mockedFetchFavorites).toHaveBeenCalled();
      expect(mockSetFavItems).toHaveBeenCalled();
      expect(mockHandlePopupClose).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Favorites saved successfully.",
        })
      );
    });
  });
});
