import { Heart } from "lucide-react";
import { VALID_PROPERTY_PAIRS } from "@/components/layer/constants";
import HeartIcon from "./heart-icon";
import type { FavoriteItem } from "@/types";
import type { FeaturePopupProps } from "./types";
import { twColors } from "@/constants";

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
  properties: Record<string, string>,
): [string, string][] {
  const entries = Object.entries(properties);
  // Ensure 'name' key exists
  if (!entries.some(([key]) => key === "name")) {
    entries.push(["name", "N/A"]);
  }

  const nameEntry = entries.find(([key]) => key === "name")!;
  const otherEntries = entries.filter(([key]) => key !== "name");
  const validEntries = otherEntries.filter(
    ([key, value]) => !!VALID_PROPERTY_PAIRS[key]?.text?.includes(value),
  );
  validEntries.push(nameEntry);

  return validEntries;
}

/**
 * Determines the appropriate component to display based on whether the property is a favorite item or a default apartment.
 */
export function handleFavorites(
  properties: FeaturePopupProps["properties"],
  favItems: FavoriteItem[],
) {
  const id = properties["id"];
  const favItem = favItems.find((item) => item.id === id);
  const isApartment = VALID_PROPERTY_PAIRS["building"]["text"].includes(
    properties["building"],
  );

  const FavComponent = favItem ? (
    <Heart size="20" fill={twColors.apartment} stroke={twColors.apartment} />
  ) : isApartment ? (
    <HeartIcon />
  ) : (
    <span className="inline-block w-[20px] h-[20px]"></span>
  );

  return { FavComponent, favItemName: favItem?.name };
}
