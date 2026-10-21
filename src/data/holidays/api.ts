import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAttendanceApiUrl } from '../urls';
import { ApiRecord, PaginatedList } from '../types';

export interface HolidayListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const getHolidays = async (
  { search = '', page = 1, pageSize = 20 }: HolidayListParams = {},
): Promise<PaginatedList<ApiRecord>> => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) { params.set('search', search); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`public-holidays/?${params}`));
  return { count: data.count ?? 0, results: data.results ?? [] };
};
