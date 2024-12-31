export type FeaturePopupProps = {
	lngLat: {
		lat: number;
		lng: number;
	};
	properties: {
		[key: string]: any; // TODO: fix type
	};
	handlePopupClose: () => void;
};
