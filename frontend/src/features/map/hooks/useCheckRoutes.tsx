import { toast } from "@/hooks";
import type { RoutePoint } from "@/types";
import { logger } from "@/utils/logger";
import { setCursorStyle } from "@/utils/misc";
import { bbox } from "@turf/turf";
import { LngLat } from "maplibre-gl";
import { useCallback, useRef, useState } from "react";
import type { LngLatBoundsLike } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { fetchAddressCoordinates, fetchAddressName, fetchRoute } from "../api";
import { useAtomRoute } from "../stores/routeAtoms";
import useCityMap from "./useCityMap";

/**
 * Helper function to conditionally execute flyTo when a single point is set
 * @param pointJustSet - The point that was just successfully set
 * @param otherPoint - The current state of the other point
 * @param mapInstance - The map instance from useCityMap
 * @param flyToFunction - The flyTo function from useCityMap
 */
export const executeConditionalFlyTo = (
  pointJustSet: RoutePoint | null,
  otherPoint: RoutePoint | null,
  mapInstance: MapRef | undefined,
  flyToFunction: (center: [number, number], zoom: number) => void
) => {
  if (mapInstance && pointJustSet?.lngLat && !otherPoint?.lngLat) {
    const { lng, lat } = pointJustSet.lngLat;
    // Use a reasonable zoom level - can be adjusted based on requirements
    const zoom = 15;
    flyToFunction([lng, lat], zoom);
  }
};

