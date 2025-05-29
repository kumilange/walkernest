import locateFixedIconPath from "@/assets/locate-fixed-icon.png";
import locateIconPath from "@/assets/locate-icon.png";
import type { FeatureCollection } from "geojson";
import useCheckRoutes from "../../hooks/useCheckRoutes";
import { IconLayer } from "../custom-base-layer";
import { generateFeatureCollection } from "../helper";

export type RoutePointData = {
  id: string;
  icon: string;
  geojson: FeatureCollection;
};

export default function RoutePointsLayer({
  lastLayerId,
}: {
  lastLayerId: string;
}) {
  const { startingPoint, endingPoint } = useCheckRoutes();
  const data: RoutePointData[] = [];

  if (startingPoint?.lngLat) {
    data.push({
      id: "starting-point",
      icon: locateIconPath,
      geojson: generateFeatureCollection({
        type: "Point",
        coordinates: [startingPoint.lngLat.lng, startingPoint.lngLat.lat],
      }),
    });
  }
  if (endingPoint?.lngLat) {
    data.push({
      id: "ending-point",
      icon: locateFixedIconPath,
      geojson: generateFeatureCollection({
        type: "Point",
        coordinates: [endingPoint.lngLat.lng, endingPoint.lngLat.lat],
      }),
    });
  }

  return (
    <>
      {data.map(({ id, icon, geojson }, index) => {
        const beforeId = index === 0 ? lastLayerId : `${data[index - 1].id}-icon-layer`;

        return (
          <IconLayer
            key={id}
            data={geojson}
            imageType={id}
            imagePath={icon}
            imageOffset={[0, 0]}
            beforeId={beforeId}
          />
        );
      })}
    </>
  );
}
