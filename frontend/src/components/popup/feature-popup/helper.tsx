import { Heart } from 'lucide-react';
import { VALID_PROPERTY_PAIRS } from '@/components/layer/constants';
import HeartIcon from './heart-icon';
import type { FavoriteItem } from '@/types';
import type { FeaturePopupProps } from './types';

/**
 * Filters and sorts properties based on specific criteria:
 * - {leisure: "dog_park"}, {leisure: "park"}
 * - {shop: "supermarket"}
 * - {building: "apartments"}, {building: "residential"}
 * - {name: non-null value}
 * Ensures the 'name' property is always present and adds { name: 'N/A' } if it does not exist.
 * Returns the filtered properties with the 'name' key-value pair at the end.
 *
 * @param {Record<string, string>} properties - The properties object to filter and sort.
 * @returns {[string, string][]} An array of key-value pairs representing the filtered and sorted properties.
 */
export function processProperties(
	properties: Record<string, string>,
): [string, string][] {
	const entries = Object.entries(properties);
	// Ensure 'name' key exists
	if (!entries.some(([key]) => key === 'name')) {
		entries.push(['name', 'N/A']);
	}

	const nameEntry = entries.find(([key]) => key === 'name')!;
	const otherEntries = entries.filter(([key]) => key !== 'name');
	const validEntries = otherEntries.filter(
		([key, value]) => !!VALID_PROPERTY_PAIRS[key]?.text?.includes(value),
	);
	validEntries.push(nameEntry);
	return validEntries;
}

/**
 * Determines the appropriate component to display based on whether the property is a favorite item or a default apartment.
 * If the property is a favorite item(apartment), display a filled heart icon.
 * If the property is a default apartment, display a heart outline icon.
 * Otherwise, display an empty placeholder span.
 *
 * @param {FeaturePopupProps['properties']} properties - The properties object containing the property details.
 * @param {FavoriteItem[]} favItems - An array of favorite items.
 * @returns {Object} An object containing the FavComponent and the name of the favorite item (if any).
 */
export function handleFavorites(
	properties: FeaturePopupProps['properties'],
	favItems: FavoriteItem[],
) {
	const id = properties['id'];
	const favItem = favItems.find((item) => item.id === id);
	const isApartment = VALID_PROPERTY_PAIRS['building']['text'].includes(properties['building']);

	const FavComponent = favItem ? (
		<Heart size="20" fill="#ff93ac" stroke="#ff93ac" />
	) : isApartment ? (
		<HeartIcon />
	) : (
		<span className="inline-block w-[20px] h-[20px]"></span>
	);

	return { FavComponent, favItemName: favItem?.name };
}
