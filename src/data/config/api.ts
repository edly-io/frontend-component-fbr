import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAttendanceApiUrl } from '../urls';
import { SessionsConfig } from './types';

export const getSessionsConfig = async (): Promise<SessionsConfig> => {
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl('config/'));
  return data;
};
