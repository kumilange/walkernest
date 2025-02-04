import { useCallback, useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

export default function useImageLoader(imagePath: string, imageId: string) {
	const { map } = useMap();

	const addImage = useCallback(async () => {
		if (!map || map.hasImage(imageId)) return;

		const image = await map.loadImage(imagePath);
		// check map.hasImage again to avoid an error "An image named "xxxx_fav_apartment" already exists."
		!map.hasImage(imageId) && map.addImage(imageId, image.data);
	}, [map]);

	useEffect(() => {
		if (!map) return;

		addImage();

		// styleimagemissing event gets fired when map style changes, need to add image again
		map.on('styleimagemissing', addImage);

		return () => {
			map.off('styleimagemissing', addImage);
		};
	}, [map]);
}
