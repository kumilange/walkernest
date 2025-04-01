export type FeaturePopupProps = {
  lngLat: {
    lat: number;
    lng: number;
  };
  properties: Record<string, any>;
  handlePopupClose: () => void;
};
