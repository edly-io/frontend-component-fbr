import { ApiRecord } from '../types';
import { UserRole } from '../sessions/types';

/** Response of GET /fbr/api/attendance/v1/config/. */
export interface SessionsConfig extends ApiRecord {
  user_role: UserRole;
  session_types?: unknown;
  marking_window_days?: number;
  at_risk_threshold_percent?: number;
}
