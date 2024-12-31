import { Layer, Source } from 'react-map-gl/maplibre';
import { FeatureCollection } from 'geojson';
import { filterFeaturesByType } from '../helper';
import useLayerVisibility from '../hooks/use-layer-visibility';
import { twColors } from '../constants';

const circleLayerStyle = {
	type: 'circle',
	paint: {
		'circle-color': twColors.clusterCircle,
		'circle-stroke-color': twColors.clusterStroke,
		'circle-stroke-width': 1,
		'circle-opacity': 0.7,
		'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 20, 40],
	},
};

const symbolLayerStyle = {
	type: 'symbol',
	layout: {
		'text-field': '{point_count_abbreviated}',
		'text-font': ['Noto Sans', 'Arial Unicode MS Bold'],
		'text-size': 12,
	},
};

export default function ClusterLayer({
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

	const pointFeatures: FeatureCollection = filterFeaturesByType(data, 'Point');

	return (
		<Source
			id={`${idPrefix}-source`}
			type="geojson"
			data={pointFeatures}
			cluster={true}
			clusterMaxZoom={14}
			clusterRadius={50}
		>
			{/* @ts-ignore */}
			<Layer
				id={`${idPrefix}-circle-layer`}
				filter={['has', 'point_count']}
				{...circleLayerStyle}
			/>
			{/* @ts-ignore */}
			<Layer
				id={`${idPrefix}-count-layer`}
				filter={['has', 'point_count']}
				{...symbolLayerStyle}
			/>
		</Source>
	);
}
