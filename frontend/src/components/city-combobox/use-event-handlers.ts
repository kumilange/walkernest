import { useCallback } from 'react';
import { useMap, LngLatBoundsLike } from 'react-map-gl/maplibre';
import { useSetAtom } from 'jotai';
import { bbox } from '@turf/turf';
import { cityAtom } from '@/atoms';
import type { CityArrayItem } from './type';

export default function useEventHandlers() {
	const { map } = useMap();
	const setCity = useSetAtom(cityAtom);

	const fitBounds = useCallback(
		(bounds: LngLatBoundsLike) => {
			if (map) {
				map.fitBounds(bounds, {
					padding: { top: 10, bottom: 10, left: 10, right: 10 },
				});
			}
		},
		[map],
	);

	const handleSearch = useCallback(
		(cityItem: CityArrayItem) => {
			setCity(cityItem.value);
			const boundingBox = bbox(cityItem.geometry);
			const lngLatBounds: LngLatBoundsLike = [
				[boundingBox[0], boundingBox[1]],
				[boundingBox[2], boundingBox[3]],
			];
			fitBounds(lngLatBounds);
		},
		[map],
	);

	return {
		handleSearch,
	};
}
