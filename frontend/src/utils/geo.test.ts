import { calculateHaversineDistance, getDistanceBetweenCoordinates } from "./geo";
import { describe, expect, it } from "vitest";

describe("geo utilities", () => {
    describe("calculateHaversineDistance", () => {
        it("should calculate distance between Berlin and Paris correctly", () => {
            // Arrange
            const berlinLat = 52.52;
            const berlinLng = 13.405;
            const parisLat = 48.8566;
            const parisLng = 2.3522;

            // Act
            const distance = calculateHaversineDistance(berlinLat, berlinLng, parisLat, parisLng);

            // Assert - Approximate distance between Berlin and Paris is ~878 km
            expect(distance).toBeCloseTo(877, 0);
        });

        it("should return 0 for identical coordinates", () => {
            // Arrange
            const lat = 52.52;
            const lng = 13.405;

            // Act
            const distance = calculateHaversineDistance(lat, lng, lat, lng);

            // Assert
            expect(distance).toBeCloseTo(0, 10);
        });

        it("should calculate short distances accurately", () => {
            // Arrange - Two points close to each other in Berlin
            const lat1 = 52.52;
            const lng1 = 13.405;
            const lat2 = 52.521; // ~0.1 km difference
            const lng2 = 13.406;

            // Act
            const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

            // Assert - Should be approximately 0.1 km
            expect(distance).toBeCloseTo(0.1, 1);
        });

        it("should handle negative coordinates correctly", () => {
            // Arrange - Sydney and Melbourne coordinates (negative)
            const sydneyLat = -33.8688;
            const sydneyLng = 151.2093;
            const melbourneLat = -37.8136;
            const melbourneLng = 144.9631;

            // Act
            const distance = calculateHaversineDistance(sydneyLat, sydneyLng, melbourneLat, melbourneLng);

            // Assert - Approximate distance between Sydney and Melbourne is ~713 km
            expect(distance).toBeCloseTo(713, 0);
        });
    });

    describe("getDistanceBetweenCoordinates", () => {
        it("should work with coordinate objects", () => {
            // Arrange
            const berlin = { lat: 52.52, lng: 13.405 };
            const paris = { lat: 48.8566, lng: 2.3522 };

            // Act
            const distance = getDistanceBetweenCoordinates(berlin, paris);

            // Assert - Should be the same as direct function call
            expect(distance).toBeCloseTo(877, 0);
        });

        it("should return 0 for identical coordinate objects", () => {
            // Arrange
            const point = { lat: 52.52, lng: 13.405 };

            // Act
            const distance = getDistanceBetweenCoordinates(point, point);

            // Assert
            expect(distance).toBeCloseTo(0, 10);
        });
    });
}); 