import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomRoute } from "@/atoms";
import { bbox } from "@turf/turf";
import { LngLat, LngLatBoundsLike } from "react-map-gl/maplibre";
import { setCursorStyle } from "@/lib/misc";
import { fetchAddressName } from "@/lib/fetcher";
import { toast, useCityMap } from "@/hooks";
import { Route } from "@/types";

export default function useCheckRoutes() {
  const animationIdRef = useRef<number | null>(null);
  const [animatedRoute, setAnimatedRoute] = useState<GeoJSON.LineString | null>(
    null,
  );
  const { map, fitBounds } = useCityMap();
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
      const response = await fetchAddressName(lngLat);
      const displayName = response || "N/A";

      if (isStartingPointSelecting) {
        setStartingPoint({ lngLat, name: displayName });
        setIsStartingPointSelecting(false);
      } else if (isEndingPointSelecting) {
        setEndingPoint({ lngLat, name: displayName });
        setIsEndingPointSelecting(false);
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

  // Function to fit the map bounds to the route
  const handleFitBoundsForRoute = useCallback(
    (data: Route) => {
      if (!map) return;

      const boundingBox = bbox(data.geometry);
      const lngLatBounds: LngLatBoundsLike = [
        [boundingBox[0], boundingBox[1]],
        [boundingBox[2], boundingBox[3]],
      ];

      const padding = window.innerWidth < 420 ? 40 : 100;

      // Fit bounds if route geometry is outside of the screen
      if (
        !map.getBounds().contains(lngLatBounds[0]) ||
        !map.getBounds().contains(lngLatBounds[1])
      ) {
        fitBounds({
          bounds: lngLatBounds,
          padding: {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
          },
        });
      }
    },
    [map, fitBounds],
  );

  // Function to clear all route-related states
  const clearAllRouteStates = useCallback(() => {
    setRoute(null);
    setAnimatedRoute(null);
    setStartingPoint(null);
    setEndingPoint(null);
    setIsStartingPointSelecting(false);
    setIsEndingPointSelecting(false);
    setCursorStyle({ isSelecting: false });
  }, []);

  // Function to reverse the starting and ending points
  const reversePoints = useCallback(() => {
    setStartingPoint(endingPoint);
    setEndingPoint(startingPoint);
  }, [startingPoint, endingPoint]);

  // Function to animate the route
  const animateRoute = (geometry: GeoJSON.LineString, duration: number) => {
    const coordinates = geometry.coordinates;
    const totalCoordinates = coordinates.length;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Calculate progress based on elapsed time
      const progress = Math.min(elapsed / duration, 1);
      const segmentCount = Math.floor(progress * totalCoordinates);

      setAnimatedRoute({
        type: "LineString",
        coordinates: coordinates.slice(0, segmentCount),
      });

      // Continue animation if not yet complete
      if (progress < 1) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation
    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Cleanup the animation
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return {
    route,
    animatedRoute,
    startingPoint,
    endingPoint,
    isBothSelected,
    isSelectingPoint,
    isStartingPointSelecting,
    isEndingPointSelecting,
    setRoute,
    animateRoute,
    setAnimatedRoute,
    setStartingPoint,
    setEndingPoint,
    setIsStartingPointSelecting,
    setIsEndingPointSelecting,
    clearAllRouteStates,
    reversePoints,
    handleAddressName,
    handleFitBoundsForRoute,
  };
}
