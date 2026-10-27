import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAttendanceApiUrl } from '../urls';
import { ApiRecord, PaginatedList } from '../types';

export interface HolidayListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  /** YYYY-MM-DD; with dateTo, only holidays overlapping the range (both inclusive). */
  dateFrom?: string;
  dateTo?: string;
}

export const getHolidays = async (
  {
    search = '', page = 1, pageSize = 20, dateFrom, dateTo,
  }: HolidayListParams = {},
): Promise<PaginatedList<ApiRecord>> => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) { params.set('search', search); }
  if (dateFrom) { params.set('date_from', dateFrom); }
  if (dateTo) { params.set('date_to', dateTo); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`public-holidays/?${params}`));
  return { count: data.count ?? 0, results: data.results ?? [] };
};
