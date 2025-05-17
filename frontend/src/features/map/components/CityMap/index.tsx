import { Map, ScaleControl, NavigationControl } from "react-map-gl/maplibre";
import { useAtomCity } from "@/stores";
import { CITY_LIST_DICT } from "@/constants";
import LayerManager from "../../layers";
import AnalysisProgressDialog from "../AnalysisProgressDialog";
import FeaturePopup from "../FeaturePopup";
import NameFavoritePopup from "../NameFavoritePopup";
import { getInteractiveLayerIds } from "../../utils/mapHelpers";
import { INITIAL_VIEW_STATE, MAP_STYLE } from "../../constants/map";
import useSyncFavorites from "./hooks/useSyncFavorites";
import { useEventHandlers } from "./hooks";

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