import { fetchAddressSuggestions } from "@/features/map/api";
import type { AutocompleteResult } from "@/features/map/api";
import { toast } from "@/hooks/use-toast";
import type { Coordinates } from "@/utils/geo";
import { getDistanceBetweenCoordinates } from "@/utils/geo";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const DEBOUNCE_TIMEOUT = 300;
const CACHE_SIZE = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: AutocompleteResult[];
  city?: string;
  timestamp: number;
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

    // Check if entry has expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Check if the cached entry matches the current city context
    if (currentCity && entry.city && entry.city !== currentCity) {
      // City context has changed, don't use this cached entry
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  // Get cached results without city or TTL checks (for fallback scenarios)
  getFallback(key: string): AutocompleteResult[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: AutocompleteResult[], currentCity?: string): void {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      city: currentCity,
      timestamp: Date.now(),
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasError, setHasError] = useState(false);
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
    async (query: string, cacheKey: string, hasImmediateCache = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!hasImmediateCache) {
          setIsLoading(true);
        }
        setHasError(false);
        const results = await fetchAddressSuggestions(query, 6, controller.signal);
        if (!controller.signal.aborted) {
          const processedResults = processResults(results);
          setSuggestions(processedResults);
          setSelectedIndex(-1); // Reset selection when new results arrive
          // Cache the results (unsorted to preserve original API response)
          cacheRef.current.set(cacheKey, results, currentCity);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError" && !controller.signal.aborted) {
          console.error("Failed to fetch address suggestions:", error);
          setHasError(true);

          // Try to fallback to cached results (even if expired or from different city)
          const fallbackResults = cacheRef.current.getFallback(cacheKey);
          if (fallbackResults && fallbackResults.length > 0) {
            const processedFallbackResults = processResults(fallbackResults);
            setSuggestions(processedFallbackResults);
            setSelectedIndex(-1);

            // Show toast notification about using cached results
            toast({
              title: "Connection Issue",
              description: "Showing cached results. Please check your internet connection.",
              variant: "default",
            });
          } else {
            // No cached results available, show error toast and clear suggestions
            setSuggestions([]);
            setSelectedIndex(-1);

            toast({
              title: "Address Search Failed",
              description:
                "Unable to search for addresses. Please check your connection and try again.",
              variant: "destructive",
            });
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [currentCity, processResults]
  );

  const debouncedFetchSuggestions = useDebouncedCallback(
    (query: string, cacheKey: string, hasImmediateCache = false) =>
      fetchSuggestionsFromAPI(query, cacheKey, hasImmediateCache),
    DEBOUNCE_TIMEOUT
  );

  const handleInput = useCallback(
    (query: string) => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        setIsLoading(false);
        setSelectedIndex(-1);
        setHasError(false);
        debouncedFetchSuggestions.cancel();
        return;
      }

      if (query.trim().length < 3) {
        setIsLoading(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        setHasError(false);
        debouncedFetchSuggestions.cancel();
        return;
      }

      const trimmedQuery = query.trim();
      const cacheKey = `${trimmedQuery}:6`; // Include limit in cache key

      // Check cache first for immediate response
      const cachedResults = cacheRef.current.get(cacheKey, currentCity);

      if (cachedResults) {
        // Show cached results immediately for better UX
        const processedCachedResults = processResults(cachedResults);
        setSuggestions(processedCachedResults);
        setSelectedIndex(-1); // Reset selection for cached results
        setIsLoading(false);
        setHasError(false);

        // Still attempt fresh data in background to handle potential network failures
        // This ensures we can show error states and toasts when network is down
        debouncedFetchSuggestions(trimmedQuery, cacheKey, true);
        return;
      }

      // No cache hit - proceed with API call
      setIsLoading(true);
      setHasError(false);
      debouncedFetchSuggestions(trimmedQuery, cacheKey, false);
    },
    [currentCity, debouncedFetchSuggestions, processResults]
  );

  const handleSelect = useCallback(
    (result: AutocompleteResult) => {
      setSuggestions([]);
      setSelectedIndex(-1);
      setHasError(false);
      debouncedFetchSuggestions.cancel();
    },
    [debouncedFetchSuggestions]
  );

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          setSuggestions([]);
          setSelectedIndex(-1);
          setHasError(false);
          debouncedFetchSuggestions.cancel();
          break;
      }
    },
    [suggestions, selectedIndex, handleSelect, debouncedFetchSuggestions]
  );

  // Function to handle geocoding search (for Enter key) using the same cache and API
  const handleGeocodeSearch = useCallback(
    async (query: string): Promise<AutocompleteResult[]> => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const trimmedQuery = query.trim();
      const cacheKey = `${trimmedQuery}:6`;

      // For geocoding, always attempt fresh data first to detect network issues
      try {
        const results = await fetchAddressSuggestions(trimmedQuery, 6);
        // Cache the results (unsorted to preserve original API response)
        cacheRef.current.set(cacheKey, results, currentCity);
        return processResults(results);
      } catch (error) {
        console.error("Failed to geocode address:", error);

        // Try to fallback to cached results for geocoding
        const fallbackResults = cacheRef.current.getFallback(cacheKey);
        if (fallbackResults && fallbackResults.length > 0) {
          toast({
            title: "Using Cached Results",
            description: "Geocoding using cached data due to connection issue.",
            variant: "default",
          });
          return processResults(fallbackResults);
        }

        // Show error toast for geocoding failure when no cache available
        toast({
          title: "Geocoding Failed",
          description: "Unable to find location. Please check your connection and try again.",
          variant: "destructive",
        });

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
    selectedIndex,
    hasError,
    handleInput,
    handleSelect,
    handleKeyDown,
    handleGeocodeSearch,
  };
}
