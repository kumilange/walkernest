import { Coffee, House, ShoppingCart, Trees } from "lucide-react";
import type { ReactNode } from "react";

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
