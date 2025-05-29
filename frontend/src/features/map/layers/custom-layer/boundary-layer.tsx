import { CITY_LIST_DICT } from "@/constants";
import { twColors } from "@/constants";
import { Layer, type LayerProps, Source } from "react-map-gl/maplibre";
import { useIsLayerHidden } from "../../stores/layerAtoms";
import { generateFeatureCollection } from "../helper"; // Corrected path

const layerLineStyle: LayerProps = {
  id: "boundary-line-layer",
  type: "line",
  source: "boundary-source",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": twColors.boundaryLine,
    "line-width": 3,
  },
};

const layerFillStyle: LayerProps = {
  id: "boundary-fill-layer",
  type: "fill",
  source: "boundary-source",
  paint: {
    "fill-color": twColors.boundaryFill,
    "fill-opacity": 0.3,
  },
};

export default function BoundaryLayer({ city }: { city: string }) {
  const isHidden = useIsLayerHidden("boundary");
  if (isHidden) {
    return null;
  }

  const cityData = CITY_LIST_DICT[city];
  if (!cityData || !cityData.geometry) {
    console.warn(`BoundaryLayer: Missing city or geometry for city '${city}'.`);
    return null;
  }

  const geometry = cityData.geometry;
  const featureCollection = generateFeatureCollection(geometry);

  return (
    <Source id={"boundary-source"} type="geojson" data={featureCollection}>
      <Layer id={"boundary-line-layer"} {...layerLineStyle} beforeId="housenumber" />
      <Layer id={"boundary-fill-layer"} {...layerFillStyle} beforeId="housenumber" />
    </Source>
  );
}
