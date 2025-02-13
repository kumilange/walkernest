import { Layer, Source } from 'react-map-gl/maplibre';
import { FeatureCollection } from 'geojson';
import { useIsLayerHidden } from '@/atoms';
import { filterFeaturesByType, getPolygonLayerStyle } from '../helper';

type PlygonLayerProps = {
	data: FeatureCollection;
	type: string;
}

export default function PolygonLayer({ data, type }: PlygonLayerProps) {
	const isHidden = useIsLayerHidden(type);
	if (isHidden) {
		return null;
	}

	const layerStyle = getPolygonLayerStyle(type);
	const polygonFeatures = filterFeaturesByType(data, 'Polygon');

	return (
		<Source id={`${type}-polygon-source`} type="geojson" data={polygonFeatures}>
			<Layer id={`${type}-polygon-layer`} {...layerStyle} />
		</Source>
	);
}