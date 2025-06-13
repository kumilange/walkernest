import { calculateHaversineDistance, getDistanceBetweenCoordinates } from "@/utils/geo";
import { describe, expect, it } from "vitest";

describe("geo utilities", () => {
  describe("calculateHaversineDistance", () => {
    it("should calculate distance between Berlin and Paris correctly", () => {
      // Berlin coordinates
      const berlinLat = 52.52;
      const berlinLng = 13.405;

      // Paris coordinates
      const parisLat = 48.8566;
      const parisLng = 2.3522;

      const distance = calculateHaversineDistance(berlinLat, berlinLng, parisLat, parisLng);

      // Approximate distance between Berlin and Paris is ~878 km
      expect(distance).toBeCloseTo(877, 0);
    });

    it("should return 0 for identical coordinates", () => {
      const lat = 52.52;
      const lng = 13.405;

      const distance = calculateHaversineDistance(lat, lng, lat, lng);

      expect(distance).toBeCloseTo(0, 10);
    });

    it("should calculate short distances accurately", () => {
      // Two points close to each other in Berlin
      const lat1 = 52.52;
      const lng1 = 13.405;
      const lat2 = 52.521; // ~0.1 km difference
      const lng2 = 13.406;

      const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

      // Should be approximately 0.1 km
      expect(distance).toBeCloseTo(0.1, 1);
    });

    it("should handle negative coordinates correctly", () => {
      // Sydney coordinates (negative)
      const sydneyLat = -33.8688;
      const sydneyLng = 151.2093;

      // Melbourne coordinates (negative)
      const melbourneLat = -37.8136;
      const melbourneLng = 144.9631;

      const distance = calculateHaversineDistance(sydneyLat, sydneyLng, melbourneLat, melbourneLng);

      // Approximate distance between Sydney and Melbourne is ~713 km
      expect(distance).toBeCloseTo(713, 0);
    });
  });

  describe("getDistanceBetweenCoordinates", () => {
    it("should work with coordinate objects", () => {
      const berlin = { lat: 52.52, lng: 13.405 };
      const paris = { lat: 48.8566, lng: 2.3522 };

      const distance = getDistanceBetweenCoordinates(berlin, paris);

      // Should be the same as direct function call
      expect(distance).toBeCloseTo(877, 0);
    });

    it("should return 0 for identical coordinate objects", () => {
      const point = { lat: 52.52, lng: 13.405 };

      const distance = getDistanceBetweenCoordinates(point, point);

      expect(distance).toBeCloseTo(0, 10);
    });
  });
});
