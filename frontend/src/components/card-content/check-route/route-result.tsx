import { Car } from 'lucide-react';
import { useCheckRoutes } from '@/hooks';
import { formatDistance, formatDurationInMins } from './helper';

export default function RouteResult() {
	const { route, isBothSelected } = useCheckRoutes();

	return (
		<>
			{isBothSelected && route && (
				<div className="relative mt-6 w-full h-[28px] flex gap-2 items-baseline">
					<Car className="absolute top-0 w-[26px] h-[26px]" />
					<div className="ml-9">
						<span className="font-bold text-xl text-green-600">
							{formatDurationInMins(route.duration)}
						</span>
						<span className="ml-1">mins</span>
					</div>
					<div className="ml-auto">
						<span className="font-bold">{formatDistance(route.distance).mi}</span>
						<span className="ml-1">mi</span>
						<span className="ml-1">/</span>
						<span className="ml-1 font-bold">{formatDistance(route.distance).km}</span>
						<span className="ml-1">km</span>
					</div>
				</div>
			)}
		</>
	)
}
