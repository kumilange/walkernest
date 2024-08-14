import { useCallback } from 'react';
import { useMap, LngLatBoundsLike } from 'react-map-gl/maplibre';
import { bbox } from '@turf/turf';
import { useCityMap } from '@/hooks';
import { useAtomCity } from '@/atoms';
import type { CityArrayItem } from '@/types';

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
			fitBounds({ bounds: lngLatBounds });
		},
		[map],
	);

	return {
		handleSearch,
	};
}
