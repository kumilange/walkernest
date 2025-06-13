import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAddressAutocomplete } from "@/features/map/hooks/useAddressAutocomplete";

describe("useAddressAutocomplete", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should debounce input and update suggestions", async () => {
        const debounceTimeout = 500;
        const { result } = renderHook(() =>
            useAddressAutocomplete(debounceTimeout),
        );

        // Initial state
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.isLoading).toBe(false);

        // Simulate user typing
        await act(() => result.current.handleInput("Ber"));

        // Immediately after, isLoading should be true, but suggestions are empty
        expect(result.current.isLoading).toBe(true);
        expect(result.current.suggestions).toEqual([]);

        // Fast-forward time
        await act(() => vi.advanceTimersByTimeAsync(debounceTimeout));

        // Now suggestions should be updated and isLoading should be false
        expect(result.current.isLoading).toBe(false);
        expect(result.current.suggestions.length).toBe(3);
    });

    it("should clear suggestions when input is cleared", async () => {
        const debounceTimeout = 500;
        const { result } = renderHook(() =>
            useAddressAutocomplete(debounceTimeout),
        );

        // First, get some suggestions
        await act(() => result.current.handleInput("Berlin"));

        await act(() => vi.advanceTimersByTimeAsync(debounceTimeout));

        expect(result.current.suggestions.length).toBeGreaterThan(0);

        // Now, clear the input
        await act(() => result.current.handleInput(""));

        await act(() => vi.advanceTimersByTimeAsync(debounceTimeout));

        // Suggestions should be cleared
        expect(result.current.isLoading).toBe(false);
        expect(result.current.suggestions).toEqual([]);
    });
}); 