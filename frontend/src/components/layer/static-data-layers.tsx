import { useEffect } from 'react';
import { useToast } from '@/hooks';
import { useStaticCityData } from '@/lib/fetcher';
import supermarketIconPath from '@/assets/supermarket-icon.png';
import GeoJsonLayer from './custom-layer/geojson-layer';
import IconLayer from './custom-layer/icon-layer';

export default function StaticDataLayers({ cityId }: { cityId: number }) {
	const { toast } = useToast();
	const { data, error } = useStaticCityData(cityId);

	useEffect(() => {
		if (error) {
			toast({
				variant: 'destructive',
				description: 'Supermarket and park data fetch failed.',
				duration: 10000,
			});
		}
	}, [error, toast]);

	return (
		<>
			{data?.geojsons.map((geojson, index) => {
				const type = data.types[index];

				switch (true) {
					case type.includes('supermarket_centroid'):
						return (
							<IconLayer
								key={index}
								data={geojson}
								defaultImageId={type}
								defaultImagePath={supermarketIconPath}
							/>
						);
					default:
						return <GeoJsonLayer key={index} data={geojson} idPrefix={type} />;
				}
			})}
		</>
	);
}
