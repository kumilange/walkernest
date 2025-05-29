import { useCallback } from "react";
import { useMap, LngLatBoundsLike } from "react-map-gl/maplibre";
import { bbox } from "@turf/turf";
import { useAtomCity } from "@/stores";
import type { CityArrayItem } from "@/types";
import { useCityMap } from "../../hooks";

export default function useEventHandlers() {
	const { map } = useMap();
	const { fitBounds } = useCityMap();
	const { setCity } = useAtomCity();

	const handleSearch = useCallback(
		(cityItem: CityArrayItem) => {
			setCity(cityItem.value);
			const boundingBox = bbox(cityItem.geometry);
			const lngLatBounds: LngLatBoundsLike = [
				[boundingBox[0], boundingBox[1]],
				[boundingBox[2], boundingBox[3]],
			];
			fitBounds(lngLatBounds, 20);
		},
		[map, fitBounds, setCity],
	);

	return {
		handleSearch,
	};
} 