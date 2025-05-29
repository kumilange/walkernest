export interface FeaturePopupProps {
  lngLat: {
    lat: number;
    lng: number;
  };
  properties: Record<string, string | number | boolean | null> & { id: number };
  handlePopupClose: () => void;
}
