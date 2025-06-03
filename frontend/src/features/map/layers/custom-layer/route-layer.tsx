import { twColors } from "@/constants";
import type { Route } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, type LayerProps, Source } from "react-map-gl/maplibre";
import type { LngLat } from "react-map-gl/maplibre";

interface RouteLayerProps {
  route: Route | null;
}

const layerStyle: LayerProps = {
  id: "route",
  type: "line",
  source: "route-source",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": twColors.route,
    "line-width": 5,
    "line-dasharray": [0, 1],
  },
};

export default function RouteLayer({ route }: RouteLayerProps) {
  const [animatedCoordinates, setAnimatedCoordinates] = useState<[number, number][]>([]);
  const animationStartTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const routeRef = useRef<Route | null>(route);

  // Update route ref when route prop changes (this happens on re-mount due to key change)
  routeRef.current = route;

  const getAnimatedSlice = useCallback(
    (progress: number, originalCoordinates: [number, number][]): [number, number][] => {
      if (originalCoordinates.length < 2 || progress <= 0) {
        return [];
      }

      if (progress >= 1) {
        return originalCoordinates;
      }

      const targetPoints = Math.ceil(progress * originalCoordinates.length);
      const clampedTargetPoints = Math.max(2, targetPoints);

      return originalCoordinates.slice(0, clampedTargetPoints);
    },
    []
  );

  const animateStep = useCallback(() => {
    const currentRoute = routeRef.current;
    if (!animationStartTimeRef.current || !currentRoute?.geometry?.coordinates) {
      return;
    }

    const elapsedTime = Date.now() - animationStartTimeRef.current;

    if (elapsedTime < 1000) {
      const progress = elapsedTime / 1000;
      const originalCoords = currentRoute.geometry.coordinates as [number, number][];
      const newAnimatedCoordinates = getAnimatedSlice(progress, originalCoords);

      setAnimatedCoordinates(newAnimatedCoordinates);
      rafIdRef.current = requestAnimationFrame(animateStep);
    } else {
      // Ensure full route display on animation completion
      const originalCoords = currentRoute.geometry.coordinates as [number, number][];
      setAnimatedCoordinates(originalCoords);
      rafIdRef.current = null;
    }
  }, [getAnimatedSlice]);

  useEffect(() => {
    const currentRoute = routeRef.current;

    if (
      currentRoute?.geometry?.coordinates &&
      Array.isArray(currentRoute.geometry.coordinates) &&
      currentRoute.geometry.coordinates.length >= 2
    ) {
      animationStartTimeRef.current = Date.now();
      setAnimatedCoordinates([]);
      rafIdRef.current = requestAnimationFrame(animateStep);
    } else {
      // Graceful handling for routes with fewer than 2 coordinates
      setAnimatedCoordinates([]);
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [animateStep]);

  return (
    <>
      {route && animatedCoordinates.length >= 2 && (
        <Source
          id="route-source"
          type="geojson"
          data={{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: animatedCoordinates,
            },
            properties: {},
          }}
        >
          <Layer id="route-layer" {...layerStyle} />
        </Source>
      )}
    </>
  );
}
