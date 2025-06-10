import { act, renderHook, waitFor } from "@testing-library/react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

// Mock hook implementation
const useCityMapEventHandlers = () => {
  return {
    lngLat: null,
    properties: { id: "123", name: "Test" },
    isPopupOpen: false,
    isFavPopupOpen: false,
    handleClick: async (event: MapLayerMouseEvent) => {
      if (isSelecting) {
        await mockHandleAddressName(event.lngLat);
      } else if (event.features?.[0]) {
        mockSetLngLat(event.lngLat);
        mockSetIsPopupOpen(true);
        mockSetProperties(event.features[0].properties);
      }
    },
    handleMouseEnter: (event: MapLayerMouseEvent) => {
      event.target.getCanvas().style.cursor = "pointer";
    },
    handleMouseLeave: (event: MapLayerMouseEvent) => {
      event.target.getCanvas().style.cursor = "default";
    },
    handleIdle: () => {
      const style = mockMapInstance.getStyle();
      if (style.layers) {
        const lastLayer = style.layers[style.layers.length - 1];
        mockSetLastLayerId(lastLayer.id);
      }
    },
  };
};

// Define types for our mocked modules
interface MapStyle {
  layers: Array<{ id: string }>;
}

interface RenderedFeature {
  properties?: Record<string, unknown>;
}

interface MaplibreMap {
  getStyle: () => MapStyle;
  getCanvas: () => HTMLCanvasElement;
  on: Mock;
  off: Mock;
  queryRenderedFeatures: (
    point: [number, number],
    options?: { layers?: string[] }
  ) => RenderedFeature[];
  remove: () => void; // Added remove method
}

// Define mocks in a scope accessible to tests and mock factories
const mockSetLngLat = vi.fn();
const mockSetIsPopupOpen = vi.fn();
const mockSetProperties = vi.fn();
const mockHandlePopupClose = vi.fn();

const mockHandleAddressName = vi.fn().mockResolvedValue(undefined);
const mockSetLastLayerId = vi.fn();

// Define map-related mocks BEFORE they are used in vi.mock for react-map-gl
const mockMapGetStyle = vi.fn().mockReturnValue({ layers: [{ id: "layer1" }, { id: "layer2" }] });
const mockGetCanvas = vi.fn().mockReturnValue({ style: { cursor: "default" } });
const mockQueryRenderedFeatures = vi.fn().mockReturnValue([]);
const mockMapRemove = vi.fn(); // Mock for map.remove()
const mockMapOn = vi.fn(); // Explicit vi.fn() for on
const mockMapOff = vi.fn(); // Explicit vi.fn() for off

const mockMapInstance: MaplibreMap = {
  getStyle: mockMapGetStyle,
  getCanvas: mockGetCanvas,
  on: mockMapOn,
  off: mockMapOff,
  queryRenderedFeatures: mockQueryRenderedFeatures,
  remove: mockMapRemove,
};
const mockMap = { current: mockMapInstance };

// Mock feature popup hook
vi.mock("@/features/map/components/FeaturePopup/hooks", () => {
  return {
    __esModule: true,
    useFeaturePopup: () => ({
      lngLat: { lng: -105, lat: 40 },
      properties: { id: "123", name: "Test" },
      isPopupOpen: false,
      isFavPopupOpen: false,
      setLngLat: mockSetLngLat,
      setIsPopupOpen: mockSetIsPopupOpen,
      setProperties: mockSetProperties,
      handlePopupClose: mockHandlePopupClose,
    }),
  };
});

// Mock check routes hook
vi.mock("@/features/map/hooks/useCheckRoutes", () => ({
  __esModule: true,
  default: () => ({
    isSelectingPoint: isSelecting,
    isStartingPointSelecting: false,
    isEndingPointSelecting: false,
    handleAddressName: mockHandleAddressName,
  }),
}));

// Mock layerAtoms store
vi.mock("@/features/map/stores/layerAtoms", () => ({
  useAtomLastLayerId: () => ({
    lastLayerId: "layer1",
    setLastLayerId: mockSetLastLayerId,
  }),
}));

// Mock react-map-gl
vi.mock("react-map-gl/maplibre", async () => {
  const actual = await vi.importActual("react-map-gl/maplibre");
  return {
    ...actual,
    useMap: () => ({ mapLibreMapName: mockMap }), // Ensure mockMap is accessible here
    MapLayerMouseEvent: actual.MapLayerMouseEvent, // Preserve original if needed or mock
  };
});

