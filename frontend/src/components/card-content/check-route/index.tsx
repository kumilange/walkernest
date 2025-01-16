import { CircleX, Locate, LocateFixed, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { startingPointAtom, endingPointAtom, isStartingPointSelectingAtom, isEndingPointSelectingAtom } from '@/atoms';
import { setCursorStyle } from '@/lib/misc';

export default function CheckRoute() {
	const [startingPoint, setStartingPoint] = useAtom(startingPointAtom)
	const [endingPoint, setEndingPoint] = useAtom(endingPointAtom)
	const setIsStartingPointSelecting = useSetAtom(isStartingPointSelectingAtom)
	const setIsEndingPointSelecting = useSetAtom(isEndingPointSelectingAtom)

	return (
		<>
			<div className="flex flex-full flex-row">
				<div className="flex flex-full flex-col gap-3 flex-grow">
					<div className="flex w-full items-center">
						<div className="w-[24px]">
							<Locate className="w-[16px]" />
						</div>
						{startingPoint
							?
							<Input className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" value={startingPoint.name} onChange={() => { setStartingPoint(null) }} />
							:
							<Button variant="outline" className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" onClick={() => {
								setIsStartingPointSelecting(true)
								setCursorStyle({ isSelecting: true })
							}}>Click starting point...</Button>
						}
						<button className="w-[24px] flex justify-end">
							{
								startingPoint &&
								<CircleX
									className="w-[16px]"
									onClick={(e) => { e.stopPropagation(); setStartingPoint(null) }}
								/>}
						</button>
					</div>
					<div className="flex w-full items-center">
						<div className="w-[24px]">
							<LocateFixed className="w-[16px]" />
						</div>
						{endingPoint
							?
							<Input className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" value={endingPoint.name} onChange={() => { setEndingPoint(null) }} />
							:
							<Button variant="outline" className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" onClick={() => {
								setIsEndingPointSelecting(true)
								setCursorStyle({ isSelecting: true })
							}}>Click ending point...</Button>
						}
						<button className="w-[24px] flex justify-end">
							{
								endingPoint &&
								<CircleX
									className="w-[16px]"
									onClick={(e) => { e.stopPropagation(); setEndingPoint(null) }}
								/>}
						</button>
					</div>
				</div>
				{
					(startingPoint || endingPoint) && <div className="flex items-center">
						<ArrowDownUp className="w-[16px] cursor-pointer" onClick={() => { const swap = startingPoint; setStartingPoint(endingPoint); setEndingPoint(swap) }} />
					</div>
				}
			</div >
			{/* Result */}
			{/* <div className="mt-3" >
				<span>CAR</span>
				<span>30 </span><span>mins</span>
				<span>24.4</span><span>miles</span>
			</div > */}
		</>
	)
}
