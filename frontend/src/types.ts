import { ReactNode } from 'react';
import { LngLat } from 'maplibre-gl';
import { Feature, GeoJsonProperties, Point, LineString, MultiLineString } from 'geojson';



export type FavoriteItem = {
	id: number;
	name: string;
	city: string;
	feature: Feature<Point, GeoJsonProperties>;
};

type PreferenceKeys =
	| 'result'
	| 'cluster'
	| 'park'
	| 'supermarket'
	| 'boundary';

export type LayersVisibility = {
	[key in PreferenceKeys]: boolean;
};

export type LayerItem = {
	id: PreferenceKeys;
	label: string;
	icon: ReactNode;
};

export type WalkingDistance = {
	park: number;
	supermarket: number;
};

export type RoutePoint = {
	lngLat: LngLat;
	name: string;
}

export type Route = { geometry: Feature<LineString | MultiLineString> & { coordinates: number[][] | number[][][] }, distance: number, duration: number }