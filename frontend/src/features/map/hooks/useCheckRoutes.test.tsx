import { executeConditionalFlyTo } from "./useCheckRoutes";
import type { RoutePoint } from "@/types";
import type { LngLat } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

    describe("when should trigger flyTo", () => {
        it("should fly to starting point when ending point is null", () => {
            // Arrange
            const pointJustSet = mockStartingPoint;
            const otherPoint = null;

            // Act
            executeConditionalFlyTo(pointJustSet, otherPoint, mockMapInstance, mockFlyTo);

            // Assert
            expect(mockFlyTo).toHaveBeenCalledWith([-105, 40], 15);
        });

        it("should fly to ending point when starting point is null", () => {
            // Arrange
            const pointJustSet = mockEndingPoint;
            const otherPoint = null;

            // Act
            executeConditionalFlyTo(pointJustSet, otherPoint, mockMapInstance, mockFlyTo);

            // Assert
            expect(mockFlyTo).toHaveBeenCalledWith([-106, 41], 15);
        });
    });

    describe("when should not trigger flyTo", () => {
        it("should not fly when pointJustSet is null", () => {
            // Arrange
            const pointJustSet = null;
            const otherPoint = null;

            // Act
            executeConditionalFlyTo(pointJustSet, otherPoint, mockMapInstance, mockFlyTo);

            // Assert
            expect(mockFlyTo).not.toHaveBeenCalled();
        });

        it("should not fly when both points are set", () => {
            // Arrange
            const pointJustSet = mockStartingPoint;
            const otherPoint = mockEndingPoint;

            // Act
            executeConditionalFlyTo(pointJustSet, otherPoint, mockMapInstance, mockFlyTo);

            // Assert
            expect(mockFlyTo).not.toHaveBeenCalled();
        });

        it("should not fly when mapInstance is undefined", () => {
            // Arrange
            const pointJustSet = mockStartingPoint;
            const otherPoint = null;
            const mapInstance = undefined;

            // Act
            executeConditionalFlyTo(pointJustSet, otherPoint, mapInstance, mockFlyTo);

            // Assert
            expect(mockFlyTo).not.toHaveBeenCalled();
        });
    });
}); 