import { QueryClient, useQuery } from '@tanstack/react-query';
import { FeatureCollection } from 'geojson';
import { LngLat } from 'react-map-gl/maplibre';
import { convertKeysToSnakeCase, transformQueryParams } from '@/lib/misc';

const BASE_STATIC_URL = `http://${import.meta.env.VITE_APP_HOST}:3000/geojsons`;
const BASE_DYNAMIC_URL = `http://${import.meta.env.VITE_APP_HOST}:3000/analyze`;
const BASE_FAVORITES_URL = `http://${import.meta.env.VITE_APP_HOST}:3000/favorites`;
const BASE_OSM_NOMINATIM_URL = `https://nominatim.openstreetmap.org/reverse`;
const BASE_OSRM_ROUTE_URL = `http://router.project-osrm.org/route/v1`;

export const queryClient = new QueryClient({});

type CityData = {
	geojsons: FeatureCollection[];
	types: string[];
};


async function fetchStaticData(cityId: number): Promise<CityData> {
	const queryParams = [
		`?city_id=${cityId}&name=park`,
		`?city_id=${cityId}&name=supermarket`,
		`?city_id=${cityId}&name=supermarket&is_centroid=true`,
		`?city_id=${cityId}&name=cafe`,
		`?city_id=${cityId}&name=cafe&is_centroid=true`,
	];
	const urls = queryParams.map((type) => `${BASE_STATIC_URL}${type}`);

	try {
		const responses = await Promise.all(urls.map((url) => fetch(url)));

		const geojsons = await Promise.all(
			responses.map((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			}),
		);

		return { geojsons, types: transformQueryParams(queryParams) };
	} catch (error) {
		console.error('Error fetching static city data', error);
		throw error;
	}
}
export function useStaticCityData(cityId: number) {
	return useQuery({
		queryKey: [`static-city-data`, cityId],
		queryFn: () => fetchStaticData(cityId),
	});
}

type FetchDynamicDataParams = {
	cityId: number;
	[key: string]: number;
}
async function fetchDynamicData(params: FetchDynamicDataParams) {
	const { cityId, ...kwargs } = params;
	const kwargsInSnake = convertKeysToSnakeCase(kwargs);
	const url = `${BASE_DYNAMIC_URL}?city_id=${cityId}&kwargs=${encodeURIComponent(JSON.stringify(kwargsInSnake))}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const { polygon, centroid } = data;
		return { polygon, centroid };
	} catch (error) {
		console.error('Error fetching dynamic city data', error);
		throw error;
	}
}
export function useDynamicCityData(params: FetchDynamicDataParams) {
	const { cityId, ...kwargs } = params;
	if (cityId === null) { return { data: null, error: null, isFetching: false }; }

	return useQuery({
		queryKey: [`dynamic-city-data`, cityId, ...Object.values(kwargs)],
		queryFn: () =>
			fetchDynamicData(params),
		staleTime: Infinity,
	});
}

export async function fetchFavoritesData(favIds: number[]) {
	const queryString = favIds.map((id) => `ids=${id}`).join('&');
	const url = `${BASE_FAVORITES_URL}?${queryString}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching favorites data', error);
		throw error;
	}
}

export async function fetchAddressName(lngLat: LngLat) {
	const url = `${BASE_OSM_NOMINATIM_URL}?lat=${lngLat.lat}&lon=${lngLat.lng}&format=json`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		return data?.display_name;
	} catch (error) {
		console.error('Error fetching address name', error);
		throw error;
	}
}

export async function fetchRoute(coordinates: string) {
	const url = `${BASE_OSRM_ROUTE_URL}/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		return data.routes[0];
	} catch (error) {
		console.error('Error fetching route', error);
		throw error;
	}
}
