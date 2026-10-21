import { useQuery } from '@tanstack/react-query';
import { CONFIG_STALE_TIME_MS, fbrKeys } from '../queryDefaults';
import { getSessionsConfig } from './api';

// Fetched once and shared: every caller of useConfig() reuses the same
// in-flight request and cached result.
export const useConfig = () => useQuery({
  queryKey: fbrKeys.config,
  queryFn: getSessionsConfig,
  staleTime: CONFIG_STALE_TIME_MS,
});
