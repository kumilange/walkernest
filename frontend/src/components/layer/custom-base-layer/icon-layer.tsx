import { Layer, Source } from "react-map-gl/maplibre";
import { FeatureCollection } from "geojson";
import { filterFeaturesByIds, filterFeaturesByType } from "../helper";
import { useIsLayerHidden } from "@/atoms";
import useImageLoader from "../hooks/use-image-loader";

type IconLayerProps = {
  data: FeatureCollection;
  imageType: string;
  imagePath: string;
  cityId?: number;
  skipIds?: number[];
  imageSize?: number;
  imageOffset?: [number, number];
  beforeId?: string;
};

export default function IconLayer({
  data,
  imageType,
  imagePath,
  cityId,
  skipIds = [],
  imageSize = 1,
  imageOffset = [0, -8],
  beforeId,
}: IconLayerProps) {
  useImageLoader(imagePath, imageType);

  const isHidden = useIsLayerHidden(imageType);
  if (isHidden) {
    return null;
  }

  const pointFeatures = filterFeaturesByType(data, "Point");
  const featureCollection = skipIds?.length
    ? filterFeaturesByIds(pointFeatures, skipIds)
    : pointFeatures;
  const layerId = cityId
    ? `${cityId}_${imageType}-icon-layer`
    : `${imageType}-icon-layer`;

  return (
    <Source
      id={`${imageType}-icon-source`}
      type="geojson"
      data={featureCollection}
    >
      <Layer
        id={layerId}
        type="symbol"
        layout={{
          "icon-image": imageType,
          "icon-size": imageSize,
          "icon-offset": ["literal", imageOffset],
        }}
        {...(beforeId ? { beforeId } : {})}
      />
    </Source>
  );
}
