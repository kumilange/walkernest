import { Layer, Source } from 'react-map-gl/maplibre';
import { FeatureCollection } from 'geojson';
import { filterFeaturesByIds, filterFeaturesByType } from '../helper';
import useImageLoader from '../hooks/use-image-loader';
import useLayerVisibility from '../hooks/use-layer-visibility';

type IconLayerProps = {
	data: FeatureCollection;
	defaultImageId: string;
	defaultImagePath: string;
	skipIds?: number[];
	imageSize?: number;
	imageOffset?: [number, number];
	beforeId?: string;
}

export default function IconLayer({
	data,
	defaultImageId,
	defaultImagePath,
	skipIds = [],
	imageSize = 1,
	imageOffset = [0, -8],
	beforeId,
}: IconLayerProps) {
	useImageLoader(defaultImagePath, defaultImageId);

	const isHidden = useLayerVisibility(defaultImageId);
	if (isHidden) {
		return null;
	}

	const pointFeatures: FeatureCollection = filterFeaturesByType(data, 'Point');
	const featureCollection = skipIds?.length
		? filterFeaturesByIds(pointFeatures, skipIds)
		: pointFeatures;

	return (
		<Source
			id={`${defaultImageId}-icon-source`}
			type="geojson"
			data={featureCollection}
		>
			<Layer
				id={`${defaultImageId}-icon-layer`}
				type="symbol"
				layout={{
					'icon-image': defaultImageId,
					'icon-size': imageSize,
					'icon-offset': ['literal', imageOffset],
					"icon-allow-overlap": true,
					"icon-ignore-placement": true,
				}}
				{...(beforeId ? { beforeId } : {})}
			/>
		</Source>
	);
}
