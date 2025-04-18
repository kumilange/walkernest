import { Map, ScaleControl, NavigationControl } from "react-map-gl/maplibre";
import { useAtomCity } from "@/atoms";
import { CITY_LIST_DICT } from "@/constants";
import LayerManager from "@/components/layer";
import AnalysisProgressDialog from "@/components/analysis-progress-dialog";
import { FeaturePopup, NameFavoritePopup } from "@/components/popup";
import { getInteractiveLayerIds } from "./helper";
import { INITIAL_VIEW_STATE, MAP_STYLE } from "./constants";
import { useEventHandlers, useSyncFavorites } from "./hooks";

export default function CityMap() {
  const { city } = useAtomCity();
  const cityId = city ? CITY_LIST_DICT[city].id : null;
  useSyncFavorites();
  const {
    lngLat,
    properties,
    isPopupOpen,
    isFavPopupOpen,
    handleIdle,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handlePopupClose,
  } = useEventHandlers();
  const hasFeaturePopup = isPopupOpen && lngLat && properties;
  const hasFavPopup = isFavPopupOpen && lngLat && properties && city;

  return (
    <Map
      id="map"
      mapStyle={`${MAP_STYLE.maptiler}`}
      initialViewState={INITIAL_VIEW_STATE}
      interactiveLayerIds={getInteractiveLayerIds(cityId)}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onIdle={handleIdle}
    >
      <LayerManager city={city} cityId={cityId} />
      {hasFeaturePopup && (
        <FeaturePopup
          lngLat={lngLat}
          properties={properties}
          handlePopupClose={handlePopupClose}
        />
      )}
      {hasFavPopup && (
        <NameFavoritePopup
          city={city}
          lngLat={lngLat}
          properties={properties}
          handlePopupClose={handlePopupClose}
        />
      )}
      {cityId && <AnalysisProgressDialog cityId={cityId} />}
      <NavigationControl />
      <ScaleControl position="bottom-right" />
    </Map>
  );
}
