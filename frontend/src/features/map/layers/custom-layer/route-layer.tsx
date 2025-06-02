import { twColors } from "@/constants";
import { useCheckRoutes } from "@/features/map/hooks";
import { GeoJSONSource } from "maplibre-gl";
import { useEffect } from "react";
import { Layer, type LayerProps, Source } from "react-map-gl/maplibre";

const layerStyle: LayerProps = {
  id: "route",
  type: "line",
  source: "route-source",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": twColors.route,
    "line-width": 5,
    "line-dasharray": [0, 1],
  },
};

export default function RouteLayer() {
  const { route, isBothSelected } = useCheckRoutes();

  return (
    <>
      {isBothSelected && route && (
        <Source id={"route-source"} type="geojson" data={route.geometry}>
          <Layer id={"route-layer"} {...layerStyle} />
        </Source>
      )}
    </>
  );
}
