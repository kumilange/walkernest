import { Layer, Source, LayerProps } from 'react-map-gl/maplibre';
import { CITY_LIST_DICT } from '@/constants';
import { generateFeatureCollection } from '../helper';
import useLayerVisibility from '../hooks/use-layer-visibility';
import { twColors } from '@/constants';

const layerLineStyle: LayerProps = {
	id: `boundary-line-layer`,
	type: 'line',
	source: `boundary-source`,
	layout: {
		'line-join': 'round',
		'line-cap': 'round',
	},
	paint: {
		'line-color': twColors.boundaryLine,
		'line-width': 3,
	},
};

const layerFillStyle: LayerProps = {
	id: `boundary-fill-layer`,
	type: 'fill',
	source: `boundary-source`,
	paint: {
		'fill-color': twColors.boundaryFill,
		'fill-opacity': 0.3,
	},
};

export default function BoundaryLayer({ city }: { city: string }) {
	const isHidden = useLayerVisibility('boundary');
	if (isHidden) {
		return null;
	}

	const geometry = CITY_LIST_DICT[city].geometry;
	const featureCollection = generateFeatureCollection(geometry);

	return (
		<Source id={`boundary-source`} type="geojson" data={featureCollection}>
			<Layer
				id={`boundary-line-layer`}
				{...layerLineStyle}
				beforeId="housenumber"
			/>
			<Layer
				id={`boundary-fill-layer`}
				{...layerFillStyle}
				beforeId="housenumber"
			/>
		</Source>
	);
}
