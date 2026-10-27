import { useQuery } from '@tanstack/react-query';
import { fbrKeys, FBR_QUERY_OPTIONS } from '../queryDefaults';
import { getHolidays, HolidayListParams } from './api';

export const useHolidays = (params: HolidayListParams = {}, enabled = true) => useQuery({
  queryKey: fbrKeys.holidayList(params),
  queryFn: () => getHolidays(params),
  ...FBR_QUERY_OPTIONS,
  enabled,
});
