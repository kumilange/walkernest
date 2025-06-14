import { fetchAddressSuggestions } from "@/features/map/api";
import { useAddressAutocomplete } from "@/features/map/hooks/useAddressAutocomplete";
import { toast } from "@/hooks/use-toast";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the toast function
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/map/api", () => ({
  fetchAddressSuggestions: vi.fn(),
}));

const mockFetchAddressSuggestions = vi.mocked(fetchAddressSuggestions);
const mockToast = vi.mocked(toast);

const MOCK_SUGGESTIONS = [
  {
    id: "1",
    displayName: "Berlin",
    address: "Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    coordinates: { lat: 52.52, lng: 13.405 },
  },
];

describe("useAddressAutocomplete", () => {
  beforeEach(() => {
    mockFetchAddressSuggestions.mockClear();
    mockToast.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not fetch when query is less than 3 chars", async () => {
    const { result } = renderHook(() => useAddressAutocomplete({}));
    act(() => {
      result.current.handleInput("Be");
    });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchAddressSuggestions).not.toHaveBeenCalled();
  });

  it("should fetch suggestions after debounce", async () => {
    mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
    const { result } = renderHook(() => useAddressAutocomplete({}));

    act(() => {
      result.current.handleInput("Berlin");
    });

    // Advance time and run all timers to complete debounce and promise resolution
    await act(async () => {
      vi.runAllTimers();
    });

    // Verify the call was made and state updated
    expect(mockFetchAddressSuggestions).toHaveBeenCalledWith("Berlin", 6, expect.any(AbortSignal));
    expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
    expect(result.current.isLoading).toBe(false);
  });

  it("should show cached results immediately when available", async () => {
    mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
    const { result } = renderHook(() => useAddressAutocomplete({}));

    // First call to populate cache
    act(() => {
      result.current.handleInput("Berlin");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
    });

    expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

    // Second call should use cache immediately
    act(() => {
      result.current.handleInput("Berlin");
    });

    expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 API call
  });

  it("should clear suggestions and not fetch for empty query", async () => {
    mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
    const { result } = renderHook(() => useAddressAutocomplete({}));

    // First, get some suggestions
    act(() => result.current.handleInput("Berlin"));

    // Complete debounce and fetch
    await act(async () => {
      vi.runAllTimers();
    });

    // Verify suggestions are loaded
    expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
    expect(result.current.isLoading).toBe(false);

    // Now, clear the input
    act(() => result.current.handleInput(""));

    // Should immediately clear suggestions without waiting
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // only the first call
  });

  describe("Error handling and fallback", () => {
    it("should show toast and fallback to cached results on network error", async () => {
      // First successful call to populate cache
      mockFetchAddressSuggestions.mockResolvedValueOnce(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      expect(result.current.hasError).toBe(false);

      // Clear suggestions to simulate new search
      act(() => {
        result.current.handleInput("");
      });

      // Now mock a network error
      mockFetchAddressSuggestions.mockRejectedValueOnce(new Error("Network error"));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      // Should show cached results and error state
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      expect(result.current.hasError).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Connection Issue",
        description: "Showing cached results. Please check your internet connection.",
        variant: "default",
      });
    });

    it("should show error toast when no cached results available", async () => {
      mockFetchAddressSuggestions.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.hasError).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Address Search Failed",
        description: "Unable to search for addresses. Please check your connection and try again.",
        variant: "destructive",
      });
    });

    it("should not show error for aborted requests", async () => {
      const abortError = new Error("AbortError");
      abortError.name = "AbortError";
      mockFetchAddressSuggestions.mockRejectedValue(abortError);

      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.hasError).toBe(false);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("should clear error state on successful request", async () => {
      // First, cause an error
      mockFetchAddressSuggestions.mockRejectedValueOnce(new Error("Network error"));
      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.hasError).toBe(true);

      // Now succeed
      mockFetchAddressSuggestions.mockResolvedValueOnce(MOCK_SUGGESTIONS);

      act(() => {
        result.current.handleInput("Hamburg");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
    });
  });

  describe("handleGeocodeSearch", () => {
    it("should return empty array for empty query", async () => {
      const { result } = renderHook(() => useAddressAutocomplete({}));
      const geocodeResult = await result.current.handleGeocodeSearch("");
      expect(geocodeResult).toEqual([]);
      expect(mockFetchAddressSuggestions).not.toHaveBeenCalled();
    });

    it("should fetch from API and cache results when no cache hit", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      const geocodeResult = await result.current.handleGeocodeSearch("Berlin");

      expect(mockFetchAddressSuggestions).toHaveBeenCalledWith("Berlin", 6);
      expect(geocodeResult).toEqual(MOCK_SUGGESTIONS);
    });

    it("should always attempt fresh data for geocoding", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First call to populate cache
      await result.current.handleGeocodeSearch("Berlin");
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Second call should still attempt API for fresh data (geocoding behavior)
      const geocodeResult = await result.current.handleGeocodeSearch("Berlin");
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(2); // 2 calls for fresh data
      expect(geocodeResult).toEqual(MOCK_SUGGESTIONS);
    });

    it("should fallback to cached results and show toast on geocoding error", async () => {
      // First successful call to populate cache
      mockFetchAddressSuggestions.mockResolvedValueOnce(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      await result.current.handleGeocodeSearch("Berlin");
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Clear the cache by time advancement (simulate expired cache) and then cause error
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes to expire cache
      mockFetchAddressSuggestions.mockRejectedValueOnce(new Error("Network error"));

      const geocodeResult = await result.current.handleGeocodeSearch("Berlin");

      expect(geocodeResult).toEqual(MOCK_SUGGESTIONS);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Using Cached Results",
        description: "Geocoding using cached data due to connection issue.",
        variant: "default",
      });
    });

    it("should show error toast and throw when no cached results available for geocoding", async () => {
      mockFetchAddressSuggestions.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAddressAutocomplete({}));

      await expect(result.current.handleGeocodeSearch("Berlin")).rejects.toThrow("Network error");
      expect(mockToast).toHaveBeenCalledWith({
        title: "Geocoding Failed",
        description: "Unable to find location. Please check your connection and try again.",
        variant: "destructive",
      });
    });
  });

  describe("Geographic prioritization", () => {
    it("should sort suggestions by distance from map center", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Far",
          address: "Berlin Far",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.7, lng: 13.8 }, // Further from center
        },
        {
          id: "2",
          displayName: "Berlin Close",
          address: "Berlin Close",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.51, lng: 13.4 }, // Closer to center
        },
      ];

      const mapCenter = { lat: 52.5, lng: 13.4 };
      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({ mapCenter }));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toHaveLength(2);
      // Should be sorted by distance - closer one first
      expect(result.current.suggestions[0].displayName).toBe("Berlin Close");
      expect(result.current.suggestions[1].displayName).toBe("Berlin Far");
    });

    it("should return unsorted results when no map center provided", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Far",
          address: "Berlin Far",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.7, lng: 13.8 },
        },
        {
          id: "2",
          displayName: "Berlin Close",
          address: "Berlin Close",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.51, lng: 13.4 },
        },
      ];

      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toHaveLength(2);
      // Should keep original API order when no center provided
      expect(result.current.suggestions[0].displayName).toBe("Berlin Far");
      expect(result.current.suggestions[1].displayName).toBe("Berlin Close");
    });

    it("should sort cached results by distance from map center", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Far",
          address: "Berlin Far",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.7, lng: 13.8 },
        },
        {
          id: "2",
          displayName: "Berlin Close",
          address: "Berlin Close",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.51, lng: 13.4 },
        },
      ];

      const mapCenter = { lat: 52.5, lng: 13.4 };
      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({ mapCenter }));

      // First call to populate cache
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Second call should use cache and still sort by distance
      act(() => {
        result.current.handleInput("Berlin");
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 API call
      expect(result.current.suggestions).toHaveLength(2);
      // Should be sorted by distance - closer one first
      expect(result.current.suggestions[0].displayName).toBe("Berlin Close");
      expect(result.current.suggestions[1].displayName).toBe("Berlin Far");
    });

    it("should sort geocode search results by distance", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Far",
          address: "Berlin Far",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.7, lng: 13.8 },
        },
        {
          id: "2",
          displayName: "Berlin Close",
          address: "Berlin Close",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.51, lng: 13.4 },
        },
      ];

      const mapCenter = { lat: 52.5, lng: 13.4 };
      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({ mapCenter }));

      const geocodeResult = await result.current.handleGeocodeSearch("Berlin");

      expect(geocodeResult).toHaveLength(2);
      // Should be sorted by distance - closer one first
      expect(geocodeResult[0].displayName).toBe("Berlin Close");
      expect(geocodeResult[1].displayName).toBe("Berlin Far");
    });
  });

  describe("LRU Cache with TTL", () => {
    it("should cache results with timestamp", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Second call should use cache
      act(() => {
        result.current.handleInput("Berlin");
      });

      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 API call
    });

    it("should expire cache after TTL", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First call to populate cache
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Advance time beyond TTL
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      // Should fetch again due to expired cache
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(2);
    });

    it("should prevent cache hit when city in cache differs from current city", async () => {
      const berlinSuggestions = [
        {
          id: "1",
          displayName: "Berlin Str, Hamburg",
          address: "Berlin Str",
          city: "Hamburg",
          country: "Germany",
          coordinates: { lat: 53.5511, lng: 9.9937 },
        },
      ];

      mockFetchAddressSuggestions
        .mockResolvedValueOnce(MOCK_SUGGESTIONS) // First call with Berlin city
        .mockResolvedValueOnce(berlinSuggestions); // Second call with Hamburg city

      const { result, rerender } = renderHook(({ currentCity }: { currentCity?: string } = {}) =>
        useAddressAutocomplete({ currentCity })
      );

      // First call with Berlin city
      rerender({ currentCity: "Berlin" });
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);

      // Change to Hamburg city
      rerender({ currentCity: "Hamburg" });

      // Same query with different city - should not use cached results
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(2);
      expect(result.current.suggestions).toEqual(berlinSuggestions);
    });
  });

  describe("Deduplication", () => {
    it("should remove suggestions with same coordinates", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Central Station",
          address: "Berlin Central Station",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5253, lng: 13.3719 },
        },
        {
          id: "2",
          displayName: "Berlin Hauptbahnhof",
          address: "Berlin Hauptbahnhof",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5253, lng: 13.3719 }, // Same coordinates, should be removed
        },
      ];

      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.suggestions[0].displayName).toBe("Berlin Central Station");
    });

    it("should remove suggestions with same displayName even with different coordinates", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Central Station",
          address: "Berlin Central Station",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5253, lng: 13.3719 },
        },
        {
          id: "2",
          displayName: "Berlin Central Station",
          address: "Berlin Central Station",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5254, lng: 13.372 }, // Slightly different coordinates, should be removed
        },
      ];

      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.suggestions[0].displayName).toBe("Berlin Central Station");
      expect(result.current.suggestions[0].coordinates).toEqual({ lat: 52.5253, lng: 13.3719 });
    });

    it("should keep suggestions with different displayNames even if coordinates are close", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Central Station",
          address: "Berlin Central Station",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5253, lng: 13.3719 },
        },
        {
          id: "2",
          displayName: "Berlin Main Station Platform 1",
          address: "Berlin Main Station Platform 1",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5254, lng: 13.372 }, // Close coordinates but different name, should be kept
        },
      ];

      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toHaveLength(2);
      expect(result.current.suggestions[0].displayName).toBe("Berlin Central Station");
      expect(result.current.suggestions[1].displayName).toBe("Berlin Main Station Platform 1");
    });

    it("should deduplicate cached results", async () => {
      const mockResults = [
        {
          id: "1",
          displayName: "Berlin Central",
          address: "Berlin Central",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5253, lng: 13.3719 },
        },
        {
          id: "2",
          displayName: "Berlin Central",
          address: "Berlin Central",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.5253, lng: 13.3719 }, // Duplicate
        },
      ];

      mockFetchAddressSuggestions.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First call to populate cache
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);
      expect(result.current.suggestions).toHaveLength(1);

      // Second call should use cache and still deduplicate
      act(() => {
        result.current.handleInput("Berlin");
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 API call
      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.suggestions[0].displayName).toBe("Berlin Central");
    });
  });
});
