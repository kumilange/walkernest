import { ReactNode } from 'react';
import { LngLat } from 'maplibre-gl';
import { Feature, GeoJsonProperties, Geometry, Point, LineString, MultiLineString } from 'geojson';

export type CityArrayItem = {
	id: number;
	value: string;
	label: string;
	geometry: Geometry;
};

export type CityMapItem = {
	[key: string]: {
		id: number;
		geometry: Geometry;
	};
};

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

export type MaxDistance = {
	park: number;
	supermarket: number;
	cafe: number;
};

export type IsAmenityOn = {
	park: boolean;
	supermarket: boolean;
	cafe: boolean;
};

export type RoutePoint = {
	lngLat: LngLat;
	name: string;
}

export type Route = { geometry: Feature<LineString | MultiLineString> & { coordinates: number[][] | number[][][] }, distance: number, duration: number }
