import { Layer, Source } from "react-map-gl/maplibre";
import { FeatureCollection } from "geojson";
import { filterFeaturesByType } from "../helper";
import { twColors } from "@/constants";
import { useIsLayerHidden } from "@/atoms";
import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

const circleLayerStyle: Omit<CircleLayerSpecification, "id" | "source"> = {
  type: "circle",
  paint: {
    "circle-color": twColors.clusterCircle,
    "circle-stroke-color": twColors.clusterStroke,
    "circle-stroke-width": 1,
    "circle-opacity": 0.7,
    "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 20, 40],
  },
};

const symbolLayerStyle: Omit<SymbolLayerSpecification, "id" | "source"> = {
  type: "symbol",
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Noto Sans", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
};

type ClusterLayerProps = {
  data: FeatureCollection;
  type: string;
  cityId: number;
};

export default function ClusterLayer({
  data,
  type,
  cityId,
}: ClusterLayerProps) {
  const isHidden = useIsLayerHidden(type);
  if (isHidden) {
    return null;
  }

  const pointFeatures: FeatureCollection = filterFeaturesByType(data, "Point");

  return (
    <Source
      id={`cluster-source`}
      type="geojson"
      data={pointFeatures}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      <Layer
        id={`${cityId}_cluster-circle-layer`}
        filter={["has", "point_count"]}
        {...circleLayerStyle}
      />
      <Layer
        id={`${cityId}_cluster-count-layer`}
        filter={["has", "point_count"]}
        {...symbolLayerStyle}
      />
    </Source>
  );
}
