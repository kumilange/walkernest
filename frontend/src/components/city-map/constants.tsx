export const INITIAL_VIEW_STATE = {
	latitude: 39.7154185,
	longitude: -105.1390876,
	zoom: 13,
};

export const MAP_STYLE = {
	maptiler: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
	positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};
