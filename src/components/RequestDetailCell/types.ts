export interface RequestSession {
  id: number | string;
  title?: string;
  scheduled_start_time?: string;
}

/** A leave or remote-session request, as the requests API returns it. */
export interface LeaveOrRemoteRequest {
  request_type_label?: string;
  leave_type?: string;
  leave_start_date?: string;
  leave_end_date?: string;
  category?: string;
  sessions?: RequestSession[];
  submitter_name?: string;
  submitter_email?: string;
  created?: string;
}

export interface RequestDetailCellProps {
  req: LeaveOrRemoteRequest;
  programKey?: string;
}

export type RequestSummaryProps = RequestDetailCellProps;
