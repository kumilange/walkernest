import { useCheckRoutes } from "../hooks";
import { useAtomLastLayerId } from "../stores/layerAtoms";
import {
  AmenitiesLayers,
  AnalysisLayers,
  BoundaryLayer,
  FavoritesLayer,
  RouteLayer,
  RoutePointsLayer,
} from "./custom-layer"; // Assuming index.ts exists in custom-layer or direct exports

export default function LayerManager({
  city,
  cityId,
}: {
  city: string | null;
  cityId: number | null;
}) {
  const { lastLayerId } = useAtomLastLayerId();
  const { route, routeId, isBothSelected } = useCheckRoutes();

  return (
    <>
      {city && <BoundaryLayer city={city} />}
      {cityId && (
        <>
          <AmenitiesLayers cityId={cityId} />
          <AnalysisLayers cityId={cityId} />
        </>
      )}
      {isBothSelected && <RouteLayer key={routeId} route={route} />}
      <FavoritesLayer lastLayerId={lastLayerId} />
      <RoutePointsLayer lastLayerId={lastLayerId} />
    </>
  );
}
