import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  capitalize,
  setCursorStyle,
  transformToCityListArray,
  transformQueryParams,
  convertKeysToSnakeCase,
  generateCityDataParams,
} from "@/lib/misc";
import type { CityDictItem } from "@/types";

describe("capitalize function", () => {
  it("capitalizes the first letter of a string", () => {
    // Arrange
    const input = "hello";

    // Act
    const result = capitalize(input);

    // Assert
    expect(result).toBe("Hello");
  });

  it("converts the rest of the string to lowercase", () => {
    // Arrange
    const input = "hELLO";

    // Act
    const result = capitalize(input);

    // Assert
    expect(result).toBe("Hello");
  });

  it("handles empty strings", () => {
    // Arrange
    const input = "";

    // Act
    const result = capitalize(input);

    // Assert
    expect(result).toBe("");
  });
});

describe("setCursorStyle function", () => {
  // Setup mock DOM element
  beforeEach(() => {
    // Mock the document.querySelector
    document.querySelector = vi.fn().mockImplementation(() => ({
      style: {
        cursor: "initial",
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets cursor to crosshair when isSelecting is true", () => {
    // Arrange
    const mockElement = { style: { cursor: "initial" } };
    (document.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(
      mockElement,
    );

    // Act
    setCursorStyle({ isSelecting: true });

    // Assert
    expect(mockElement.style.cursor).toBe("crosshair");
  });

  it("sets cursor to default when isSelecting is false", () => {
    // Arrange
    const mockElement = { style: { cursor: "initial" } };
    (document.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(
      mockElement,
    );

    // Act
    setCursorStyle({ isSelecting: false });

    // Assert
    expect(mockElement.style.cursor).toBe("default");
  });

  it("does nothing when canvas element is not found", () => {
    // Arrange
    (document.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(null);

    // Act & Assert (should not throw)
    expect(() => setCursorStyle({ isSelecting: true })).not.toThrow();
  });
});

describe("transformToCityListArray function", () => {
  it("transforms dictionary to array with correct properties", () => {
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
      }),
    );
  });

  it("capitalizes each word in the label", () => {
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

  it("sorts cities alphabetically by label", () => {
    // Arrange
    const cityDict = {
      boston: { id: 1, geometry: { type: "Point", coordinates: [-71, 42.3] } },
      atlanta: {
        id: 2,
        geometry: { type: "Point", coordinates: [-84.4, 33.7] },
      },
      chicago: {
        id: 3,
        geometry: { type: "Point", coordinates: [-87.6, 41.9] },
      },
    } as unknown as CityDictItem;

    // Act
    const result = transformToCityListArray(cityDict);

    // Assert
    expect(result[0].label).toBe("Atlanta");
    expect(result[1].label).toBe("Boston");
    expect(result[2].label).toBe("Chicago");
  });
});

describe("transformQueryParams function", () => {
  it("transforms query params with is_centroid=true to include _centroid suffix", () => {
    // Arrange
    const queryParams = ["city_id=123&name=denver&is_centroid=true"];

    // Act
    const result = transformQueryParams(queryParams);

    // Assert
    expect(result).toEqual(["denver_centroid"]);
  });

  it("transforms query params without is_centroid to return just the name", () => {
    // Arrange
    const queryParams = ["city_id=123&name=denver"];

    // Act
    const result = transformQueryParams(queryParams);

    // Assert
    expect(result).toEqual(["denver"]);
  });

  it("handles multiple query params", () => {
    // Arrange
    const queryParams = [
      "city_id=123&name=denver&is_centroid=true",
      "city_id=456&name=boulder",
    ];

    // Act
    const result = transformQueryParams(queryParams);

    // Assert
    expect(result).toEqual(["denver_centroid", "boulder"]);
  });
});

describe("convertKeysToSnakeCase function", () => {
  it("converts camelCase keys to snake_case", () => {
    // Arrange
    const camelCaseObj = {
      maxPark: 500,
      maxSupermarket: 300,
      walkingDistance: 1000,
    };

    // Act
    const result = convertKeysToSnakeCase(camelCaseObj);

    // Assert
    expect(result).toEqual({
      max_park: 500,
      max_supermarket: 300,
      walking_distance: 1000,
    });
  });

  it("handles already snake_case keys", () => {
    // Arrange
    const obj = {
      max_park: 500,
      walking_distance: 1000,
    };

    // Act
    const result = convertKeysToSnakeCase(obj);

    // Assert
    expect(result).toEqual({
      max_park: 500,
      walking_distance: 1000,
    });
  });

  it("handles empty objects", () => {
    // Arrange
    const emptyObj = {};

    // Act
    const result = convertKeysToSnakeCase(emptyObj);

    // Assert
    expect(result).toEqual({});
  });
});

describe("generateCityDataParams function", () => {
  it("includes parameters only for amenities that are enabled", () => {
    // Arrange
    const maxDistance = {
      park: 500,
      supermarket: 300,
      cafe: 200,
    };
    const isAmenityOn = {
      park: true,
      supermarket: false,
      cafe: true,
    };

    // Act
    const result = generateCityDataParams({ maxDistance, isAmenityOn });

    // Assert
    expect(result).toHaveProperty("maxMeterPark", 500);
    expect(result).toHaveProperty("maxMeterCafe", 200);
    expect(result).not.toHaveProperty("maxMeterSupermarket");
  });

  it("returns empty object when all amenities are off", () => {
    // Arrange
    const maxDistance = {
      park: 500,
      supermarket: 300,
      cafe: 200,
    };
    const isAmenityOn = {
      park: false,
      supermarket: false,
      cafe: false,
    };

    // Act
    const result = generateCityDataParams({ maxDistance, isAmenityOn });

    // Assert
    expect(result).toEqual({});
  });

  it("includes all parameters when all amenities are on", () => {
    // Arrange
    const maxDistance = {
      park: 500,
      supermarket: 300,
      cafe: 200,
    };
    const isAmenityOn = {
      park: true,
      supermarket: true,
      cafe: true,
    };

    // Act
    const result = generateCityDataParams({ maxDistance, isAmenityOn });

    // Assert
    expect(result).toEqual({
      maxMeterPark: 500,
      maxMeterSupermarket: 300,
      maxMeterCafe: 200,
    });
  });
});
