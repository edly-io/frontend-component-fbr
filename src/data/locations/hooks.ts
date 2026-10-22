import { useQuery } from '@tanstack/react-query';
import { fbrKeys, FBR_QUERY_OPTIONS } from '../queryDefaults';
import { getLocations, LocationListParams } from './api';

export const useLocations = (params: LocationListParams = {}, enabled = true) => useQuery({
  queryKey: fbrKeys.locationList(params),
  queryFn: () => getLocations(params),
  ...FBR_QUERY_OPTIONS,
  enabled,
});
