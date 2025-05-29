import { twColors } from "@/constants";
import type { FavoriteItem } from "@/types";
import { Heart } from "lucide-react";
import { VALID_PROPERTY_PAIRS } from "./constants";
import HeartIcon from "./heart-icon";
import type { FeaturePopupProps } from "./types";

/**
 * Processes properties and returns valid pairs.
 * Ensures 'name' key exists, adding 'N/A' if missing.
 * Filters properties based on `VALID_PROPERTY_PAIRS`.
 * Always includes 'name' entry.
 *
 * @param properties - Property key-value pairs to process.
 * @returns Array of valid property key-value pairs.
 */
export function processProperties(
  properties: Record<string, string | number | boolean | null>
): [string, string][] {
  // Collect all property entries and convert values to strings
  const entries = Object.entries(properties).map(
    ([key, value]) => [key, value != null ? String(value) : ""] as [string, string]
  );

  // Always ensure 'name' is present
  const nameValue =
    properties.name && String(properties.name) !== "" ? String(properties.name) : "N/A";

  // Filter valid property pairs (excluding 'name')
  const validEntries = entries.filter(
    ([key, value]) => key !== "name" && VALID_PROPERTY_PAIRS[key]?.text?.includes(value)
  );

  // Add 'name' entry last
  validEntries.push(["name", nameValue]);

  return validEntries;
}

/**
 * Determines the appropriate component to display based on whether the property is a favorite item or a default apartment.
 */
export function handleFavorites(
  properties: FeaturePopupProps["properties"],
  favItems: FavoriteItem[]
) {
  const id = properties.id;
  const favItem = favItems.find((item) => item.id === id);
  const buildingValue = properties.building != null ? String(properties.building) : "";
  const isApartment = (VALID_PROPERTY_PAIRS.building?.text ?? []).includes(buildingValue);

  const FavComponent = favItem ? (
    <Heart size="20" fill={twColors.apartment} stroke={twColors.apartment} />
  ) : isApartment ? (
    <HeartIcon />
  ) : (
    <span className="inline-block w-[20px] h-[20px]" />
  );

  return { FavComponent, favItemName: favItem?.name };
}
