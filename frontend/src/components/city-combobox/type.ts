import { Geometry } from 'geojson';

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
