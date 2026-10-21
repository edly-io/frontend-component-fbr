import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAuditLogsApiUrl } from '../urls';
import { ApiRecord, PaginatedList } from '../types';

export interface AuditLogParams {
  appLabel: string;
  models?: string[];
  objectId?: string | number | null;
  action?: string | number | null;
  search?: string;
  programKey?: string;
  courseKey?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

const isPresent = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

const buildAuditLogQuery = ({
  appLabel, models = [], objectId, action, search, programKey, courseKey, dateFrom, dateTo, page = 1, pageSize = 20,
}: AuditLogParams): URLSearchParams => {
  const params = new URLSearchParams({ app_label: appLabel, page: String(page), page_size: String(pageSize) });
  models.forEach((m) => params.append('model', m));
  if (objectId !== undefined && objectId !== null) { params.set('object_id', String(objectId)); }
  if (isPresent(action)) { params.set('action', String(action)); }
  if (search) { params.set('search', search); }
  if (programKey) { params.set('program_key', programKey); }
  if (courseKey) { params.set('course_key', courseKey); }
  if (dateFrom) { params.set('date_from', dateFrom); }
  if (dateTo) { params.set('date_to', dateTo); }
  return params;
};

export const getAuditLogs = async (auditLogParams: AuditLogParams): Promise<PaginatedList<ApiRecord>> => {
  const { data } = await getAuthenticatedHttpClient().get(
    getAuditLogsApiUrl(`logs/?${buildAuditLogQuery(auditLogParams)}`),
  );
  return { results: data.results || [], count: data.count || 0 };
};
