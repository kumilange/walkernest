import locateIconPath from '@/assets/locate-icon.png';
import locateFixedIconPath from '@/assets/locate-fixed-icon.png';
import useCheckRoutes from '@/hooks/use-check-routes';
import { generateFeatureCollection } from './helper';
import IconLayer from './custom-layer/icon-layer';

export default function RoutePointsLayer() {
	const { startingPoint, endingPoint } = useCheckRoutes();
	const data = [];

	if (startingPoint?.lngLat) {
		data.push({
			id: 'starting-point',
			icon: locateIconPath,
			geojson: generateFeatureCollection({
				type: 'Point',
				coordinates: [startingPoint.lngLat.lng, startingPoint.lngLat.lat]
			})
		});
	}
	if (endingPoint?.lngLat) {
		data.push({
			id: 'ending-point',
			icon: locateFixedIconPath,
			geojson: generateFeatureCollection({
				type: 'Point',
				coordinates: [endingPoint.lngLat.lng, endingPoint.lngLat.lat]
			})
		});
	}

	return (
		<>
			{data.map(({ id, icon, geojson }) => {
				return (<IconLayer
					key={id}
					data={geojson}
					defaultImageId={id}
					defaultImagePath={icon}
					imageOffset={[0, 0]}
				/>)
			})}
		</>
	);
}
