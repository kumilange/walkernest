import { useCallback, useState } from 'react';
import { useMap, LngLat } from 'react-map-gl/maplibre';
import { useAtom } from 'jotai';
import { removeFromLocalStorageList } from '@/lib/localstorage';
import { cityAtom, favItemsAtom } from '@/atoms';
import type { FavoriteItem } from '@/types';

export default function useEventHandlers() {
	const { map } = useMap();
	const [city, setCity] = useAtom(cityAtom);
	const [favItems, setFavItems] = useAtom(favItemsAtom);
	const [selectedId, setSelectedId] = useState(0);

	const flyTo = useCallback(
		(lngLat: LngLat) => {
			if (map) {
				map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 18 });
			}
		},
		[map],
	);

	const handleDelete = useCallback(
		({
			e,
			id,
		}: {
			e: React.MouseEvent<SVGSVGElement, MouseEvent>;
			id: number;
		}) => {
			e.preventDefault();
			e.stopPropagation(); // Prevent the parent button from being clicked
			removeFromLocalStorageList<FavoriteItem>('favorites', id);
			setFavItems(favItems.filter((fav) => fav.id !== id));
		},
		[favItems],
	);

	const handleSelect = useCallback(
		({
			e,
			id,
			lngLat,
		}: {
			e: React.MouseEvent<HTMLButtonElement, MouseEvent>;
			id: number;
			lngLat: LngLat;
		}) => {
			e.preventDefault();
			setSelectedId(id);
			flyTo(lngLat);

			const favItem = favItems.find((fav) => fav.id === id);
			if (favItem?.city && city !== favItem.city) {
				setCity(favItem.city);
			}
		},
		[favItems],
	);

	return {
		selectedId,
		handleDelete,
		handleSelect,
	};
}
