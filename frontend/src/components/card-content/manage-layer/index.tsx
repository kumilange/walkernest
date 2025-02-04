import {
	Trees,
	House,
	ShoppingCart,
	Coffee,
	BoxSelect,
	ChartNetwork,
} from 'lucide-react';
import { useAtomLayersVisibility } from '@/atoms';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { LayerItem } from '@/types';

const layerList: LayerItem[] = [
	{ id: 'result', label: 'Matched Apartment', icon: <House /> },
	{ id: 'cluster', label: 'Cluster', icon: <ChartNetwork /> },
	{ id: 'park', label: 'Park & Dog Park', icon: <Trees /> },
	{ id: 'supermarket', label: 'Supermarket', icon: <ShoppingCart /> },
	{ id: 'cafe', label: 'Cafe', icon: <Coffee /> },
	{ id: 'boundary', label: 'City Boundary', icon: <BoxSelect /> },
];

export default function ManageLayer() {
	const { layersVisibility, setLayersVisibility } = useAtomLayersVisibility();

	return (
		<div className="grid w-full items-center">
			<div className="flex flex-col space-y-2 gap-3">
				{layerList.map(({ id, label, icon }) => (
					<div key={id} className="grid grid-cols-10 gap-2">
						<div className="flex items-center col-span-8">
							{icon}
							<Label htmlFor={id} className="ml-2">
								{label}
							</Label>
						</div>
						<div className="flex items-center col-span-2">
							<Switch
								id={id}
								defaultChecked={layersVisibility[id]}
								onCheckedChange={(checked) =>
									setLayersVisibility((prev) => ({
										...prev,
										[id]: checked,
									}))
								}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
