import { Layers, Search, Heart, Route } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import MenuItem from '@/components/menu-item';
import CityCombobox from '@/components/city-combobox';
import {
	AnalyzeApartment,
	ManageLayer,
	FavoritesList,
	CheckRoute,
} from '@/components/card-content';

export default function MenuBar() {
	return (
		<div className="w-full h-full flex items-center justify-center sm:gap-3 gap-2 ml-7">
			<CityCombobox />
			<MenuItem
				tooltip="Analyze apartment"
				actionIcon={<Search className="h-4 w-4" />}
				title="Analyze apartment"
				description="Set criterias for apartment analysis"
				content={<AnalyzeApartment />}
			/>
			<Separator orientation="vertical" className="text-gray-300" />
			<MenuItem
				tooltip="Manage layers"
				title="Manage layers"
				actionIcon={<Layers className="h-4 w-4" />}
				content={<ManageLayer />}
			/>
			<MenuItem
				tooltip="Favorites"
				title="Favorites"
				actionIcon={<Heart className="h-4 w-4" />}
				content={<FavoritesList />}
			/>
			{/* TODO: Implement Check Route feature */}
			{/* <MenuItem
				tooltip="Check route"
				title="Check route"
				actionIcon={<Route className="h-4 w-4" />}
				hasOpenState={true}
				closeCallback={() => {
					console.log('delete route');
				}}
				content={<CheckRoute />}
			/> */}
		</div>
	);
}
