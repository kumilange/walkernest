import { useAtomValue } from 'jotai';
import { lastLayerIdAtom } from '@/atoms';
import { BoundaryLayer, RouteLayer, AmenitiesLayers, AnalysisLayers, FavoritesLayer, RoutePointsLayer } from "./custom-layer"

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
					<AmenitiesLayers cityId={cityId} />
					<AnalysisLayers cityId={cityId} />
				</>
			)}
			{/* The lastLayerId is used to ensure that the layer is rendered on top of other layers. */}
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
