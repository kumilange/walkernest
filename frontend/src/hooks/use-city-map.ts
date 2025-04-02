import { useCallback } from "react";
import { useMap, LngLatBoundsLike } from "react-map-gl/maplibre";

export default function useCityMap() {
  const { map } = useMap();

  // Function to fit the map bounds to the specified area
  const fitBounds = useCallback(
    ({
      bounds,
      padding = { top: 10, bottom: 10, left: 10, right: 10 },
    }: {
      bounds: LngLatBoundsLike;
      padding?: { top: number; bottom: number; left: number; right: number };
    }) => {
      if (map) {
        map.fitBounds(bounds, { padding });
      }
    },
    [map],
  );

  return {
    map,
    fitBounds,
  };
}
