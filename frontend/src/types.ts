import { ReactNode } from 'react';
import { LngLat } from 'maplibre-gl';
import { Feature, GeoJsonProperties, Geometry, Point, LineString, MultiLineString } from 'geojson';

// City-related types
export type CityArrayItem = {
	id: number;
	value: string;
	label: string;
	geometry: Geometry;
};

export type CityDictItem = {
	[key: string]: {
		id: number;
		geometry: Geometry;
	};
};

// Favorite-related types
export type FavoriteItem = {
	id: number;
	name: string;
	city: string;
	feature: Feature<Point, GeoJsonProperties>;
};

// Layer-related types
type PreferenceKeys = 'result' | 'cluster' | 'park' | 'supermarket' | 'cafe' | 'boundary';

export type LayersVisibility = {
	[key in PreferenceKeys]: boolean;
};

export type LayerItem = {
	id: PreferenceKeys;
	label: string;
	icon: ReactNode;
};

// Amenity-related types
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


// Route-related types
export type RoutePoint = {
	lngLat: LngLat;
	name: string;
};

export type Route = {
	geometry: Feature<LineString | MultiLineString> & { coordinates: number[][] | number[][][] },
	distance: number,
	duration: number
}
