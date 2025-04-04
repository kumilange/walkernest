import { Layers, Search, Heart, Route } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import MenuItem from "@/components/menu-item";
import CityCombobox from "@/components/city-combobox";
import {
  AnalyzeApartment,
  ManageLayer,
  FavoritesList,
  CheckRoute,
} from "@/components/card-content";
import { useCheckRoutes } from "@/hooks";

export default function MenuBar() {
  const { clearAllRouteStates } = useCheckRoutes();

  return (
    <div className="w-full h-full flex items-center justify-center sm:gap-3 gap-2 ml-7">
      <CityCombobox />
      <MenuItem
        tooltip="Analyze apartment"
        actionIcon={<Search className="h-4 w-4" />}
        title="Analyze apartment"
        description="Set criteria for apartment analysis"
        content={<AnalyzeApartment />}
      />
      <Separator orientation="vertical" className="text-gray-300" />
      <MenuItem
        tooltip="Favorites"
        title="Favorites"
        actionIcon={<Heart className="h-4 w-4" />}
        content={<FavoritesList />}
      />
      <MenuItem
        tooltip="Check route"
        title="Check route"
        actionIcon={<Route className="h-4 w-4" />}
        hasOpenState={true}
        closeCallback={clearAllRouteStates}
        content={<CheckRoute />}
      />
      <MenuItem
        tooltip="Manage layers"
        title="Manage layers"
        actionIcon={<Layers className="h-4 w-4" />}
        content={<ManageLayer />}
      />
    </div>
  );
}
