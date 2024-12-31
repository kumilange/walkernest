import { favItemsAtom } from '@/atoms';
import { useAtomValue } from 'jotai';

/**
 * Generates an array of interactive layer IDs based on the provided city name.
 * If the city name is null, it returns an empty array.
 *
 * @param {number | null} cityId - The the city ID.
 * @returns {string[]} An array of interactive layer IDs.
 */
export function getInteractiveLayerIds(cityId: number | null): string[] {
	const favItems = useAtomValue(favItemsAtom);
	const favLayerIds = favItems.map(
		(item) => `${item.id}_fav_apartment-icon-layer`,
	);

	if (!cityId) return [...favLayerIds];

	return [
		`${cityId}_park-polygon-layer`,
		`${cityId}_result_centroid-icon-layer`,
		`${cityId}_supermarket_centroid-icon-layer`,
		...favLayerIds,
	];
}
