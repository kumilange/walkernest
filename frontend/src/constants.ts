import cityLisMap from '../../shared/citylist.json';
import { transformToCityListArray } from '@/lib/misc';
import type { CityMapItem, CityArrayItem } from '@/types';

export const CITY_LIST_MAP: CityMapItem = cityLisMap as CityMapItem;
export const CITY_LIST_ARRAY: CityArrayItem[] = transformToCityListArray(CITY_LIST_MAP);
