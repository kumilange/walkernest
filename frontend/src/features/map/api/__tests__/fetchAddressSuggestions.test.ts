import { beforeEach, describe, expect, it, vi } from "vitest";
import { type AutocompleteResult, fetchAddressSuggestions } from "../index";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchAddressSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should return formatted suggestions for valid query", async () => {
      const mockResponse = [
        {
          place_id: "12345",
          lat: "52.5200",
          lon: "13.4050",
          display_name: "Berlin, Germany",
          importance: 0.75,
          address: {
            city: "Berlin",
            country: "Germany",
            country_code: "de",
          },
        },
        {
          place_id: "67890",
          lat: "48.8566",
          lon: "2.3522",
          display_name: "Paris, France",
          importance: 0.7,
          address: {
            city: "Paris",
            country: "France",
            country_code: "fr",
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchAddressSuggestions("test query");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test%20query&format=json&limit=6&addressdetails=1",
        { signal: undefined }
      );

      expect(result).toEqual([
        {
          id: "12345",
          displayName: "Berlin, Germany",
          address: "Berlin",
          city: "Berlin",
          country: "Germany",
          coordinates: {
            lat: 52.52,
            lng: 13.405,
          },
        },
        {
          id: "67890",
          displayName: "Paris, France",
          address: "Paris",
          city: "Paris",
          country: "France",
          coordinates: {
            lat: 48.8566,
            lng: 2.3522,
          },
        },
      ] satisfies AutocompleteResult[]);
    });

    it("should respect the limit parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAddressSuggestions("test", 3);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test&format=json&limit=3&addressdetails=1",
        { signal: undefined }
      );
    });

    it("should use default limit of 6 when not specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAddressSuggestions("test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test&format=json&limit=6&addressdetails=1",
        { signal: undefined }
      );
    });

    it("should handle suggestions with missing address details", async () => {
      const mockResponse = [
        {
          place_id: "12345",
          lat: "52.5200",
          lon: "13.4050",
          display_name: "Some Place, Somewhere",
          importance: 0.5,
          // No address field
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchAddressSuggestions("test");

      expect(result).toEqual([
        {
          id: "12345",
          displayName: "Some Place, Somewhere",
          address: "Some Place",
          city: "",
          country: "",
          coordinates: {
            lat: 52.52,
            lng: 13.405,
          },
        },
      ]);
    });

    it("should use state as city when city is not available", async () => {
      const mockResponse = [
        {
          place_id: "12345",
          lat: "40.7128",
          lon: "-74.0060",
          display_name: "New York, NY, USA",
          importance: 0.8,
          address: {
            state: "New York",
            country: "United States",
            country_code: "us",
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchAddressSuggestions("new york");

      expect(result[0]?.city).toBe("New York");
    });

    it("should trim whitespace from query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAddressSuggestions("  test query  ");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test%20query&format=json&limit=6&addressdetails=1",
        { signal: undefined }
      );
    });
  });

  describe("empty result cases", () => {
    it("should return empty array for queries with less than 3 characters", async () => {
      const result1 = await fetchAddressSuggestions("");
      const result2 = await fetchAddressSuggestions("ab");
      const result3 = await fetchAddressSuggestions("  ");

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return empty array when API returns empty results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchAddressSuggestions("nonexistent place");

      expect(result).toEqual([]);
    });

    it("should handle null query", async () => {
      const result = await fetchAddressSuggestions(null as unknown as string);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("network failure cases", () => {
    it("should throw error when network response is not ok", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(fetchAddressSuggestions("test")).rejects.toThrow("Network response was not ok");
      consoleSpy.mockRestore();
    });

    it("should throw error when fetch fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(fetchAddressSuggestions("test")).rejects.toThrow("Network error");
      consoleSpy.mockRestore();
    });

    it("should throw error when JSON parsing fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(fetchAddressSuggestions("test")).rejects.toThrow("Invalid JSON");
      consoleSpy.mockRestore();
    });

    it("should log errors to console", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(fetchAddressSuggestions("test")).rejects.toThrow("Network error");

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching address suggestions", networkError);
      consoleSpy.mockRestore();
    });
  });

  describe("parameter validation", () => {
    it("should handle various limit values", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchAddressSuggestions("test", 1);
      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test&format=json&limit=1&addressdetails=1",
        { signal: undefined }
      );

      await fetchAddressSuggestions("test", 10);
      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test&format=json&limit=10&addressdetails=1",
        { signal: undefined }
      );

      await fetchAddressSuggestions("test", 0);
      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test&format=json&limit=0&addressdetails=1",
        { signal: undefined }
      );
    });

    it("should encode special characters in query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAddressSuggestions("test & special chars");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search?q=test%20%26%20special%20chars&format=json&limit=6&addressdetails=1",
        { signal: undefined }
      );
    });
  });
});
