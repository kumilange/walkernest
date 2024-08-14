import { useEffect } from 'react';
import { useToast } from '@/hooks';
import { useAmenities } from '@/lib/fetcher';
import supermarketIconPath from '@/assets/supermarket-icon.png';
import cafeIconPath from '@/assets/cafe-icon.png';
import { extractBaseName } from '../helper';
import { PolygonLayer, IconLayer } from '../custom-base-layer';

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

				if (isCentroid) {
					const baseName = extractBaseName(type)
					const imagePath = iconPaths[baseName];

					return (
						<IconLayer
							key={index}
							cityId={cityId}
							data={geojson}
							imageType={baseName}
							imagePath={imagePath}
						/>
					);
				} else {
					return <PolygonLayer key={index} cityId={cityId} data={geojson} type={type} />;
				}
			})}
		</>
	);
}
