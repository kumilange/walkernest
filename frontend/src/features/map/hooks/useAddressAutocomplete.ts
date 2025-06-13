import { fetchAddressSuggestions } from "@/features/map/api";
import type { AutocompleteResult } from "@/features/map/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const DEBOUNCE_TIMEOUT = 300;

export function useAddressAutocomplete() {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useDebouncedCallback(
    useCallback(async (query: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!query || query.trim().length < 3) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        const results = await fetchAddressSuggestions(query, 6, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to fetch address suggestions:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, []),
    DEBOUNCE_TIMEOUT
  );

  const handleInput = useCallback(
    (query: string) => {
      if (query.trim().length > 0 && query.trim().length < 3) {
        setIsLoading(false);
        setSuggestions([]);
        fetchSuggestions.cancel();
        return;
      }
      setIsLoading(true);
      fetchSuggestions(query);
    },
    [fetchSuggestions]
  );

  const handleSelect = useCallback(
    (result: AutocompleteResult) => {
      // eslint-disable-next-line no-console
      console.log("Selected:", result);
      setSuggestions([]);
      fetchSuggestions.cancel();
    },
    [fetchSuggestions]
  );

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      fetchSuggestions.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    selectedIdx: -1,
    handleInput,
    handleSelect,
  };
}
