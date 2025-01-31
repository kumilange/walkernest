import cityListDict from '../../shared/citydict.json';
import { transformToCityListArray } from '@/lib/misc';
import type { CityDictItem, CityArrayItem } from '@/types';
import tailwindConfig from '../tailwind.config';

export const CITY_LIST_DICT: CityDictItem = cityListDict as CityDictItem;
export const CITY_LIST_ARRAY: CityArrayItem[] = transformToCityListArray(CITY_LIST_DICT);
export const twColors = tailwindConfig.theme.extend.colors;
