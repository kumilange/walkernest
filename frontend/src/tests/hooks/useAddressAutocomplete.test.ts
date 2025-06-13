import { fetchAddressSuggestions } from "@/features/map/api";
import { useAddressAutocomplete } from "@/features/map/hooks/useAddressAutocomplete";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/map/api", () => ({
  fetchAddressSuggestions: vi.fn(),
}));

const mockFetchAddressSuggestions = vi.mocked(fetchAddressSuggestions);

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

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await waitFor(
      () => {
        expect(mockFetchAddressSuggestions).toHaveBeenCalledWith(
          "Berlin",
          6,
          expect.any(AbortSignal)
        );
      },
      { timeout: 1000 }
    );
  }, 10000);

  it("should cancel previous request on new input", async () => {
    mockFetchAddressSuggestions.mockResolvedValue([]);
    const { result } = renderHook(() => useAddressAutocomplete({}));

    act(() => result.current.handleInput("Berli"));

    await new Promise((r) => setTimeout(r, 100));

    // Quick succession typing should cancel the previous debounced call
    act(() => result.current.handleInput("Berlin"));

    // Wait for the debounce to complete
    await waitFor(
      () => {
        expect(mockFetchAddressSuggestions).toHaveBeenCalledWith(
          "Berlin",
          6,
          expect.any(AbortSignal)
        );
      },
      { timeout: 1000 }
    );

    // Should only be called once (for "Berlin"), not twice
    expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);
  });

  it("should handle API errors gracefully", async () => {
    mockFetchAddressSuggestions.mockRejectedValue(new Error("API Error"));
    const { result } = renderHook(() => useAddressAutocomplete({}));

    act(() => {
      result.current.handleInput("ErrorCity");
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.suggestions).toEqual([]);
      },
      { timeout: 1000 }
    );
  });

  it("should clear suggestions and not fetch for empty query", async () => {
    mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
    const { result } = renderHook(() => useAddressAutocomplete({}));

    // First, get some suggestions
    act(() => result.current.handleInput("Berlin"));
    await waitFor(() => expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1), {
      timeout: 1000,
    });

    // Now, clear the input
    act(() => result.current.handleInput(""));

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // only the first call
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

    it("should use cache when available", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First call to populate cache
      await result.current.handleGeocodeSearch("Berlin");
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const geocodeResult = await result.current.handleGeocodeSearch("Berlin");
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(geocodeResult).toEqual(MOCK_SUGGESTIONS);
    });

    it("should handle API errors in geocoding", async () => {
      mockFetchAddressSuggestions.mockRejectedValue(new Error("API Error"));
      const { result } = renderHook(() => useAddressAutocomplete({}));

      await expect(result.current.handleGeocodeSearch("ErrorCity")).rejects.toThrow("API Error");
    });

    describe("Geographic prioritization", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

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

        await act(async () => {
          vi.advanceTimersByTime(300);
          await vi.runAllTimersAsync();
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
  });

  describe("LRU Cache", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should prevent network call when cache hit occurs", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First call - should hit the network
      act(() => {
        result.current.handleInput("Berlin");
      });

      // Advance debounce timer and let async operations resolve
      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);

      // Second call with same query - should use cache, not hit network
      act(() => {
        result.current.handleInput("Berlin");
      });

      // Advance debounce timer and let async operations resolve
      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      // Should still be only 1 network call (cache hit prevented second call)
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);
    });

    it("should share cache between handleInput and handleGeocodeSearch", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First call via handleInput to populate cache
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Call handleGeocodeSearch - should use cache from handleInput
      const geocodeResult = await result.current.handleGeocodeSearch("Berlin");
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(geocodeResult).toEqual(MOCK_SUGGESTIONS);
    });

    it("should invalidate cache when city changes", async () => {
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result, rerender } = renderHook(({ currentCity }: { currentCity?: string } = {}) =>
        useAddressAutocomplete({ currentCity })
      );

      // First call with Berlin city
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);

      // Change city
      rerender({ currentCity: "Hamburg" });

      // Same query but different city - should hit network again due to city change
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
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should remove duplicate suggestions with same coordinates", async () => {
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
          coordinates: { lat: 52.5253, lng: 13.3719 }, // Same coordinates
        },
        {
          id: "3",
          displayName: "Berlin Park",
          address: "Berlin Park",
          city: "Berlin",
          country: "Germany",
          coordinates: { lat: 52.52, lng: 13.405 }, // Different coordinates
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
      expect(result.current.suggestions[1].displayName).toBe("Berlin Park");
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

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1); // Still only 1 API call
      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.suggestions[0].displayName).toBe("Berlin Central");
    });
  });
});
