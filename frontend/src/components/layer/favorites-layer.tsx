import { useAtomValue } from 'jotai';
import { favItemsAtom } from '@/atoms';
import { Feature } from 'geojson';
import favApartmentIconPath from '@/assets/fav-apartmemt-icon.png';
import IconLayer from './custom-layer/icon-layer';

export default function FavoritesLayer({
	lastLayerId,
}: {
	lastLayerId: string;
}) {
	const favItems = useAtomValue(favItemsAtom);
	const favoritesFeatures = favItems.map(({ feature }) => feature);

	return (
		<>
			{favoritesFeatures.map((feature: Feature) => {
				const id = feature.properties?.id;

				return (
					<IconLayer
						key={id}
						data={{ type: 'FeatureCollection', features: [feature] }}
						defaultImageId={`${id}_fav_apartment`}
						defaultImagePath={favApartmentIconPath}
						imageSize={1.3}
						imageOffset={[0, -12]}
						beforeId={lastLayerId}
					/>
				);
			})}
		</>
	);
}
