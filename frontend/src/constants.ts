import type { CityArrayItem, CityDictItem } from "@/types";
import { transformToCityListArray } from "@/utils/misc";
import cityListDict from "../../shared/citydict.json";
import tailwindConfig from "../tailwind.config";

export const CITY_LIST_DICT: CityDictItem = cityListDict as CityDictItem;
export const CITY_LIST_ARRAY: CityArrayItem[] = transformToCityListArray(CITY_LIST_DICT);
export const twColors = tailwindConfig.theme.extend.colors;