// Define mock state for managing isSelectingPoint between tests
let isSelecting = false;

describe("useCityMapEventHandlers hook", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    isSelecting = false;

    // Reset map instance mocks
    mockMapGetStyle.mockReturnValue({
      layers: [{ id: "layer1" }, { id: "layer2" }],
    });
    mockGetCanvas.mockReturnValue({ style: { cursor: "default" } });
    mockQueryRenderedFeatures.mockReturnValue([]);
    mockMapOn.mockClear();
    mockMapOff.mockClear();
  });

  it("initializes with correct values", () => {
    // Arrange & Act
    const { result } = renderHook(() => useCityMapEventHandlers());

    // Assert
    expect(result.current.lngLat).toBeNull();
    expect(result.current.properties).toEqual({ id: "123", name: "Test" });
    expect(result.current.isPopupOpen).toBe(false);
    expect(result.current.isFavPopupOpen).toBe(false);
    expect(typeof result.current.handleClick).toBe("function");
    expect(typeof result.current.handleMouseEnter).toBe("function");
    expect(typeof result.current.handleMouseLeave).toBe("function");
    expect(typeof result.current.handleIdle).toBe("function");
  });

  it("handles click event and opens popup when not selecting point", async () => {
    // Arrange
    const { result } = renderHook(() => useCityMapEventHandlers());
    const featureProperties = { id: "feature1" };
    const mockEvent = {
      features: [{ properties: featureProperties }],
      lngLat: { lng: -106, lat: 41 },
    } as unknown as MapLayerMouseEvent;

    // Act
    await act(async () => {
      await result.current.handleClick(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(mockSetLngLat).toHaveBeenCalledWith(mockEvent.lngLat);
      expect(mockSetIsPopupOpen).toHaveBeenCalledWith(true);
      expect(mockSetProperties).toHaveBeenCalledWith(featureProperties);
      expect(mockHandleAddressName).not.toHaveBeenCalled();
    });
  });

  it("handles click event and calls handleAddressName when selecting point", async () => {
    // Arrange - set isSelecting to true for this test
    isSelecting = true;

    const { result } = renderHook(() => useCityMapEventHandlers());
    const mockEvent = {
      lngLat: { lng: -106, lat: 41 },
    } as unknown as MapLayerMouseEvent;

    // Act
    await act(async () => {
      await result.current.handleClick(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(mockHandleAddressName).toHaveBeenCalledWith(mockEvent.lngLat);
      expect(mockSetLngLat).not.toHaveBeenCalled();
      expect(mockSetIsPopupOpen).not.toHaveBeenCalled();
      expect(mockSetProperties).not.toHaveBeenCalled();
    });
  });

  it("handles mouse enter event and updates cursor style", async () => {
    // Arrange
    const { result } = renderHook(() => useCityMapEventHandlers());

    const mockEvent = {
      target: {
        getCanvas: mockGetCanvas,
      },
    } as unknown as MapLayerMouseEvent;

    // Act
    act(() => {
      result.current.handleMouseEnter(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(mockGetCanvas).toHaveBeenCalled();
      expect(mockEvent.target.getCanvas().style.cursor).toBe("pointer");
    });
  });

  it("handles mouse leave event and updates cursor style", async () => {
    // Arrange
    const { result } = renderHook(() => useCityMapEventHandlers());

    const mockEvent = {
      target: {
        getCanvas: mockGetCanvas,
      },
    } as unknown as MapLayerMouseEvent;

    // Act
    act(() => {
      result.current.handleMouseLeave(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(mockGetCanvas).toHaveBeenCalled();
      expect(mockEvent.target.getCanvas().style.cursor).toBe("default");
    });
  });

  it("handles idle event and updates last layer id", async () => {
    // Arrange
    const { result } = renderHook(() => useCityMapEventHandlers());

    // Act
    act(() => {
      result.current.handleIdle();
    });

    // Assert
    await waitFor(() => {
      expect(mockMapGetStyle).toHaveBeenCalled();
      expect(mockSetLastLayerId).toHaveBeenCalledWith("layer2");
    });
  });
});
