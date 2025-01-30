import { useAtomValue } from 'jotai';
import { lastLayerIdAtom } from '@/atoms';
import { BoundaryLayer, RouteLayer, StaticDataLayers, DynamicDataLayers, FavoritesLayer, RoutePointsLayer } from "./custom-layer"

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
			{/* The lastLayerId is used to ensure that this layer is rendered on top of other layers. */}
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
