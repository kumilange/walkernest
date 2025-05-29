import { useEffect } from "react";
import { Layer, LayerProps, Source } from "react-map-gl/maplibre";
import { GeoJSONSource } from "maplibre-gl";
import { fetchRoute } from "@/features/map/api";
import { useCheckRoutes, useCityMap } from "@/features/map/hooks";
import { RoutePoint } from "@/types";
import { toast } from "@/hooks";
import { twColors } from "@/constants";

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

const ANIMATION_DURATION = 1000;

function isRoutePoint(point: unknown): point is RoutePoint {
	return (
		point !== null &&
		typeof point === "object" &&
		"lngLat" in point &&
		(point as any).lngLat !== undefined
	);
}

export default function RouteLayer() {
	const {
		animatedRoute,
		startingPoint,
		endingPoint,
		isBothSelected,
		setRoute,
		setAnimatedRoute,
		animateRoute,
		handleFitBoundsForRoute,
	} = useCheckRoutes();

	useEffect(() => {
		if (!isBothSelected) return;

		const handleRoute = async () => {
			try {
				if (!isRoutePoint(startingPoint) || !isRoutePoint(endingPoint)) {
					throw new Error("Invalid route points");
				}

				const startingLngLat = startingPoint.lngLat;
				const endingLngLat = endingPoint.lngLat;
				const coords = `${startingLngLat.lng},${startingLngLat.lat};${endingLngLat.lng},${endingLngLat.lat}`;
				// Fetch the route from the OSRM API
				const data = await fetchRoute(coords);
				setRoute(data);
				handleFitBoundsForRoute(data);
				// Start animation
				animateRoute(data.geometry, ANIMATION_DURATION);
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Get routes failed.",
					description: "There was a problem with your request.",
					duration: 10000,
				});
			}
		};

		setAnimatedRoute(null);
		handleRoute();
	}, [startingPoint, endingPoint, isBothSelected]);

	return (
		<>
			{isBothSelected && animatedRoute && (
				<Source id={"route-source"} type="geojson" data={animatedRoute}>
					<Layer id={"route-layer"} {...layerStyle} />
				</Source>
			)}
		</>
	);
} 