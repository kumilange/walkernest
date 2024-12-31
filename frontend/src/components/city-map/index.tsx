import { Map, ScaleControl, NavigationControl } from 'react-map-gl/maplibre';
import { useAtomValue } from 'jotai';
import { cityAtom } from '@/atoms';
import { CITY_LIST_MAP } from '@/constants';
import LayerManager from '@/components/layer';
import { FeaturePopup, NameFavoritePopup } from '@/components/popup';
import { getInteractiveLayerIds } from './helper';
import { INITIAL_VIEW_STATE, MAP_STYLE } from './constants';
import useEventHandlers from './hooks/use-event-handlers';
import useSyncFavorites from './hooks/use-sync-favorites';

export default function CityMap() {
	useSyncFavorites();
	const city = useAtomValue(cityAtom);
	const cityId = city ? CITY_LIST_MAP[city].id : null;
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
			mapboxAccessToken={import.meta.env.VITE_MAPBOX_API_KEY}
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
			<NavigationControl />
			<ScaleControl position="bottom-right" />
		</Map>
	);
}
