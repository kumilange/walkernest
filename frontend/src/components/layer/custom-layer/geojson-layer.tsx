import { Layer, Source } from 'react-map-gl/maplibre';
import { FeatureCollection } from 'geojson';
import { filterFeaturesByType, generateLayerStyles } from '../helper';
import useLayerVisibility from '../hooks/use-layer-visibility';

export default function GeoJsonLayer({
	data,
	idPrefix,
}: {
	data: FeatureCollection;
	idPrefix: string;
}) {
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
			<Source
				id={`${idPrefix}-point-source`}
				type="geojson"
				data={pointFeatures}
			>
				<Layer id={`${idPrefix}-point-layer`} {...pointLayerStyle} />
			</Source>
			<Source
				id={`${idPrefix}-lineString-source`}
				type="geojson"
				data={lineStringFeatures}
			>
				<Layer id={`${idPrefix}-lineString-layer`} {...lineStringLayerStyle} />
			</Source>
			<Source
				id={`${idPrefix}-polygon-source`}
				type="geojson"
				data={polygonFeatures}
			>
				<Layer id={`${idPrefix}-polygon-layer`} {...polygonLayerStyle} />
			</Source>
		</>
	);
}
