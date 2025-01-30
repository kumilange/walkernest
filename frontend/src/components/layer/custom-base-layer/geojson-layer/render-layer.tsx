import { Layer, Source } from 'react-map-gl/maplibre';
import { FeatureCollection } from 'geojson';

export default function RenderLayer({
	idPrefix,
	type,
	data,
	style,
}: {
	idPrefix: string;
	type: string;
	data: FeatureCollection;
	style: any;
}) {
	return (
		<Source id={`${idPrefix}-${type}-source`} type="geojson" data={data}>
			<Layer id={`${idPrefix}-${type}-layer`} {...style} />
		</Source>
	)
}
