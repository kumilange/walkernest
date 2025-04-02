import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NameFavoritePopup from "@/components/popup/name-favorite-popup";
import { LngLat } from "react-map-gl/maplibre";

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
vi.mock("@/atoms", () => ({
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
vi.mock("@/lib/fetcher", () => ({
  fetchFavorites: vi
    .fn()
    .mockImplementation(() => Promise.resolve(mockFeatureResponse)),
}));

// Mock localStorage
vi.mock("@/lib/localstorage", () => ({
  addToLocalStorageList: vi.fn(),
}));

// Mock UI components
vi.mock("react-map-gl/maplibre", () => ({
  Popup: ({ children, onClose }: any) => (
    <div data-testid="mock-popup">
      {children}
      <button data-testid="popup-close" onClick={onClose}>
        Close Popup
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
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
  Input: (props: any) => <input data-testid="mock-input" {...props} />,
}));

vi.mock("@/components/ui/toast", () => ({
  ToastAction: ({ children }: any) => (
    <button data-testid="toast-action">{children}</button>
  ),
}));

vi.mock("@/components/button", () => ({
  CloseButton: ({ handleClose }: any) => (
    <button data-testid="close-button" onClick={handleClose}>
      X
    </button>
  ),
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <div data-testid="mock-form">{children}</div>,
  FormControl: ({ children }: any) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormField: ({ control, name, render }: any) =>
    render({ field: { name, value: "", onChange: vi.fn() } }),
  FormItem: ({ children }: any) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children }: any) => (
    <div data-testid="form-label">{children}</div>
  ),
  FormMessage: () => <div data-testid="form-message"></div>,
}));

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
    const addToLocalStorageList = vi.fn();
    const fetchFavorites = vi.fn().mockResolvedValue(mockFeatureResponse);

    (await import("@/lib/localstorage")).addToLocalStorageList =
      addToLocalStorageList;
    (await import("@/lib/fetcher")).fetchFavorites = fetchFavorites;

    const props = {
      city: mockCity,
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<NameFavoritePopup {...props} />);

    // Mock form submission (since we mocked the form components)
    const formElement = screen.getByTestId("mock-form").querySelector("form");
    if (formElement) {
      fireEvent.submit(formElement);
    }

    // Assert
    await waitFor(() => {
      expect(mockSetFavItems).toHaveBeenCalled();
      expect(mockHandlePopupClose).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Favorites saved successfully.",
        }),
      );
    });
  });
});