export default function useCheckRoutes() {
  const routeFetchRef = useRef<number>(0);
  const lastFetchedRouteRef = useRef<string>("");
  const [isRouteFetching, setIsRouteFetching] = useState(false);
  const { map, fitBounds, flyTo } = useCityMap();
  const {
    route,
    setRoute,
    startingPoint,
    setStartingPoint,
    endingPoint,
    setEndingPoint,
    isStartingPointSelecting,
    setIsStartingPointSelecting,
    isEndingPointSelecting,
    setIsEndingPointSelecting,
  } = useAtomRoute();

  const isSelectingPoint = isStartingPointSelecting || isEndingPointSelecting;
  const isBothSelected = !!(startingPoint?.lngLat && endingPoint?.lngLat);

  // Function to handle fetching the address name based on coordinates
  const handleAddressName = async (lngLat: LngLat) => {
    try {
      const result = await fetchAddressName(lngLat);

      if (!result) {
        toast({
          variant: "destructive",
          title: "Address not found.",
          description: "Could not find address for the provided coordinates.",
          duration: 10000,
        });
        return;
      }

      const displayName = result || "N/A";
      const newPoint = { lngLat, name: displayName };

      if (isStartingPointSelecting) {
        setStartingPoint(newPoint);
        setIsStartingPointSelecting(false);
        // Execute conditional flyTo for starting point
        executeConditionalFlyTo(newPoint, endingPoint, map, flyTo);
      } else if (isEndingPointSelecting) {
        setEndingPoint(newPoint);
        setIsEndingPointSelecting(false);
        // Execute conditional flyTo for ending point
        executeConditionalFlyTo(newPoint, startingPoint, map, flyTo);
      }

      const newStarting = isStartingPointSelecting ? newPoint : startingPoint;
      const newEnding = isEndingPointSelecting ? newPoint : endingPoint;

      if (newStarting?.lngLat && newEnding?.lngLat) {
        fetchRouteWithSafeguards(newStarting, newEnding);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Address name fetch failed.",
        description: "There was a problem with getting address name.",
        duration: 10000,
      });
    } finally {
      setCursorStyle({ isSelecting: false });
    }
  };

  // Function to handle geocoding address input and setting point
  const handleGeocodeAddress = async (address: string, isStartingPoint: boolean) => {
    try {
      const results = await fetchAddressCoordinates(address);

      if (results.length === 0) {
        toast({
          variant: "destructive",
          title: "Address not found.",
          description: "Could not find coordinates for the entered address.",
          duration: 10000,
        });
        return;
      }

      const result = results[0];
      const lngLat = new LngLat(result.lng, result.lat);
      const newPoint = { lngLat, name: result.displayName };

      if (isStartingPoint) {
        setStartingPoint(newPoint);
        setIsStartingPointSelecting(false);
        // Execute conditional flyTo for starting point
        executeConditionalFlyTo(newPoint, endingPoint, map, flyTo);
      } else {
        setEndingPoint(newPoint);
        setIsEndingPointSelecting(false);
        // Execute conditional flyTo for ending point
        executeConditionalFlyTo(newPoint, startingPoint, map, flyTo);
      }

      setCursorStyle({ isSelecting: false });

      const newStarting = isStartingPoint ? newPoint : startingPoint;
      const newEnding = !isStartingPoint ? newPoint : endingPoint;

      if (newStarting?.lngLat && newEnding?.lngLat) {
        fetchRouteWithSafeguards(newStarting, newEnding);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Geocoding failed.",
        description: "There was a problem with geocoding the address.",
        duration: 10000,
      });
    }
  };

  // Function to clear all route-related states
  const clearAllRouteStates = useCallback(() => {
    setRoute(null);
    setStartingPoint(null);
    setEndingPoint(null);
    setIsStartingPointSelecting(false);
    setIsEndingPointSelecting(false);
    setCursorStyle({ isSelecting: false });
    lastFetchedRouteRef.current = "";
  }, [
    setRoute,
    setStartingPoint,
    setEndingPoint,
    setIsStartingPointSelecting,
    setIsEndingPointSelecting,
  ]);

  // Function to safely fetch route with request tracking (stable version)
  const fetchRouteWithSafeguards = useCallback(
    async (startPoint: RoutePoint, endPoint: RoutePoint) => {
      if (!startPoint?.lngLat || !endPoint?.lngLat || isRouteFetching) {
        return;
      }

      // Prevent race conditions with concurrent requests
      const currentRequestId = ++routeFetchRef.current;
      setIsRouteFetching(true);

      try {
        const startingLngLat = startPoint.lngLat;
        const endingLngLat = endPoint.lngLat;
        const coords = `${startingLngLat.lng},${startingLngLat.lat};${endingLngLat.lng},${endingLngLat.lat}`;

        const data = await fetchRoute(coords);

        // Only update state if this is still the latest request
        if (currentRequestId === routeFetchRef.current) {
          setRoute(data);

          // Fit map bounds if route extends beyond current view
          if (map) {
            const boundingBox = bbox(data.geometry);
            const lngLatBounds: LngLatBoundsLike = [
              [boundingBox[0], boundingBox[1]],
              [boundingBox[2], boundingBox[3]],
            ];
            const padding = window.innerWidth < 420 ? 40 : 100;
            if (
              !map.getBounds().contains(lngLatBounds[0]) ||
              !map.getBounds().contains(lngLatBounds[1])
            ) {
              fitBounds(lngLatBounds, padding);
            }
          }
        } else {
          logger.debug(
            `Route fetch cancelled (ID: ${currentRequestId}, latest: ${routeFetchRef.current})`
          );
        }
      } catch (error) {
        if (currentRequestId === routeFetchRef.current) {
          logger.error(`Route fetch failed (ID: ${currentRequestId}):`, error);
          toast({
            variant: "destructive",
            title: "Get routes failed.",
            description: "There was a problem with your request.",
            duration: 10000,
          });
        }
      } finally {
        if (currentRequestId === routeFetchRef.current) {
          setIsRouteFetching(false);
        }
      }
    },
    [isRouteFetching, setRoute, map, fitBounds]
  );

  // Function to reverse the starting and ending points (optimized for speed)
  const reversePoints = useCallback(() => {
    if (!startingPoint || !endingPoint) return;

    const tempStarting = startingPoint;
    const tempEnding = endingPoint;

    setRoute(null);
    setStartingPoint(tempEnding);
    setEndingPoint(tempStarting);

    fetchRouteWithSafeguards(tempEnding, tempStarting);
  }, [
    startingPoint,
    endingPoint,
    setStartingPoint,
    setEndingPoint,
    setRoute,
    fetchRouteWithSafeguards,
  ]);

  return {
    route,
    routeId: route && isBothSelected ? `route-${routeFetchRef.current}` : "no-route",
    startingPoint,
    endingPoint,
    isBothSelected,
    isSelectingPoint,
    isStartingPointSelecting,
    isEndingPointSelecting,
    isRouteFetching,
    setRoute,
    setStartingPoint,
    setEndingPoint,
    setIsStartingPointSelecting,
    setIsEndingPointSelecting,
    clearAllRouteStates,
    reversePoints,
    handleAddressName,
    handleGeocodeAddress,
  };
}
