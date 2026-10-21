import { ApiRecord } from '../types';

export type UserRole = 'admin' | 'instructor' | 'learner';

export interface Session extends ApiRecord {
  id: number;
  title?: string;
  program_key?: string;
  scheduled_start_time?: string;
  status?: string;
  user_role?: UserRole;
}

export interface CalendarSessions {
  sessions: Session[];
  userRole: UserRole;
}

export interface ProgramDateEvent {
  id: string;
  courseKey: string;
  courseName: string;
  title: string;
  date: string;
  link: string;
  assignmentType: string | null;
  complete: boolean | null;
}

export interface SessionListParams {
  program_key?: string;
  start_date?: string;
  end_date?: string;
}

export interface SessionApprovedLeavesParams {
  program_key?: string;
  q?: string;
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}

export interface UpdateSessionVariables {
  sessionId: number;
  sessionData: ApiRecord;
}
