import type { CityDictItem } from "@/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  capitalize,
  convertKeysToSnakeCase,
  generateCityDataParams,
  getErrorMessage,
  setCursorStyle,
  transformQueryParams,
  transformToCityListArray,
} from "./misc";

describe("misc utilities", () => {
  describe("capitalize", () => {
    it("should capitalize the first letter of a string", () => {
      // Arrange
      const input = "hello";

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe("Hello");
    });

    it("should convert the rest of the string to lowercase", () => {
      // Arrange
      const input = "hELLO";

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe("Hello");
    });

    it("should handle empty strings", () => {
      // Arrange
      const input = "";

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe("");
    });
  });

  describe("setCursorStyle", () => {
    let mockElement: { style: { cursor: string } };

    beforeEach(() => {
      mockElement = { style: { cursor: "initial" } };
      vi.spyOn(document, "querySelector").mockReturnValue(mockElement as unknown as Element);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should set cursor to crosshair when selecting", () => {
      // Arrange
      const isSelecting = true;

      // Act
      setCursorStyle({ isSelecting });

      // Assert
      expect(mockElement.style.cursor).toBe("crosshair");
    });

    it("should set cursor to default when not selecting", () => {
      // Arrange
      const isSelecting = false;

      // Act
      setCursorStyle({ isSelecting });

      // Assert
      expect(mockElement.style.cursor).toBe("default");
    });

    it("should handle missing canvas element gracefully", () => {
      // Arrange
      vi.spyOn(document, "querySelector").mockReturnValue(null);

      // Act & Assert - should not throw
      expect(() => setCursorStyle({ isSelecting: true })).not.toThrow();
    });
  });

  describe("transformToCityListArray", () => {
    it("should transform dictionary to array with correct properties", () => {
      // Arrange
      const cityDict = {
        new_york: {
          id: 123,
          geometry: { type: "Point", coordinates: [-74, 40.7] },
        },
        san_francisco: {
          id: 456,
          geometry: { type: "Point", coordinates: [-122.4, 37.8] },
        },
      } as unknown as CityDictItem;

      // Act
      const result = transformToCityListArray(cityDict);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          value: expect.any(String),
          label: expect.any(String),
          geometry: expect.any(Object),
        })
      );
    });

    it("should capitalize each word in the label", () => {
      // Arrange
      const cityDict = {
        new_york_city: {
          id: 123,
          geometry: { type: "Point", coordinates: [-74, 40.7] },
        },
      } as unknown as CityDictItem;

      // Act
      const result = transformToCityListArray(cityDict);

      // Assert
      expect(result[0].label).toBe("New York City");
    });

    it("should sort cities alphabetically by label", () => {
      // Arrange
      const cityDict = {
        boston: { id: 1, geometry: { type: "Point", coordinates: [-71, 42.3] } },
        atlanta: { id: 2, geometry: { type: "Point", coordinates: [-84.4, 33.7] } },
        chicago: { id: 3, geometry: { type: "Point", coordinates: [-87.6, 41.9] } },
      } as unknown as CityDictItem;

      // Act
      const result = transformToCityListArray(cityDict);

      // Assert
      expect(result[0].label).toBe("Atlanta");
      expect(result[1].label).toBe("Boston");
      expect(result[2].label).toBe("Chicago");
    });
  });

  describe("transformQueryParams", () => {
    it("should add _centroid suffix when is_centroid is true", () => {
      // Arrange
      const queryParams = ["city_id=123&name=denver&is_centroid=true"];

      // Act
      const result = transformQueryParams(queryParams);

      // Assert
      expect(result).toEqual(["denver_centroid"]);
    });

    it("should return just the name when is_centroid is not present", () => {
      // Arrange
      const queryParams = ["city_id=123&name=denver"];

      // Act
      const result = transformQueryParams(queryParams);

      // Assert
      expect(result).toEqual(["denver"]);
    });

    it("should handle multiple query params correctly", () => {
      // Arrange
      const queryParams = ["city_id=123&name=denver&is_centroid=true", "city_id=456&name=boulder"];

      // Act
      const result = transformQueryParams(queryParams);

      // Assert
      expect(result).toEqual(["denver_centroid", "boulder"]);
    });
  });

  describe("convertKeysToSnakeCase", () => {
    it("should convert camelCase keys to snake_case", () => {
      // Arrange
      const input = { maxDistance: 100, minPrice: 50, totalCount: 10 };

      // Act
      const result = convertKeysToSnakeCase(input);

      // Assert
      expect(result).toEqual({
        max_distance: 100,
        min_price: 50,
        total_count: 10,
      });
    });

    it("should handle already snake_case keys", () => {
      // Arrange
      const input = { max_distance: 100, min_price: 50 };

      // Act
      const result = convertKeysToSnakeCase(input);

      // Assert
      expect(result).toEqual({
        max_distance: 100,
        min_price: 50,
      });
    });

    it("should handle empty objects", () => {
      // Arrange
      const input = {};

      // Act
      const result = convertKeysToSnakeCase(input);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe("generateCityDataParams", () => {
    it("should include parameters for enabled amenities only", () => {
      // Arrange
      const maxDistance = { park: 500, supermarket: 1000, cafe: 300 };
      const isAmenityOn = { park: true, supermarket: false, cafe: true };

      // Act
      const result = generateCityDataParams({ maxDistance, isAmenityOn });

      // Assert
      expect(result).toEqual({
        maxMeterPark: 500,
        maxMeterCafe: 300,
      });
    });

    it("should return empty object when no amenities are enabled", () => {
      // Arrange
      const maxDistance = { park: 500, supermarket: 1000, cafe: 300 };
      const isAmenityOn = { park: false, supermarket: false, cafe: false };

      // Act
      const result = generateCityDataParams({ maxDistance, isAmenityOn });

      // Assert
      expect(result).toEqual({});
    });

    it("should include all parameters when all amenities are enabled", () => {
      // Arrange
      const maxDistance = { park: 500, supermarket: 1000, cafe: 300 };
      const isAmenityOn = { park: true, supermarket: true, cafe: true };

      // Act
      const result = generateCityDataParams({ maxDistance, isAmenityOn });

      // Assert
      expect(result).toEqual({
        maxMeterPark: 500,
        maxMeterSupermarket: 1000,
        maxMeterCafe: 300,
      });
    });
  });

  describe("getErrorMessage", () => {
    it("should return error message when error has message property", () => {
      // Arrange
      const error = new Error("Something went wrong");

      // Act
      const result = getErrorMessage(error);

      // Assert
      expect(result).toBe("Something went wrong");
    });

    it("should return default message when error is null", () => {
      // Arrange
      const error = null;

      // Act
      const result = getErrorMessage(error);

      // Assert
      expect(result).toBe("An error occurred while analyzing apartments.");
    });

    it("should convert non-Error objects to string", () => {
      // Arrange
      const error = "String error" as unknown as Error;

      // Act
      const result = getErrorMessage(error);

      // Assert
      expect(result).toBe("String error");
    });
  });
});
