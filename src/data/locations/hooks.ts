import { useQuery } from '@tanstack/react-query';
import { fbrKeys, STALE_TIME_MS } from '../queryDefaults';
import { getLocations, LocationListParams } from './api';

export const useLocations = (params: LocationListParams = {}, enabled = true) => useQuery({
  queryKey: fbrKeys.locationList(params),
  queryFn: () => getLocations(params),
  staleTime: STALE_TIME_MS,
  enabled,
});
