import { fetchAddressSuggestions } from "@/features/map/api";
import type { AutocompleteResult } from "@/features/map/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const DEBOUNCE_TIMEOUT = 300;
const CACHE_SIZE = 100;

interface CacheEntry {
  data: AutocompleteResult[];
  city?: string;
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string, currentCity?: string): AutocompleteResult[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const cityChanged = currentCity && entry.city && entry.city !== currentCity;

    if (cityChanged) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: AutocompleteResult[], currentCity?: string): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      city: currentCity,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export function useAddressAutocomplete(currentCity?: string) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new LRUCache(CACHE_SIZE));

  const fetchSuggestionsFromAPI = useCallback(
    async (query: string, cacheKey: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        const results = await fetchAddressSuggestions(query, 6, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          // Cache the results
          cacheRef.current.set(cacheKey, results, currentCity);
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
    },
    [currentCity]
  );

  const debouncedFetchSuggestions = useDebouncedCallback(fetchSuggestionsFromAPI, DEBOUNCE_TIMEOUT);

  const handleInput = useCallback(
    (query: string) => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        setIsLoading(false);
        debouncedFetchSuggestions.cancel();
        return;
      }

      if (query.trim().length < 3) {
        setIsLoading(false);
        setSuggestions([]);
        debouncedFetchSuggestions.cancel();
        return;
      }

      const trimmedQuery = query.trim();
      const cacheKey = `${trimmedQuery}:6`; // Include limit in cache key

      // Check cache first - immediately, before any debouncing
      const cachedResults = cacheRef.current.get(cacheKey, currentCity);

      if (cachedResults) {
        setSuggestions(cachedResults);
        setIsLoading(false);
        // Cancel any pending debounced calls
        debouncedFetchSuggestions.cancel();
        return;
      }

      // No cache hit - proceed with API call
      setIsLoading(true);
      debouncedFetchSuggestions(trimmedQuery, cacheKey);
    },
    [currentCity, debouncedFetchSuggestions]
  );

  const handleSelect = useCallback(
    (result: AutocompleteResult) => {
      // eslint-disable-next-line no-console
      console.log("Selected:", result);
      setSuggestions([]);
      debouncedFetchSuggestions.cancel();
    },
    [debouncedFetchSuggestions]
  );

  // Function to handle geocoding search (for Enter key) using the same cache and API
  const handleGeocodeSearch = useCallback(
    async (query: string): Promise<AutocompleteResult[]> => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const trimmedQuery = query.trim();
      const cacheKey = `${trimmedQuery}:6`;

      // Check cache first
      const cachedResults = cacheRef.current.get(cacheKey, currentCity);
      if (cachedResults) {
        return cachedResults;
      }

      // No cache hit - fetch from API
      try {
        const results = await fetchAddressSuggestions(trimmedQuery, 6);
        // Cache the results
        cacheRef.current.set(cacheKey, results, currentCity);
        return results;
      } catch (error) {
        console.error("Failed to geocode address:", error);
        throw error;
      }
    },
    [currentCity]
  );

  // Clear cache when city changes
  const prevCityRef = useRef<string | undefined>(currentCity);
  useEffect(() => {
    if (prevCityRef.current !== currentCity) {
      cacheRef.current.clear();
      prevCityRef.current = currentCity;
    }
  });

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      debouncedFetchSuggestions.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedFetchSuggestions]);

  return {
    suggestions,
    isLoading,
    selectedIdx: -1,
    handleInput,
    handleSelect,
    handleGeocodeSearch,
  };
}
