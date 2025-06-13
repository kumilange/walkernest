import { fetchAddressSuggestions } from "@/features/map/api";
import { useAddressAutocomplete } from "@/features/map/hooks/useAddressAutocomplete";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    const { result } = renderHook(() => useAddressAutocomplete());
    act(() => {
      result.current.handleInput("Be");
    });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchAddressSuggestions).not.toHaveBeenCalled();
  });

  it("should fetch suggestions after debounce", async () => {
    mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
    const { result } = renderHook(() => useAddressAutocomplete());

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
    const { result } = renderHook(() => useAddressAutocomplete());

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
    const { result } = renderHook(() => useAddressAutocomplete());

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
    const { result } = renderHook(() => useAddressAutocomplete());

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
});
