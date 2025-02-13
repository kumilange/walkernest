import { useCheckRoutes } from '@/hooks';

/**
 * Generates an array of interactive layer IDs based on the provided city ID and the current route selecting state.
 */
export function getInteractiveLayerIds(cityId: number | null): string[] {
	const { isSelectingPoint } = useCheckRoutes();

	// If selecting a point, no layers should be interactive
	if (isSelectingPoint) return [];

	// If no city ID, return only favorites layer should be interactive
	if (!cityId) return [`favorites-icon-layer`];

	return [
		`result-icon-layer`,
		`supermarket-icon-layer`,
		`cafe-icon-layer`,
		`park-polygon-layer`,
		`favorites-icon-layer`,
	];
}
