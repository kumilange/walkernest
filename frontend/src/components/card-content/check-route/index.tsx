import { CarFront, CircleX, Locate, LocateFixed, ArrowDownUp } from 'lucide-react';
import { setCursorStyle } from '@/lib/misc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useCheckRoutes from '@/hooks/use-check-routes';

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
		setIsEndingPointSelecting } = useCheckRoutes();

	return (
		<>
			<div className="flex flex-full flex-row">
				<div className="flex flex-full flex-col gap-3 flex-grow">
					<div className="flex w-full items-center">
						<div className="w-[24px]">
							<Locate className={`w-[16px] ${startingPoint ? 'text-green-600' : ''}`} />
						</div>
						{startingPoint
							?
							<Input className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" value={startingPoint.name} onChange={() => { setStartingPoint(null) }} />
							:
							<Button variant="outline" className={`w-[180px] ${isStartingPointSelecting ? 'animate-blink' : ''}`} onClick={() => {
								setIsStartingPointSelecting(true)
								setCursorStyle({ isSelecting: true })
							}}>Click starting point...</Button>
						}
						<button className="w-[24px] flex justify-end">
							<CircleX
								className="w-[16px]"
								onClick={(e) => {
									e.stopPropagation();
									setIsStartingPointSelecting(false)
									setStartingPoint(null)
									setCursorStyle({ isSelecting: false })
								}}
							/>
						</button>
					</div>

					<div className="flex w-full items-center">
						<div className="w-[24px]">
							<LocateFixed className={`w-[16px] ${endingPoint ? 'text-green-600' : ''}`} />
						</div>
						{endingPoint
							?
							<Input className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" value={endingPoint.name} onChange={() => { setEndingPoint(null) }} />
							:
							<Button variant="outline" className={`w-[180px] ${isEndingPointSelecting ? 'animate-blink' : ''}`} onClick={() => {
								setIsEndingPointSelecting(true)
								setCursorStyle({ isSelecting: true })
							}}>Click ending point...</Button>
						}
						<button className="w-[24px] flex justify-end">
							<CircleX
								className="w-[16px]"
								onClick={(e) => {
									e.stopPropagation();
									setIsEndingPointSelecting(false)
									setEndingPoint(null)
									setCursorStyle({ isSelecting: false })
								}}
							/>
						</button>
					</div>
				</div>
				{
					(startingPoint || endingPoint) && <div className="flex items-center">
						<ArrowDownUp className="w-[16px] cursor-pointer" onClick={() => { const swap = startingPoint; setStartingPoint(endingPoint); setEndingPoint(swap) }} />
					</div>
				}
			</div >
			{isBothSelected && route &&
				<div className="mt-6 w-full flex gap-2 items-center">
					<CarFront className="w-[24px]" />
					<div className='ml-2'><span className='font-bold text-xl text-green-600'>{Math.ceil(route?.duration / 60)}</span><span className='ml-1'>mins</span></div>
					<div className='ml-2'><span className=''>{(route?.distance / 1000).toFixed(1)}</span><span className='ml-1'>km</span></div>
				</div >
			}
		</>
	)
}
