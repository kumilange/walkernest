import { CloseButton } from "@/components/button";
import { capitalize } from "@/utils/misc";
import { Popup } from "react-map-gl/maplibre";
import { useAtomFavItems } from "../../stores/favoritesAtoms";
import { VALID_PROPERTY_PAIRS } from "./constants";
import { handleFavorites, processProperties } from "./helper";
import type { FeaturePopupProps } from "./types";

export default function FeaturePopup({ lngLat, properties, handlePopupClose }: FeaturePopupProps) {
  const validProperties = processProperties(properties);
  const { favItems } = useAtomFavItems();
  const { FavComponent, favItemName } = handleFavorites(properties, favItems);
  const colorClass = validProperties.length > 0 ? validProperties[0][0] : "";

  return (
    <Popup
      longitude={lngLat.lng}
      latitude={lngLat.lat}
      anchor="bottom"
      onClose={handlePopupClose}
      closeOnMove={true}
      className={`relative animate-fade-in delay-300 ${colorClass}`}
    >
      {validProperties.map(([key, value]) => {
        const icon = VALID_PROPERTY_PAIRS[key]?.icon;
        return icon ? (
          <div key={key} className="flex items-center mb-1">
            {icon}
            <span className="pl-1.5 font-bold">{capitalize(value)}</span>
          </div>
        ) : (
          <div key={key} className="flex items-center">
            <span className="flex-shrink-0">{FavComponent}</span>
            <span className="flex-grow pl-1.5">{favItemName || value}</span>
          </div>
        );
      })}
      <div className="absolute top-1 right-1">
        <CloseButton handleClose={handlePopupClose} />
      </div>
    </Popup>
  );
}
