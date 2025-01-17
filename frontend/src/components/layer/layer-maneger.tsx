import { useAtomValue } from 'jotai';
import { lastLayerIdAtom } from '@/atoms';
import BoundaryLayer from './custom-layer/boundary-layer';
import RouteLayer from './custom-layer/route-layer';
import StaticDataLayers from './static-data-layers';
import DynamicDataLayers from './dynamic-data-layers';
import FavoritesLayer from './favorites-layer';
import RoutePointsLayer from './route-points-layer';

export default function LayerManager({
	city,
	cityId,
}: {
	city: string | null;
	cityId: number | null;
}) {
	const lastLayerId = useAtomValue(lastLayerIdAtom);

	return (
		<>
			{city && <BoundaryLayer city={city} />}
			{cityId && (
				<>
					<StaticDataLayers cityId={cityId} />
					<DynamicDataLayers cityId={cityId} />
				</>
			)}
			{lastLayerId &&
				<>
					<FavoritesLayer lastLayerId={lastLayerId} />
					<RoutePointsLayer lastLayerId={lastLayerId} />
				</>
			}
			<RouteLayer />
		</>
	);
}
