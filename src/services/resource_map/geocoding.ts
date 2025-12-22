import { type EnvConfig } from '../../config';
import { type ResourceMapAddress, type ResourceMapLatLng } from './location-types';

type MapboxFeature = {
  center?: [number, number];
};

type MapboxResponse = {
  features?: MapboxFeature[];
};

const buildAddressQuery = (address?: ResourceMapAddress) => {
  if (!address) return '';
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(', ');
};

export const geocodeAddressWithMapbox = async (
  address: ResourceMapAddress | undefined,
  envConfig: EnvConfig,
): Promise<ResourceMapLatLng | null> => {
  const token = envConfig.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const query = buildAddressQuery(address);
  if (!query) return null;

  const endpoint =
    envConfig.MAPBOX_GEOCODING_ENDPOINT ||
    'https://api.mapbox.com/geocoding/v5/mapbox.places';

  const params = new URLSearchParams({
    access_token: token,
    limit: '1',
    types: 'address,place,locality,neighborhood',
  });

  const url = `${endpoint}/${encodeURIComponent(query)}.json?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as MapboxResponse;
  const center = data.features?.[0]?.center;
  if (!center || center.length < 2) {
    return null;
  }

  return {
    lng: center[0],
    lat: center[1],
  };
};
