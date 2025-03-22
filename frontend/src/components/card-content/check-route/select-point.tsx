import { CircleX, Locate, LocateFixed } from 'lucide-react';
import { setCursorStyle } from '@/lib/misc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoutePoint } from '@/types';
import { useCallback } from 'react';

export default function SelectPoint({ isStarting, point, setPoint, isPointSelecting, setIsPointSelecting }: {
	isStarting: boolean,
	point: RoutePoint | null, isPointSelecting: boolean, setPoint: Function, setIsPointSelecting: Function
}) {
	const classes = `w-[16px] ${point ? 'text-green-600' : ''}`

	const handleSelectPoint = useCallback(() => {
		setIsPointSelecting(true)
		setCursorStyle({ isSelecting: true })
	}, []);

	const handleClearPoint = useCallback(() => {
		setIsPointSelecting(false)
		setPoint(null)
		setCursorStyle({ isSelecting: false })
	}, []);

	return (
		<div className="flex items-center w-[250px]">
			<div className="w-[24px]">
				{isStarting
					? <Locate className={classes} />
					: <LocateFixed className={classes} />}
			</div>
			{point
				?
				<Input className="mx-1 overflow-hidden text-ellipsis whitespace-nowrap" value={point.name} onChange={() => { setPoint(null) }} />
				:
				<Button variant="outline" className={`w-full mx-1 ${isPointSelecting ? 'animate-blink' : ''}`} onClick={handleSelectPoint}>{`Click ${isStarting ? "start" : "end"}ing point...`}</Button>
			}
			<button className="w-[24px] flex justify-end">
				<CircleX
					className="w-[16px]"
					onClick={handleClearPoint}
				/>
			</button>
		</div>
	)
}
