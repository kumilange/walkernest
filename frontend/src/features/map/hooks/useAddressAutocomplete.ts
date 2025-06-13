import { fetchAddressSuggestions } from "@/features/map/api";
import type { AutocompleteResult } from "@/features/map/api";
import type { Coordinates } from "@/utils/geo";
import { getDistanceBetweenCoordinates } from "@/utils/geo";
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

interface UseAddressAutocompleteOptions {
  currentCity?: string;
  mapCenter?: Coordinates;
}

export function useAddressAutocomplete(options: UseAddressAutocompleteOptions = {}) {
  const { currentCity, mapCenter } = options;
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new LRUCache(CACHE_SIZE));

  // Remove duplicate suggestions based on coordinates and display name
  const deduplicateSuggestions = useCallback(
    (results: AutocompleteResult[]): AutocompleteResult[] => {
      if (results.length === 0) {
        return results;
      }

      const seenCoords = new Set<string>();
      const seenDisplayNames = new Set<string>();

      return results.filter((result) => {
        // Create a unique key based on coordinates (rounded to avoid floating point precision issues)
        const coordKey = `${result.coordinates.lat.toFixed(4)},${result.coordinates.lng.toFixed(4)}`;
        const displayName = result.displayName.trim();

        // Check if we've already seen this exact coordinate location
        if (seenCoords.has(coordKey)) {
          return false;
        }

        // Check if we've already seen this exact display name
        if (seenDisplayNames.has(displayName)) {
          return false;
        }

        seenCoords.add(coordKey);
        seenDisplayNames.add(displayName);
        return true;
      });
    },
    []
  );

  // Sort suggestions by distance from map center
  const sortSuggestionsByDistance = useCallback(
    (results: AutocompleteResult[]): AutocompleteResult[] => {
      if (!mapCenter || results.length === 0) {
        return results;
      }

      return results.slice().sort((a, b) => {
        const distanceA = getDistanceBetweenCoordinates(mapCenter, a.coordinates);
        const distanceB = getDistanceBetweenCoordinates(mapCenter, b.coordinates);
        return distanceA - distanceB;
      });
    },
    [mapCenter]
  );

  // Process results: deduplicate first, then sort by distance
  const processResults = useCallback(
    (results: AutocompleteResult[]): AutocompleteResult[] => {
      const deduplicated = deduplicateSuggestions(results);
      return sortSuggestionsByDistance(deduplicated);
    },
    [deduplicateSuggestions, sortSuggestionsByDistance]
  );

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
          const processedResults = processResults(results);
          setSuggestions(processedResults);
          // Cache the results (unsorted to preserve original API response)
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
    [currentCity, processResults]
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
        const processedCachedResults = processResults(cachedResults);
        setSuggestions(processedCachedResults);
        setIsLoading(false);
        // Cancel any pending debounced calls
        debouncedFetchSuggestions.cancel();
        return;
      }

      // No cache hit - proceed with API call
      setIsLoading(true);
      debouncedFetchSuggestions(trimmedQuery, cacheKey);
    },
    [currentCity, debouncedFetchSuggestions, processResults]
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
        return processResults(cachedResults);
      }

      // No cache hit - fetch from API
      try {
        const results = await fetchAddressSuggestions(trimmedQuery, 6);
        // Cache the results (unsorted to preserve original API response)
        cacheRef.current.set(cacheKey, results, currentCity);
        return processResults(results);
      } catch (error) {
        console.error("Failed to geocode address:", error);
        throw error;
      }
    },
    [currentCity, processResults]
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
