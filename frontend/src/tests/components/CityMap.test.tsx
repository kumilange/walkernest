import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CityMap from "@/components/city-map";
import { useAtomCity } from "@/atoms";

// Mock react-query
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: null,
    isError: false,
    error: null,
    isFetching: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  }),
}));

// Mock fetcher.ts to avoid using actual useQuery
vi.mock("@/lib/fetcher", () => ({
  useAnalysis: () => ({
    data: null,
    isError: false,
    error: null,
    isFetching: false,
  }),
  fetchAddressName: vi.fn(),
  fetchRoute: vi.fn(),
  fetchAnalysis: vi.fn(),
}));

// Mocks
vi.mock("@/atoms", () => ({
  useAtomCity: vi.fn(),
  useAtomRoute: () => ({
    route: null,
    setRoute: vi.fn(),
    startingPoint: null,
    setStartingPoint: vi.fn(),
    endingPoint: null,
    setEndingPoint: vi.fn(),
    isStartingPointSelecting: false,
    setIsStartingPointSelecting: vi.fn(),
    isEndingPointSelecting: false,
    setIsEndingPointSelecting: vi.fn(),
  }),
  useAtomMaxDistance: () => ({
    maxDistance: { park: 320, supermarket: 800, cafe: 800 },
    setMaxDistance: vi.fn(),
  }),
  useAtomIsAmenityOn: () => ({
    isAmenityOn: { park: true, supermarket: true, cafe: true },
    setIsAmenityOn: vi.fn(),
  }),
}));

vi.mock("@/constants", () => ({
  CITY_LIST_DICT: {
    Denver: { id: 1 },
    Boulder: { id: 2 },
  },
}));

vi.mock("react-map-gl/maplibre", () => ({
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map">{children}</div>
  ),
  ScaleControl: () => <div data-testid="mock-scale-control"></div>,
  NavigationControl: () => <div data-testid="mock-navigation-control"></div>,
  useMap: () => ({ map: { getBounds: () => ({}), fitBounds: vi.fn() } }),
}));

vi.mock("@/components/layer", () => ({
  default: () => <div data-testid="mock-layer-manager"></div>,
}));

vi.mock("@/components/popup", () => ({
  FeaturePopup: () => <div data-testid="mock-feature-popup"></div>,
  NameFavoritePopup: () => <div data-testid="mock-name-favorite-popup"></div>,
}));

vi.mock("@/components/city-map/hooks", () => ({
  useEventHandlers: () => ({
    lngLat: { lng: 0, lat: 0 },
    properties: { id: 1, name: "Test" },
    isPopupOpen: false,
    isFavPopupOpen: false,
    handleIdle: vi.fn(),
    handleClick: vi.fn(),
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handlePopupClose: vi.fn(),
  }),
  useSyncFavorites: vi.fn(),
}));

vi.mock("@/hooks/use-city-map", () => ({
  default: () => ({
    fitToBounds: vi.fn(),
    flyToCoordinates: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-check-routes", () => ({
  default: () => ({
    interactiveLayerIds: [],
    routeLayerId: "route-layer",
  }),
}));

describe("CityMap Component", () => {
  beforeEach(() => {
    (useAtomCity as any).mockReturnValue({ city: null });
  });

  it("renders the map without crashing", () => {
    // Act
    render(<CityMap />);

    // Assert
    expect(screen.getByTestId("mock-map")).toBeInTheDocument();
    expect(screen.getByTestId("mock-layer-manager")).toBeInTheDocument();
    expect(screen.getByTestId("mock-navigation-control")).toBeInTheDocument();
    expect(screen.getByTestId("mock-scale-control")).toBeInTheDocument();
  });

  it("does not render popup when isPopupOpen is false", () => {
    // Act
    render(<CityMap />);

    // Assert
    expect(screen.queryByTestId("mock-feature-popup")).not.toBeInTheDocument();
  });

  it("renders with selected city", () => {
    // Arrange
    (useAtomCity as any).mockReturnValue({ city: "Denver" });

    // Act
    render(<CityMap />);

    // Assert
    expect(screen.getByTestId("mock-layer-manager")).toBeInTheDocument();
  });
});
