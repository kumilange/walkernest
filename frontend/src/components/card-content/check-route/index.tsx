import { ArrowDownUp } from 'lucide-react';
import useCheckRoutes from '@/hooks/use-check-routes';
import SelectPoint from './select-point';
import RouteResult from './route-result';

export default function CheckRoute() {
	const {
		route,
		startingPoint,
		endingPoint,
		isBothSelected,
		isStartingPointSelecting,
		isEndingPointSelecting,
		setStartingPoint,
		setEndingPoint,
		setIsStartingPointSelecting,
		setIsEndingPointSelecting, reversePoints } = useCheckRoutes();

	return (
		<>
			<div className="flex flex-full flex-row">
				<div className="flex flex-full flex-col gap-3 flex-grow">
					<SelectPoint
						isStarting={true}
						point={startingPoint}
						setPoint={setStartingPoint}
						isPointSelecting={isStartingPointSelecting}
						setIsPointSelecting={setIsStartingPointSelecting}
					/>
					<SelectPoint
						isStarting={false}
						point={endingPoint}
						setPoint={setEndingPoint}
						isPointSelecting={isEndingPointSelecting}
						setIsPointSelecting={setIsEndingPointSelecting}
					/>
				</div>
				{
					(startingPoint || endingPoint) && <div className="flex items-center">
						<ArrowDownUp className="w-[16px] cursor-pointer" onClick={reversePoints} />
					</div>
				}
			</div >
			<RouteResult />
		</>
	)
}
