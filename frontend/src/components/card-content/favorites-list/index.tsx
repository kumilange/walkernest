import { LngLat } from 'maplibre-gl';
import { Trash2 } from 'lucide-react';
import { capitalize, cn } from '@/lib/misc';
import { useAtomFavItems } from '@/atoms';
import type { FavoriteItem } from '@/types';
import useEventHandlers from './use-event-handlers';

export default function FavoritesList() {
	const { favItems } = useAtomFavItems();
	const { selectedId, handleSelect, handleDelete } = useEventHandlers();

	return (
		<>
			{favItems.length === 0 ? (
				<p>No favorites are added yet.</p>
			) : (
				<ul className="grid w-full items-center">
					{favItems.map((fav: FavoriteItem, index: number) => {
						const { id, name, city, feature } = fav;
						const [longitude, latitude] = feature.geometry.coordinates;

						return (
							<li
								key={index}
								className={cn(
									'p-2 border-t border-gray-200 transition-all duration-300 ease-in-out hover:bg-primary-lightGray',
									{ 'bg-primary-lightGray': selectedId === id },
								)}
							>
								<button
									className="grid grid-cols-[6fr_4fr_1fr] items-center w-full"
									onClick={(e) =>
										handleSelect({
											e,
											id,
											lngLat: new LngLat(longitude, latitude),
										})
									}
								>
									<span className="pl-1 pr-1 text-left text-sm flex-grow leading-tight">
										{name}
									</span>
									<span className="pl-1 pr-1 border-l text-sm leading-none break-all">
										{capitalize(city)}
									</span>
									<span className="border-l pl-1">
										<Trash2
											className="transition-all duration-200 ease-in-out hover:text-red-500 cursor-pointer"
											onClick={(e) => handleDelete({ e, id })}
										/>
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</>
	);
}
