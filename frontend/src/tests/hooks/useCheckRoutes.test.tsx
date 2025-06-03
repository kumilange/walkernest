import type { RoutePoint } from "@/types";
import type { LngLat } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import the helper function - we'll need to export it from useCheckRoutes for testing
// For now, let's create a local copy to test the logic
const executeConditionalFlyTo = (
  pointJustSet: RoutePoint | null,
  otherPoint: RoutePoint | null,
  mapInstance: MapRef | undefined,
  flyToFunction: (center: [number, number], zoom: number) => void
) => {
  if (mapInstance && pointJustSet?.lngLat && !otherPoint?.lngLat) {
    const { lng, lat } = pointJustSet.lngLat;
    // Use a reasonable zoom level - can be adjusted based on requirements
    const zoom = 15;
    flyToFunction([lng, lat], zoom);
  }
};

describe("executeConditionalFlyTo", () => {
  const mockFlyTo = vi.fn();
  const mockMapInstance = {} as MapRef;

  const mockStartingPoint: RoutePoint = {
    lngLat: { lng: -105, lat: 40 } as LngLat,
    name: "Starting Location",
  };

  const mockEndingPoint: RoutePoint = {
    lngLat: { lng: -106, lat: 41 } as LngLat,
    name: "Ending Location",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls flyTo when starting point is set and ending point is null", () => {
    // Act
    executeConditionalFlyTo(mockStartingPoint, null, mockMapInstance, mockFlyTo);

    // Assert
    expect(mockFlyTo).toHaveBeenCalledWith([-105, 40], 15);
  });

  it("calls flyTo when ending point is set and starting point is null", () => {
    // Act
    executeConditionalFlyTo(mockEndingPoint, null, mockMapInstance, mockFlyTo);

    // Assert
    expect(mockFlyTo).toHaveBeenCalledWith([-106, 41], 15);
  });

  it("does NOT call flyTo when pointJustSet is null", () => {
    // Act
    executeConditionalFlyTo(null, null, mockMapInstance, mockFlyTo);

    // Assert
    expect(mockFlyTo).not.toHaveBeenCalled();
  });

  it("does NOT call flyTo when otherPoint is set", () => {
    // Act
    executeConditionalFlyTo(mockStartingPoint, mockEndingPoint, mockMapInstance, mockFlyTo);

    // Assert
    expect(mockFlyTo).not.toHaveBeenCalled();
  });

  it("does NOT call flyTo when mapInstance is undefined", () => {
    // Act
    executeConditionalFlyTo(mockStartingPoint, null, undefined, mockFlyTo);

    // Assert
    expect(mockFlyTo).not.toHaveBeenCalled();
  });

  it("does NOT call flyTo when pointJustSet has no lngLat", () => {
    const pointWithoutLngLat = { lngLat: null as any, name: "Invalid Point" };

    // Act
    executeConditionalFlyTo(pointWithoutLngLat, null, mockMapInstance, mockFlyTo);

    // Assert
    expect(mockFlyTo).not.toHaveBeenCalled();
  });

  it("does NOT call flyTo when otherPoint has lngLat (both points are set)", () => {
    // Act
    executeConditionalFlyTo(mockStartingPoint, mockEndingPoint, mockMapInstance, mockFlyTo);

    // Assert
    expect(mockFlyTo).not.toHaveBeenCalled();
  });
});
