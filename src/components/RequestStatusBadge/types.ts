export interface StatusRequest {
  state: string;
  /** Set by the requests list API. */
  type_slug?: string;
  /** Set by the calendar API's `my_request`. */
  type?: string;
}

export interface RequestStatusBadgeProps {
  request?: StatusRequest | null;
}
