import { useEffect } from 'react';
import { useToast } from '@/hooks';
import { useAmenities } from '@/lib/fetcher';
import supermarketIconPath from '@/assets/supermarket-icon.png';
import cafeIconPath from '@/assets/cafe-icon.png';
import { extractBaseName } from '../helper';
import { GeoJsonLayer, IconLayer } from '../custom-base-layer';

const iconPaths: { [key: string]: string } = {
	supermarket: supermarketIconPath,
	cafe: cafeIconPath,
};

export default function AmenitiesLayers({ cityId }: { cityId: number }) {
	const { toast } = useToast();
	const { data, error } = useAmenities(cityId);

	useEffect(() => {
		if (error) {
			toast({
				variant: 'destructive',
				description: 'Park, supermarket and cafe data fetch failed.',
				duration: 10000,
			});
		}
	}, [error, toast]);

	return (
		<>
			{data?.geojsons.map((geojson, index) => {
				const type = data.types[index];
				const isCentroid = type.includes('centroid');
				const baseName = extractBaseName(type);
				const imagePath = isCentroid && iconPaths[baseName] || "";

				switch (true) {
					case isCentroid:
						return (
							<IconLayer
								key={index}
								data={geojson}
								defaultImageId={type}
								defaultImagePath={imagePath}
							/>
						);
					default:
						return <GeoJsonLayer key={index} data={geojson} idPrefix={type} />;
				}
			})}
		</>
	);
}
