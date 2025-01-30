import { useAtomValue } from 'jotai';
import { favItemsAtom } from '@/atoms';
import { useCheckRoutes } from '@/hooks';

/**
 * Generates an array of interactive layer IDs based on the provided city ID and the current state.
 *
 * This function determines which layers should be interactive on the city map. It takes into account
 * whether the user is currently selecting a point and the favorite items stored in the state.
 *
 * @param {number | null} cityId - The ID of the city for which to generate layer IDs. If null, only favorite item layers are returned.
 * @returns {string[]} An array of interactive layer IDs.
 */
export function getInteractiveLayerIds(cityId: number | null): string[] {
	const { isSelectingPoint } = useCheckRoutes();
	const favItems = useAtomValue(favItemsAtom);
	const favLayerIds = favItems.map(
		(item) => `${item.id}_fav_apartment-icon-layer`,
	);

	// If selecting a point, no layers should be interactive
	if (isSelectingPoint) return [];

	// If no city ID, return only favorite item layers
	if (!cityId) return [...favLayerIds];

	// Return the interactive layer IDs for the specified city and favorite items
	return [
		`${cityId}_park-polygon-layer`,
		`${cityId}_result_centroid-icon-layer`,
		`${cityId}_supermarket_centroid-icon-layer`,
		`${cityId}_cafe_centroid-icon-layer`,
		...favLayerIds,
	];
}
