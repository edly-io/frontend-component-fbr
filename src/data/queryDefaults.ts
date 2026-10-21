// Every query sets staleTime explicitly: host apps configure their own
// QueryClient defaults (Studio uses 1 hour), which is far too long for
// sessions, requests and attendance.
export const STALE_TIME_MS = 30_000;
export const CONFIG_STALE_TIME_MS = 5 * 60_000;

// All library query keys start with this root, so a host app can invalidate
// or inspect library data without colliding with its own keys.
export const fbrKeys = {
  all: ['fbr'] as const,
};
