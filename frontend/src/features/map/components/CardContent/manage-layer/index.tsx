import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LayerItem } from "@/types";
import { BoxSelect, ChartNetwork, Coffee, House, ShoppingCart, Trees } from "lucide-react";
import { useAtomLayersVisibility } from "../../../stores/layerAtoms";

const layerList: LayerItem[] = [
  { id: "result", label: "Matched Apartment", icon: <House /> },
  { id: "cluster", label: "Cluster", icon: <ChartNetwork /> },
  { id: "park", label: "Park & Dog Park", icon: <Trees /> },
  { id: "supermarket", label: "Supermarket", icon: <ShoppingCart /> },
  { id: "cafe", label: "Cafe", icon: <Coffee /> },
  { id: "boundary", label: "City Boundary", icon: <BoxSelect /> },
];

export default function ManageLayer() {
  const { layersVisibility, setLayersVisibility } = useAtomLayersVisibility();

  return (
    <div className="grid w-full items-center">
      <div className="flex flex-col gap-3 space-y-2">
        {layerList.map(({ id, label, icon }) => (
          <div key={id} className="grid grid-cols-10 gap-2">
            <div className="col-span-8 flex items-center">
              {icon}
              <Label htmlFor={id} className="ml-2">
                {label}
              </Label>
            </div>
            <div className="col-span-2 flex items-center">
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
