import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { useDynamicCityData } from '@/lib/fetcher';
import apartmentIconPath from '@/assets/apartment-icon.png';
import { favItemsAtom, walkingDistanceAtom } from '@/atoms';
import ClusterLayer from './custom-layer/cluster-layer';
import GeoJsonLayer from './custom-layer/geojson-layer';
import IconLayer from './custom-layer/icon-layer';
import { useToast } from '@/hooks';
import { ToastAction } from '@/components/ui/toast';

export default function DynamicDataLayers({ cityId }: { cityId: number }) {
	const { toast } = useToast();
	const { park, supermarket } = useAtomValue(walkingDistanceAtom);
	const { data, error } = useDynamicCityData({
		cityId,
		maxParkMeter: park,
		maxSupermarketMeter: supermarket,
	});
	const favItems = useAtomValue(favItemsAtom);
	const favIds = favItems.map((item) => item.id);

	useEffect(() => {
		if (data) {
			toast({
				description: `${data?.centroid.features.length} apartments found.`,
				className: 'bg-green-100 text-green-800 text-md',
				duration: 3000,
			});
			return;
		}

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Analyzing apartment failed.',
				description: 'There was a problem with your request.',
				action: <ToastAction altText="Try again">Try again</ToastAction>,
				duration: 10000,
			});
		}
	}, [data, error, toast]);

	return (
		<>
			{data?.polygon && (
				<GeoJsonLayer data={data.polygon} idPrefix={`${cityId}_result`} />
			)}
			{data?.centroid && (
				<>
					<IconLayer
						data={data.centroid}
						defaultImageId={`${cityId}_result_centroid`}
						defaultImagePath={apartmentIconPath}
						skipIds={favIds}
					/>
					<ClusterLayer
						data={data.centroid}
						idPrefix={`${cityId}_cluster_centroid`}
					/>
				</>
			)}
		</>
	);
}
