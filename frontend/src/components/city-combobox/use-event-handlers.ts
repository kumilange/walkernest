import { useCallback } from 'react';
import { useMap, LngLatBoundsLike } from 'react-map-gl/maplibre';
import { useSetAtom } from 'jotai';
import { bbox } from '@turf/turf';
import { useCityMap } from '@/hooks';
import { cityAtom } from '@/atoms';
import type { CityArrayItem } from '@/types';

export default function useEventHandlers() {
	const { map } = useMap();
	const { fitBounds } = useCityMap();
	const setCity = useSetAtom(cityAtom);

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
