import { useAtomFavItems } from '@/atoms';
import favApartmentIconPath from '@/assets/fav-apartmemt-icon.png';
import { IconLayer } from '../custom-base-layer';

export default function FavoritesLayer({
	lastLayerId,
}: {
	lastLayerId: string;
}) {
	const { favItems } = useAtomFavItems();
	const favoritesFeatures = favItems.map(({ feature }) => feature);

	return (
		<IconLayer
			data={{ type: 'FeatureCollection', features: favoritesFeatures }}
			defaultImageId={`favorites`}
			defaultImagePath={favApartmentIconPath}
			imageSize={1.3}
			imageOffset={[0, -12]}
			beforeId={lastLayerId}
		/>
	)
}
