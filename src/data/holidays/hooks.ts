import { useQuery } from '@tanstack/react-query';
import { fbrKeys, STALE_TIME_MS } from '../queryDefaults';
import { getHolidays, HolidayListParams } from './api';

export const useHolidays = (params: HolidayListParams = {}) => useQuery({
  queryKey: fbrKeys.holidayList(params),
  queryFn: () => getHolidays(params),
  staleTime: STALE_TIME_MS,
});
