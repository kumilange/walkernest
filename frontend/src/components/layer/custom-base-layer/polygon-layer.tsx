import { Layer, Source } from 'react-map-gl/maplibre';
import { FeatureCollection } from 'geojson';
import { useIsLayerHidden } from '@/atoms';
import { filterFeaturesByType, getPolygonLayerStyle } from '../helper';

type PlygonLayerProps = {
	data: FeatureCollection;
	type: string;
	cityId: number;
}

export default function PolygonLayer({ data, type, cityId }: PlygonLayerProps) {
	const isHidden = useIsLayerHidden(type);
	if (isHidden) {
		return null;
	}

	const layerStyle = getPolygonLayerStyle({ cityId, type });
	const polygonFeatures = filterFeaturesByType(data, 'Polygon');

	return (
		<Source id={`${type}-polygon-source`} type="geojson" data={polygonFeatures}>
			<Layer id={`${cityId}_${type}-polygon-layer`} {...layerStyle} />
		</Source>
	);
}
