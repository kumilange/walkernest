import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CityMapItem, CityArrayItem, MaxDistance, IsAmenityOn } from '@/types';

/**
 * Combines multiple class names into a single string.
 *
 * This function takes any number of class name inputs, merges them using `clsx`,
 * and then further processes them with `twMerge` to handle Tailwind CSS class conflicts.
 *
 * @param {...ClassValue[]} inputs - The class names to combine. These can be strings, arrays, or objects.
 * @returns {string} The combined class names as a single string.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Capitalizes the first letter of a string and converts the rest to lowercase.
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Sets the cursor style of the canvas element based on the selection state.
 */
export const setCursorStyle = ({ isSelecting }: { isSelecting: boolean }) => {
	const canvasElement = document.querySelector('.maplibregl-canvas') as HTMLElement;
	if (!canvasElement) return;

	if (isSelecting) {
		canvasElement.style.cursor = 'crosshair';
	} else {
		canvasElement.style.cursor = 'default';
	}
}

/**
 * Transforms a map of city items into an array of city items with additional properties.
 * 
 * @remarks
 * The function capitalizes each word in the city name and replaces underscores with spaces to create the label property.
 */
export const transformToCityListArray = (cityLisMap: CityMapItem): CityArrayItem[] => {
	function capitalize(str: string): string {
		return str.replace(/\b\w/g, (char: string) => char.toUpperCase());
	}

	// Transform the data to match the CityArrayItem type
	const cityListArray: CityArrayItem[] = Object.entries(cityLisMap).map(
		([key, value]) => ({
			id: value.id,
			value: key,
			label: capitalize(key.replace(/_/g, ' ')),
			geometry: value.geometry,
		})
	);

	// Sort the array in alphabetical order based on the label property
	cityListArray.sort((a, b) => a.label.localeCompare(b.label));

	return cityListArray;
};

/**
 * Transforms an array of query parameter strings into a specific format.
 */
export function transformQueryParams(queryParams: string[]): string[] {
	return queryParams.map((param) => {
		const urlParams = new URLSearchParams(param);
		const cityId = urlParams.get('city_id');
		const name = urlParams.get('name');
		const isCentroid = urlParams.get('is_centroid');

		if (isCentroid) {
			return `${cityId}_${name}_centroid`;
		}

		return `${cityId}_${name}`;
	});
}

/**
 * Converts the keys of an object from camelCase to snake_case.
 */
export function convertKeysToSnakeCase(obj: { [key: string]: number }): { [key: string]: number } {
	const result: { [key: string]: number } = {};

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
			result[snakeCaseKey] = obj[key];
		}
	}

	return result;
}

/**
 * Generates city data parameters based on the provided maximum distances and amenity availability.
 */
export function generateCityDataParams({ maxDistance, isAmenityOn }: { maxDistance: MaxDistance, isAmenityOn: IsAmenityOn },) {
	return {
		...(isAmenityOn.park ? { maxMeterPark: maxDistance.park } : {}),
		...(isAmenityOn.supermarket ? { maxMeterSupermarket: maxDistance.supermarket } : {}),
		...(isAmenityOn.cafe ? { maxMeterCafe: maxDistance.cafe } : {}),
	};
}
