import { toast } from "@/hooks/use-toast";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAddressSuggestions } from "../api";
import { useAddressAutocomplete } from "./useAddressAutocomplete";

// Mock dependencies
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("../api", () => ({
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

  describe("input validation", () => {
    it("should not fetch suggestions for queries shorter than 3 characters", async () => {
      // Arrange
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // Act
      act(() => {
        result.current.handleInput("Be");
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(mockFetchAddressSuggestions).not.toHaveBeenCalled();
    });

    it("should clear suggestions for empty queries", async () => {
      // Arrange
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // First, get some suggestions
      act(() => result.current.handleInput("Berlin"));
      await act(async () => {
        vi.runAllTimers();
      });

      // Act - clear the input
      act(() => result.current.handleInput(""));

      // Assert
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  describe("suggestion fetching", () => {
    it("should fetch suggestions after debounce delay", async () => {
      // Arrange
      mockFetchAddressSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // Act
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.runAllTimers();
      });

      // Assert
      expect(mockFetchAddressSuggestions).toHaveBeenCalledWith(
        "Berlin",
        6,
        expect.any(AbortSignal)
      );
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      expect(result.current.isLoading).toBe(false);
    });

    it("should use cached results for repeated queries", async () => {
      // Arrange
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

      // Act - second call with same query
      act(() => {
        result.current.handleInput("Berlin");
      });

      // Assert - should use cache immediately
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      expect(result.current.isLoading).toBe(false);
      expect(mockFetchAddressSuggestions).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should show cached results and toast on network error", async () => {
      // Arrange - first successful call to populate cache
      mockFetchAddressSuggestions.mockResolvedValueOnce(MOCK_SUGGESTIONS);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      // Clear suggestions to simulate new search
      act(() => {
        result.current.handleInput("");
      });

      // Act - mock a network error
      mockFetchAddressSuggestions.mockRejectedValueOnce(new Error("Network error"));

      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      // Assert
      expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
      expect(result.current.hasError).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Connection Issue",
        description: "Showing cached results. Please check your internet connection.",
        variant: "default",
      });
    });

    it("should show error toast when no cached results are available", async () => {
      // Arrange
      mockFetchAddressSuggestions.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // Act
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      // Assert
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.hasError).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Address Search Failed",
        description: "Unable to search for addresses. Please check your connection and try again.",
        variant: "destructive",
      });
    });

    it("should not show error for aborted requests", async () => {
      // Arrange
      const abortError = new Error("AbortError");
      abortError.name = "AbortError";
      mockFetchAddressSuggestions.mockRejectedValue(abortError);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // Act
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
      });

      // Assert
      expect(result.current.hasError).toBe(false);
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe("loading states", () => {
    it("should show loading state during fetch", async () => {
      // Arrange
      let resolvePromise: (value: typeof MOCK_SUGGESTIONS) => void;
      const promise = new Promise<typeof MOCK_SUGGESTIONS>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetchAddressSuggestions.mockReturnValue(promise);
      const { result } = renderHook(() => useAddressAutocomplete({}));

      // Act
      act(() => {
        result.current.handleInput("Berlin");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Assert - should be loading
      expect(result.current.isLoading).toBe(true);

      // Complete the promise
      await act(async () => {
        resolvePromise(MOCK_SUGGESTIONS);
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should abort previous requests when new input is received", async () => {
      // Arrange
      let firstRequestAbortSignal: AbortSignal | undefined;
      let secondRequestAbortSignal: AbortSignal | undefined;
      let callCount = 0;

      // Create a promise that we can control to ensure timing
      let resolveFirstRequest!: (value: typeof MOCK_SUGGESTIONS) => void;
      const firstRequestPromise = new Promise<typeof MOCK_SUGGESTIONS>((resolve) => {
        resolveFirstRequest = resolve;
      });

      mockFetchAddressSuggestions.mockImplementation((query, limit, signal) => {
        callCount++;
        if (callCount === 1) {
          firstRequestAbortSignal = signal;
          // Return the controlled promise so we can ensure timing
          return firstRequestPromise;
        }
        if (callCount === 2) {
          secondRequestAbortSignal = signal;
          return Promise.resolve(MOCK_SUGGESTIONS);
        }
        return Promise.resolve(MOCK_SUGGESTIONS);
      });

      const { result } = renderHook(() => useAddressAutocomplete({}));

      // Act - trigger first request
      act(() => {
        result.current.handleInput("Berlin");
      });

      // Advance timers to trigger the debounced first request
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Verify first request started
      expect(firstRequestAbortSignal).toBeDefined();
      expect(firstRequestAbortSignal?.aborted).toBe(false);

      // Act - trigger second request before first completes (this should abort the first)
      act(() => {
        result.current.handleInput("Munich");
      });

      // Advance timers to trigger the debounced second request
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Assert - first request should be aborted when second request starts
      expect(firstRequestAbortSignal?.aborted).toBe(true);
      expect(secondRequestAbortSignal?.aborted).toBe(false);

      // Cleanup: resolve the first promise to avoid unhandled promise rejection
      resolveFirstRequest(MOCK_SUGGESTIONS);
    });
  });
});
