import { ReactNode } from "react";
import { House, ShoppingCart, Trees, Coffee } from "lucide-react";
import { twColors } from "@/constants";

export const polygonColorMapping: { [key: string]: string } = {
  result: twColors.apartment,
  apartment: twColors.apartment,
  supermarket: twColors.supermarket,
  park: twColors.park,
  cafe: twColors.cafe,
};

type ValidPropertyPairs = {
  [key: string]: {
    text: string[];
    icon: ReactNode;
  };
};

export const VALID_PROPERTY_PAIRS: ValidPropertyPairs = {
  leisure: { text: ["dog_park", "park"], icon: <Trees size="20px" /> },
  shop: { text: ["supermarket"], icon: <ShoppingCart size="20px" /> },
  building: {
    text: ["apartments", "residential"],
    icon: <House size="20px" />,
  },
  amenity: {
    text: ["cafe"],
    icon: <Coffee size="20px" />,
  },
};
