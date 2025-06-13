import type { AutocompleteResult } from "@/features/map/api";
import { useCallback, useEffect, useRef, useState } from "react";

const MOCK_SUGGESTIONS: AutocompleteResult[] = [
  {
    id: "1",
    displayName: "Brandenburg Gate",
    address: "Pariser Platz, 10117 Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    coordinates: { lat: 52.5163, lng: 13.3777 },
  },
  {
    id: "2",
    displayName: "Reichstag Building",
    address: "Platz der Republik 1, 11011 Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    coordinates: { lat: 52.5186, lng: 13.3762 },
  },
  {
    id: "3",
    displayName: "Alexanderplatz",
    address: "Alexanderplatz, 10178 Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    coordinates: { lat: 52.5219, lng: 13.4132 },
  },
];

export function useAddressAutocomplete(debounceTimeout = 300) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleInput = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setIsLoading(true);

      debounceRef.current = setTimeout(() => {
        if (query) {
          setSuggestions(MOCK_SUGGESTIONS);
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
      }, debounceTimeout);
    },
    [debounceTimeout]
  );

  const handleSelect = useCallback((result: AutocompleteResult) => {
    // eslint-disable-next-line no-console
    console.log("Selected:", result);
    setSuggestions([]);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    // `cmdk` will manage the index, so we return a dummy value for now.
    selectedIdx: -1,
    handleInput,
    handleSelect,
  };
}
