export const RESOURCE_MAP_LOCATION_KIND = {
  ADDRESS: 'ADDRESS',
  LAT_LNG: 'LAT_LNG',
  PLUS_CODE: 'PLUS_CODE',
  GEOFENCE: 'GEOFENCE',
} as const;

export const RESOURCE_MAP_GEOFENCE_TYPE = {
  CIRCLE: 'CIRCLE',
  POLYGON: 'POLYGON',
} as const;

export type ResourceMapLocationKind =
  (typeof RESOURCE_MAP_LOCATION_KIND)[keyof typeof RESOURCE_MAP_LOCATION_KIND];

export type ResourceMapGeofenceType =
  (typeof RESOURCE_MAP_GEOFENCE_TYPE)[keyof typeof RESOURCE_MAP_GEOFENCE_TYPE];

export type ResourceMapLatLng = {
  lat: number;
  lng: number;
  accuracy_meters?: number;
};

export type ResourceMapAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  place_id?: string;
};

export type ResourceMapPlusCode = {
  code: string;
  local_area?: string;
};

export type ResourceMapGeofence = {
  type: ResourceMapGeofenceType;
  center?: ResourceMapLatLng;
  radius_meters?: number;
  polygon?: ResourceMapLatLng[];
};

export type ResourceMapLocation = {
  kind: ResourceMapLocationKind;
  address?: ResourceMapAddress;
  lat_lng?: ResourceMapLatLng;
  plus_code?: ResourceMapPlusCode;
  geofence?: ResourceMapGeofence;
};

export type ResourceMapLocationGeometry =
  | {
      type: 'Point';
      coordinates: [number, number];
    }
  | {
      type: 'Polygon';
      coordinates: [[number, number][]];
    };
