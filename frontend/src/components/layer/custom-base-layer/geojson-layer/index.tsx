import { FeatureCollection } from 'geojson';
import { filterFeaturesByType, generateLayerStyles } from '../../helper';
import useLayerVisibility from '../../hooks/use-layer-visibility';
import RenderLayer from './render-layer';

type GeoJsonLayerProps = {
	data: FeatureCollection;
	idPrefix: string;
}

export default function GeoJsonLayer({ data, idPrefix }: GeoJsonLayerProps) {
	const isHidden = useLayerVisibility(idPrefix);
	if (isHidden) {
		return null;
	}

	const { pointLayerStyle, lineStringLayerStyle, polygonLayerStyle } =
		generateLayerStyles(idPrefix);
	const pointFeatures: FeatureCollection = filterFeaturesByType(data, 'Point');
	const lineStringFeatures: FeatureCollection = filterFeaturesByType(
		data,
		'LineString',
	);
	const polygonFeatures: FeatureCollection = filterFeaturesByType(
		data,
		'Polygon',
	);

	return (
		<>
			<RenderLayer
				idPrefix={idPrefix}
				type="point"
				data={pointFeatures}
				style={pointLayerStyle}
			/>
			<RenderLayer
				idPrefix={idPrefix}
				type="lineString"
				data={lineStringFeatures}
				style={lineStringLayerStyle}
			/>
			<RenderLayer
				idPrefix={idPrefix}
				type="polygon"
				data={polygonFeatures}
				style={polygonLayerStyle}
			/>
		</>
	);
}