import type { LngLatBoundsLike } from "maplibre-gl";
import { useMap } from "react-map-gl/maplibre";

export default function useCityMap() {
  const { map } = useMap();

  const flyTo = (center: [number, number], zoom: number) => {
    map?.flyTo({ center, zoom, essential: true });
  };

  const fitBounds = (bounds: LngLatBoundsLike, padding: number) => {
    map?.fitBounds(bounds, { padding, essential: true });
  };

  return { map, flyTo, fitBounds };
}
