import { ReactNode } from 'react';
import { Feature, GeoJsonProperties, Point } from 'geojson';

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
