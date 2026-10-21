import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAttendanceApiUrl } from '../urls';
import { ApiRecord, PaginatedList } from '../types';

export interface LocationListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  programKey?: string;
}

// Physical venues (e.g. "IRSA 1"). Reads are open to any authenticated user —
// the schedule modal needs them for its picker. `programKey` narrows the list
// to that program's city.
export const getLocations = async ({
  search = '', page = 1, pageSize = 20, programKey = '',
}: LocationListParams = {}): Promise<PaginatedList<ApiRecord>> => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) { params.set('search', search); }
  if (programKey) { params.set('program_key', programKey); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`locations/?${params}`));
  return { count: data.count ?? 0, results: data.results ?? [] };
};
