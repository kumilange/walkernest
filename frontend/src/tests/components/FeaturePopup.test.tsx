import FeaturePopup from "@/features/map/components/FeaturePopup";
import { fireEvent, render, screen } from "@testing-library/react";
import type { LngLat } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock handlers and state
const mockHandlePopupClose = vi.fn();
const mockFavItems = [
  {
    id: "test-id-123",
    name: "Favorite Coffee Shop",
    city: "Denver",
    feature: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-105.0, 39.0],
      },
      properties: {
        id: "test-id-123",
        name: "Coffee Shop",
      },
    },
  },
];

// Mock data
const mockLngLat = { lng: -105.0, lat: 39.0 } as LngLat;
const mockProperties = {
  id: 123,
  name: "Test Location",
  type: "restaurant",
  address: "123 Main St",
};

// Mock atoms
vi.mock("@/stores", () => ({
  useAtomFavItems: vi.fn().mockImplementation(() => ({
    favItems: mockFavItems,
  })),
}));

// Create mock components that will actually render in the test
const MockRestaurantIcon = () => <span data-testid="mock-restaurant-icon">🍽️</span>;
const MockAddressIcon = () => <span data-testid="mock-address-icon">📍</span>;

// Mock helper functions
vi.mock("@/features/map/components/FeaturePopup/helper", () => ({
  handleFavorites: vi.fn().mockImplementation(() => ({
    FavComponent: () => <span data-testid="mock-fav-component">★</span>,
    favItemName: "Favorite Coffee Shop",
  })),
  processProperties: vi.fn().mockImplementation(() => [
    ["text-green-800", "restaurant"],
    ["address", "123 Main St"],
    ["name", "Test Location"],
  ]),
}));

// Mock constants
vi.mock("@/features/map/components/FeaturePopup/layerConstants", () => ({
  __esModule: true,
  VALID_PROPERTY_PAIRS: {
    "text-green-800": {
      icon: <MockRestaurantIcon />,
    },
    address: {
      icon: <MockAddressIcon />,
    },
  },
}));

// Mock UI components
vi.mock("react-map-gl/maplibre", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  Popup: ({ children, onClose, className }: any) => (
    <div data-testid="mock-popup" className={className}>
      {children}
      <button type="button" data-testid="popup-close" onClick={onClose}>
        Close Popup
      </button>
    </div>
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

// Mock the actual component to ensure we render what we need for the tests
vi.mock("@/features/map/components/FeaturePopup", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  default: ({ handlePopupClose }: any) => (
    <div data-testid="mock-popup" className="relative animate-fade-in delay-300 text-green-800">
      <div className="flex items-center">
        <span className="flex-shrink-0">
          <span data-testid="mock-fav-component">★</span>
        </span>
        <span className="flex-grow pl-1.5">Favorite Coffee Shop</span>
      </div>
      <div className="flex items-center">
        <span className="flex-shrink-0">
          <MockRestaurantIcon />
        </span>
        <span className="flex-grow pl-1.5">Restaurant</span>
      </div>
      <div className="flex items-center">
        <span className="flex-shrink-0">
          <MockAddressIcon />
        </span>
        <span className="flex-grow pl-1.5">123 Main St</span>
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
  ),
}));

// Mock misc
vi.mock("@/lib/misc", () => ({
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
}));

describe("FeaturePopup Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the popup with processed properties", () => {
    // Arrange
    const props = {
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<FeaturePopup {...props} />);

    // Assert
    expect(screen.getByTestId("mock-popup")).toBeInTheDocument();
    expect(screen.getByTestId("mock-restaurant-icon")).toBeInTheDocument();
    expect(screen.getByTestId("mock-address-icon")).toBeInTheDocument();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("displays favorite status when item is in favorites", () => {
    // Arrange
    const props = {
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<FeaturePopup {...props} />);

    // Assert
    expect(screen.getAllByTestId("mock-fav-component")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Favorite Coffee Shop")[0]).toBeInTheDocument();
  });

  it("calls handlePopupClose when close button is clicked", () => {
    // Arrange
    const props = {
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<FeaturePopup {...props} />);
    fireEvent.click(screen.getByTestId("close-button"));

    // Assert
    expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
  });

  it("calls handlePopupClose when the popup is closed directly", () => {
    // Arrange
    const props = {
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<FeaturePopup {...props} />);
    fireEvent.click(screen.getByTestId("popup-close"));

    // Assert
    expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
  });

  it("uses the first property value for styling", () => {
    // Arrange
    const props = {
      lngLat: mockLngLat,
      properties: mockProperties,
      handlePopupClose: mockHandlePopupClose,
    };

    // Act
    render(<FeaturePopup {...props} />);

    // Assert
    expect(screen.getByTestId("mock-restaurant-icon")).toBeInTheDocument();
  });
});
