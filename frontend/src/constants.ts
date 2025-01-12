import cityLisMap from '../../shared/citylist.json';
import type { CityMapItem, CityArrayItem } from '@/components/city-combobox/type';

const transformToCityListArray = (cityLisMap: CityMapItem): CityArrayItem[] => {
	// Function to capitalize each word
	function capitalizeWords(str: string): string {
		return str.replace(/\b\w/g, (char: string) => char.toUpperCase());
	}

	// Transform the data to match the CityArrayItem type
	const cityListArray: CityArrayItem[] = Object.entries(cityLisMap).map(
		([key, value]) => ({
			id: value.id,
			value: key,
			label: capitalizeWords(key.replace(/_/g, ' ')),
			geometry: value.geometry,
		})
	);

	// Sort the array in alphabetical order based on the label property
	cityListArray.sort((a, b) => a.label.localeCompare(b.label));

	return cityListArray;
};

export const CITY_LIST_MAP: CityMapItem = cityLisMap as CityMapItem;
export const CITY_LIST_ARRAY: CityArrayItem[] = transformToCityListArray(CITY_LIST_MAP);
