import { useAtomCity } from "@/stores";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CityMap from "./index";

// Mock external dependencies
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

// Mock map API
vi.mock("@/features/map/api", () => ({
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

// Mock store atoms
vi.mock("@/stores", () => ({
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

const mockUseAtomCity = vi.mocked(useAtomCity);

vi.mock("@/constants", () => ({
  CITY_LIST_DICT: {
    Denver: { id: 1 },
    Boulder: { id: 2 },
  },
}));

// Mock MapLibre GL components
vi.mock("react-map-gl/maplibre", () => ({
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map" role="application" aria-label="Interactive map">
      {children}
    </div>
  ),
  ScaleControl: () => <div data-testid="scale-control" />,
  NavigationControl: () => <div data-testid="navigation-control" />,
  useMap: () => ({ map: { getBounds: () => ({}), fitBounds: vi.fn() } }),
}));

// Mock child components
vi.mock("../../layers", () => ({
  default: () => <div data-testid="layer-manager" />,
}));

vi.mock("../FeaturePopup", () => ({
  default: () => <div data-testid="feature-popup" />,
}));

vi.mock("../NameFavoritePopup", () => ({
  default: () => <div data-testid="name-favorite-popup" />,
}));

vi.mock("../AnalysisProgressDialog", () => ({
  default: () => <div data-testid="analysis-progress-dialog" />,
}));

// Mock custom hooks
vi.mock("./hooks", () => ({
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

vi.mock("../../hooks/useCityMap", () => ({
  default: () => ({
    fitToBounds: vi.fn(),
    flyToCoordinates: vi.fn(),
  }),
}));

vi.mock("../../hooks/useCheckRoutes", () => ({
  default: () => ({
    interactiveLayerIds: [],
    routeLayerId: "route-layer",
  }),
}));

describe("CityMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no city is selected", () => {
    beforeEach(() => {
      mockUseAtomCity.mockReturnValue({ city: null, setCity: vi.fn() });
    });

    it("should render map interface without city-specific content", () => {
      // Act
      render(<CityMap />);

      // Assert
      expect(screen.getByRole("application", { name: /interactive map/i })).toBeInTheDocument();
      expect(screen.getByTestId("layer-manager")).toBeInTheDocument();
      expect(screen.getByTestId("navigation-control")).toBeInTheDocument();
      expect(screen.getByTestId("scale-control")).toBeInTheDocument();
    });

    it("should not render analysis progress dialog", () => {
      // Act
      render(<CityMap />);

      // Assert
      expect(screen.queryByTestId("analysis-progress-dialog")).not.toBeInTheDocument();
    });
  });

  describe("when city is selected", () => {
    beforeEach(() => {
      mockUseAtomCity.mockReturnValue({ city: "Denver", setCity: vi.fn() });
    });

    it("should render map with city-specific features", () => {
      // Act
      render(<CityMap />);

      // Assert
      expect(screen.getByRole("application", { name: /interactive map/i })).toBeInTheDocument();
      expect(screen.getByTestId("layer-manager")).toBeInTheDocument();
      expect(screen.getByTestId("analysis-progress-dialog")).toBeInTheDocument();
    });

    it("should provide map navigation controls", () => {
      // Act
      render(<CityMap />);

      // Assert
      expect(screen.getByTestId("navigation-control")).toBeInTheDocument();
      expect(screen.getByTestId("scale-control")).toBeInTheDocument();
    });
  });

  describe("when map is interactive", () => {
    beforeEach(() => {
      mockUseAtomCity.mockReturnValue({ city: "Denver", setCity: vi.fn() });
    });

    it("should render all essential map components", () => {
      // Act
      render(<CityMap />);

      // Assert
      expect(screen.getByTestId("layer-manager")).toBeInTheDocument();
      expect(screen.getByTestId("navigation-control")).toBeInTheDocument();
      expect(screen.getByTestId("scale-control")).toBeInTheDocument();
    });

    it("should be accessible with proper ARIA labels", () => {
      // Act
      render(<CityMap />);

      // Assert
      const map = screen.getByRole("application", { name: /interactive map/i });
      expect(map).toBeInTheDocument();
    });
  });
});
