import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { AutocompleteResult } from "@/features/map/api";
import AddressSuggestions from "@/features/map/components/AddressSuggestions";
import { useCityMap } from "@/features/map/hooks";
import { useAddressAutocomplete } from "@/features/map/hooks/useAddressAutocomplete";
import type { Route, RoutePoint } from "@/types";
import { CircleX, Locate, LocateFixed, MapPin } from "lucide-react";
import { LngLat } from "maplibre-gl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import useEventHandlers from "./hooks/use-event-handlers";

export default function SelectPoint({
  isStarting,
  point,
  setPoint,
  isPointSelecting,
  setIsPointSelecting,
  onGeocodeAddress,
  setRoute,
  isRouteFetching = false,
  onPointSet,
}: {
  isStarting: boolean;
  point: RoutePoint | null;
  isPointSelecting: boolean;
  setPoint: (point: RoutePoint | null) => void;
  setIsPointSelecting: (isPointSelecting: boolean) => void;
  onGeocodeAddress: (address: string, isStarting: boolean) => Promise<void>;
  setRoute: (route: Route | null) => void;
  isRouteFetching?: boolean;
  onPointSet?: (point: RoutePoint, isStarting: boolean) => void;
}) {
  const [addressInput, setAddressInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rawListboxId = useId();
  // Convert React's useId output to valid HTML ID by replacing colons with underscores
  const listboxId = rawListboxId.replace(/:/g, "_");
  const { map } = useCityMap();

  // Get map center for geographic prioritization
  const mapCenter = map?.getCenter()
    ? {
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
      }
    : undefined;

  const autocomplete = useAddressAutocomplete({ mapCenter });

  // Enhanced address search using autocomplete cache and API
  const handleAddressSearch = useCallback(async () => {
    const trimmed = addressInput.trim();
    if (!trimmed || trimmed === point?.name) return;

    setIsGeocoding(true);
    try {
      // Use autocomplete's geocoding function which uses cache and same API
      const results = await autocomplete.handleGeocodeSearch(trimmed);

      if (results.length === 0) {
        // Fallback to original geocoding if no results from autocomplete API
        await onGeocodeAddress(trimmed, isStarting);
        return;
      }

      // Use first result from autocomplete API
      const result = results[0];
      const newPoint = {
        name: result.displayName,
        lngLat: new LngLat(result.coordinates.lng, result.coordinates.lat),
      };
      setPoint(newPoint);

      if (onPointSet) {
        onPointSet(newPoint, isStarting);
      }
    } catch (error) {
      console.error("Address search failed:", error);
      // Fallback to original geocoding on error
      await onGeocodeAddress(trimmed, isStarting);
    } finally {
      setIsGeocoding(false);
    }
  }, [
    addressInput,
    point?.name,
    autocomplete.handleGeocodeSearch,
    isStarting,
    setPoint,
    onPointSet,
    onGeocodeAddress,
  ]);

  const {
    handleMapClick,
    handleClearPoint,
    handleMapClickTouch,
    handleClearPointTouch,
    handleInputChange,
    handleFocus,
  } = useEventHandlers({
    isPointSelecting,
    setIsPointSelecting,
    setRoute,
    setPoint,
    setAddressInput,
    onGeocodeAddress,
    isStarting,
    inputRef,
    addressInput,
    point,
    setIsGeocoding,
  });

  // Handle keyboard navigation and Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // First let the autocomplete handle keyboard navigation
      autocomplete.handleKeyDown(e);

      // If Enter was pressed and no suggestion was selected, do manual search
      if (e.key === "Enter" && autocomplete.selectedIndex === -1) {
        e.preventDefault();
        handleAddressSearch();
      }
    },
    [autocomplete, handleAddressSearch]
  );

  const onNewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    autocomplete.handleInput(e.target.value);
  };

  const handleSuggestionSelect = (suggestion: AutocompleteResult) => {
    setAddressInput(suggestion.displayName);
    const newPoint = {
      name: suggestion.displayName,
      lngLat: new LngLat(suggestion.coordinates.lng, suggestion.coordinates.lat),
    };
    setPoint(newPoint);

    if (onPointSet) {
      onPointSet(newPoint, isStarting);
    }

    autocomplete.handleSelect(suggestion);
    // Focus returns to input after selection for accessibility
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const classes = `w-[16px] w-4 h-4 ${point ? "text-green-600" : ""}`;

  useEffect(() => {
    if (point) {
      setAddressInput(point.name);
    } else {
      setAddressInput("");
    }
  }, [point]);

  const isPopoverOpen = autocomplete.suggestions.length > 0 || autocomplete.isLoading;
  const activeDescendant =
    autocomplete.selectedIndex >= 0
      ? `${listboxId}-option-${autocomplete.selectedIndex}`
      : undefined;

  return (
    <div className="flex w-full items-center gap-1">
      <div className="w-4 flex-shrink-0">
        {isStarting ? <Locate className={classes} /> : <LocateFixed className={classes} />}
      </div>

      <Popover open={isPopoverOpen}>
        <div className="min-w-0 flex-1">
          <PopoverAnchor>
            <Input
              ref={inputRef}
              role="combobox"
              aria-expanded={isPopoverOpen}
              aria-controls={isPopoverOpen ? listboxId : undefined}
              aria-activedescendant={activeDescendant}
              aria-autocomplete="list"
              aria-label={`Enter ${isStarting ? "starting" : "ending"} address`}
              placeholder={`Enter ${isStarting ? "starting" : "ending"} address`}
              value={addressInput}
              onChange={onNewInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              disabled={isGeocoding || isRouteFetching}
              className={`w-full focus:border-green-500 ${
                isPointSelecting ? "border-green-500 bg-green-50" : ""
              }`}
            />
          </PopoverAnchor>
        </div>
        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <AddressSuggestions
            suggestions={autocomplete.suggestions}
            isLoading={autocomplete.isLoading}
            hasError={autocomplete.hasError}
            selectedIndex={autocomplete.selectedIndex}
            listboxId={listboxId}
            onSelect={handleSuggestionSelect}
          />
        </PopoverContent>
      </Popover>

      <div className="flex flex-shrink-0 items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleMapClick}
          onTouchEnd={handleMapClickTouch}
          disabled={isGeocoding || isRouteFetching}
          title="Click on map to select point"
          className="h-4 w-4 hover:bg-transparent hover:text-current"
        >
          <MapPin className={`h-4 w-4 ${isPointSelecting ? "text-green-600" : ""}`} />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleClearPoint}
          onTouchEnd={handleClearPointTouch}
          disabled={isGeocoding || isRouteFetching}
          title="Clear point"
          className="h-4 w-4 hover:bg-transparent hover:text-current"
        >
          <CircleX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
