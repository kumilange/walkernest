import { QueryClient, useQuery } from "@tanstack/react-query";
import { FeatureCollection } from "geojson";
import { LngLat } from "react-map-gl/maplibre";
import { convertKeysToSnakeCase, transformQueryParams } from "@/lib/misc";

const BASE_AMENITY_URL = `${import.meta.env.VITE_API_PROTOCOL}://${import.meta.env.VITE_API_DOMAIN}/amenities`;
const BASE_ANALYSIS_URL = `${import.meta.env.VITE_API_PROTOCOL}://${import.meta.env.VITE_API_DOMAIN}/analyze`;
const BASE_FAVORITES_URL = `${import.meta.env.VITE_API_PROTOCOL}://${import.meta.env.VITE_API_DOMAIN}/favorites`;
const BASE_OSRM_ROUTE_URL = `${import.meta.env.VITE_API_PROTOCOL}://${import.meta.env.VITE_API_DOMAIN}/proxy/osrm`;
const BASE_OSM_NOMINATIM_URL = `https://nominatim.openstreetmap.org/reverse`;

export const queryClient = new QueryClient({});

type CityData = {
  geojsons: FeatureCollection[];
  types: string[];
};

async function fetchAmenities(cityId: number): Promise<CityData> {
  const queryParams = [
    `?city_id=${cityId}&name=park`,
    `?city_id=${cityId}&name=supermarket&is_centroid=true`,
    `?city_id=${cityId}&name=cafe&is_centroid=true`,
  ];
  const urls = queryParams.map((type) => `${BASE_AMENITY_URL}${type}`);

  try {
    const responses = await Promise.all(urls.map((url) => fetch(url)));

    const geojsons = await Promise.all(
      responses.map((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      }),
    );

    return { geojsons, types: transformQueryParams(queryParams) };
  } catch (error) {
    console.error("Error fetching amenities", error);
    throw error;
  }
}
export function useAmenities(cityId: number) {
  return useQuery({
    queryKey: [`amenities`, cityId],
    queryFn: () => fetchAmenities(cityId),
  });
}

type FetchAnalysisParams = {
  cityId: number;
  [key: string]: number;
};
async function fetchAnalysis(params: FetchAnalysisParams) {
  const { cityId, ...kwargs } = params;
  const kwargsInSnake = convertKeysToSnakeCase(kwargs);
  const url = `${BASE_ANALYSIS_URL}?city_id=${cityId}&kwargs=${encodeURIComponent(JSON.stringify(kwargsInSnake))}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const { polygon, centroid } = data;
    return { polygon, centroid };
  } catch (error) {
    console.error("Error fetching analysis", error);
    throw error;
  }
}
export function useAnalysis(params: FetchAnalysisParams) {
  const { cityId, ...kwargs } = params;

  return useQuery({
    queryKey: [`analysis`, cityId, ...Object.values(kwargs)],
    queryFn: () => fetchAnalysis(params),
    staleTime: Infinity,
  });
}

export async function fetchFavorites(favIds: number[]) {
  const queryString = favIds.map((id) => `ids=${id}`).join("&");
  const url = `${BASE_FAVORITES_URL}?${queryString}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching favorites", error);
    throw error;
  }
}

export async function fetchAddressName(lngLat: LngLat) {
  const url = `${BASE_OSM_NOMINATIM_URL}?lat=${lngLat.lat}&lon=${lngLat.lng}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data?.display_name;
  } catch (error) {
    console.error("Error fetching address name", error);
    throw error;
  }
}

export async function fetchRoute(coordinates: string) {
  const url = `${BASE_OSRM_ROUTE_URL}?coordinates=${coordinates}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error("No routes found in the response");
    }
    return data.routes[0];
  } catch (error) {
    console.error("Error fetching route", error);
    throw error;
  }
}
