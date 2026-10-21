// Labels for audit-log entries. This is the union of the program-domain labels
// (Studio) and the sessions-domain labels (fbr-home); the model names don't overlap.
import { AuditLogChanges, FilterOption } from './types';

const CREATED = 'created';
const UPDATED = 'updated';
const DELETED = 'deleted';

const ACTION_VARIANT: Record<string, string> = {
  [CREATED]: 'success',
  [UPDATED]: 'primary',
  [DELETED]: 'danger',
};
const DEFAULT_VARIANT = 'light';

const ALL_ACTIONS: FilterOption = { value: '', label: 'All actions' };

/** Filter labels for the created / updated / deleted actions (API values 0 / 1 / 2). */
type ActionFilterLabels = [string, string, string];

const GENERIC_FILTER_LABELS: ActionFilterLabels = ['Created', 'Updated', 'Deleted'];

// Domain-specific action labels per model — overrides generic created/updated/deleted.
const MODEL_ACTION_LABELS: Record<string, Record<string, string>> = {
  programcourse: { created: 'Added', deleted: 'Removed' },
  enrollment: { created: 'Enrolled', updated: 'Status Changed' },
  feedbackinitiation: { created: 'Initiated' },
  feedbackrequest: { created: 'Sent', updated: 'Submitted' },
  programcertificate: { created: 'Awarded', updated: 'Status Changed' },
  traineescore: { created: 'Score Entered', updated: 'Score Updated', deleted: 'Score Removed' },
  traineeresult: { created: 'Result Finalized' },
  instructorassignment: { created: 'Assigned', deleted: 'Removed' },
  session: { created: 'Scheduled', deleted: 'Deleted' },
  sessioninstructor: { created: 'Assigned', deleted: 'Removed' },
  leaverequest: { created: 'Submitted', updated: 'Status Changed' },
  remotesessionrequest: { created: 'Requested', updated: 'Status Changed' },
  substituterequest: { created: 'Assigned', deleted: 'Removed' },
  attendancerecord: { created: 'Marked', updated: 'Updated' },
};

// Filter dropdown options per model — shown when a single model is active.
const MODEL_FILTER_LABELS: Record<string, ActionFilterLabels> = {
  programcourse: ['Added', 'Updated', 'Removed'],
  enrollment: ['Enrolled', 'Status Changed', 'Removed'],
  programcertificate: ['Awarded', 'Status Changed', 'Removed'],
  feedbackinitiation: ['Initiated', 'Updated', 'Removed'],
  feedbackrequest: ['Sent', 'Submitted', 'Removed'],
  traineescore: ['Score Entered', 'Score Updated', 'Score Removed'],
  traineeresult: ['Result Finalized', 'Updated', 'Removed'],
  schemesubsection: ['Marks Updated', 'Marks Updated', 'Deleted'],
  instructorassignment: ['Assigned', 'Updated', 'Removed'],
  session: ['Scheduled', 'Updated', 'Deleted'],
  sessioninstructor: ['Assigned', 'Updated', 'Removed'],
  leaverequest: ['Submitted', 'Status Changed', 'Deleted'],
};

// Filter labels for known multi-model combinations — key is sorted model names joined by comma.
const MULTI_MODEL_FILTER_LABELS: Record<string, ActionFilterLabels> = {
  'programcertificate,programcertificateconfig': ['Awarded', 'Status Changed', 'Removed'],
  'feedbackinitiation,feedbackrequest': ['Initiated / Sent', 'Updated', 'Removed'],
  'programgradingscheme,schemesection,schemesubsection,traineescore,traineeresult': ['Created', 'Marks Updated', 'Deleted'],
  'session,sessioninstructor': ['Scheduled / Assigned', 'Updated', 'Deleted / Removed'],
  'leaverequest,remotesessionrequest,substituterequest': ['Submitted / Requested', 'Status Changed', 'Deleted / Removed'],
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  fbrprofile: 'User Profile',
  fbrprofilerole: 'User Role',
  instructorprofile: 'Instructor Profile',
  traineeprofile: 'Trainee Profile',
  biodataeditrequest: 'Edit Request',
  program: 'Program',
  enrollment: 'Enrollment',
  programcourse: 'Program Course',
  blockreviewstate: 'Block Review State',
  blockreviewcomment: 'Block Review Comment',
  feedbackform: 'Feedback Form',
  feedbackinitiation: 'Feedback Initiation',
  feedbackrequest: 'Feedback Request',
  programgradingscheme: 'Grading Scheme',
  schemesection: 'Scheme Section',
  schemesubsection: 'Scheme Sub-Section',
  traineescore: 'Trainee Score',
  traineeresult: 'Trainee Result',
  programcertificate: 'Certificate',
  programcertificateconfig: 'Certificate Config',
  session: 'Session',
  sessioninstructor: 'Session Instructor',
  attendancerecord: 'Attendance Record',
  leaverequest: 'Leave Request',
  remotesessionrequest: 'Remote Session Request',
  substituterequest: 'Substitute Request',
  location: 'Location',
  publicholiday: 'Public Holiday',
  instructorassignment: 'Instructor Assignment',
};

// ─── Change-aware labels ──────────────────────────────────────────────────────
// Inspect the changes diff for semantic labels beyond what the action type alone
// can express. A resolver returns undefined to fall back to the per-model label.

type ChangeLabelResolver = (action: string, changes?: AuditLogChanges | null) => string | undefined;

const newValueOf = (changes: AuditLogChanges | null | undefined, field: string): unknown => changes?.[field]?.[1];

/** Labels an update by the new value of one field, e.g. `status` → "cancelled". */
const labelUpdateByNewValue = (field: string, labels: Record<string, string>): ChangeLabelResolver => (
  (action, changes) => {
    const newValue = newValueOf(changes, field);
    if (action !== UPDATED || typeof newValue !== 'string') { return undefined; }
    return labels[newValue];
  }
);

const labelEnrollmentStatus = labelUpdateByNewValue('status', {
  withdrawn: 'Withdrawn', suspended: 'Suspended', completed: 'Completed',
});

const labelEnrollment: ChangeLabelResolver = (action, changes) => {
  if (action !== UPDATED) { return undefined; }
  const isActive = newValueOf(changes, 'is_active');
  if (isActive === false) { return 'Unenrolled'; }
  if (isActive === true) { return 'Re-enrolled'; }
  return labelEnrollmentStatus(action, changes);
};

const labelSchemeSubsection: ChangeLabelResolver = (action, changes) => {
  if (action === CREATED) { return 'Marks Updated'; }
  if (action === UPDATED) { return changes?.max_marks ? 'Marks Updated' : 'Updated'; }
  return undefined;
};

const labelSchemeSection: ChangeLabelResolver = (action) => (action === CREATED ? 'Updated' : undefined);

const CHANGE_AWARE_LABELS: Record<string, ChangeLabelResolver> = {
  enrollment: labelEnrollment,
  programcertificate: labelUpdateByNewValue('status', { revoked: 'Revoked', active: 'Reinstated' }),
  schemesubsection: labelSchemeSubsection,
  schemesection: labelSchemeSection,
  session: labelUpdateByNewValue('status', { cancelled: 'Cancelled' }),
  leaverequest: labelUpdateByNewValue('state', {
    cancelled: 'Cancelled',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    withdrawal_pending: 'Withdrawal Requested',
  }),
};

// ─── Public helpers ───────────────────────────────────────────────────────────

export const getActionLabel = (action: string, recordType?: string, changes?: AuditLogChanges | null): string => {
  const modelKey = recordType ?? '';
  return CHANGE_AWARE_LABELS[modelKey]?.(action, changes)
    || MODEL_ACTION_LABELS[modelKey]?.[action]
    || action;
};

export const getActionVariant = (action: string): string => ACTION_VARIANT[action] || DEFAULT_VARIANT;

export const getRecordTypeLabel = (recordType?: string): string => (
  (recordType && RECORD_TYPE_LABELS[recordType]) || recordType || '—'
);

const findFilterLabels = (models: string[]): ActionFilterLabels => {
  if (models.length === 1 && MODEL_FILTER_LABELS[models[0]]) {
    return MODEL_FILTER_LABELS[models[0]];
  }
  return MULTI_MODEL_FILTER_LABELS[[...models].sort().join(',')] || GENERIC_FILTER_LABELS;
};

export const getFilterOptions = (models: string[] = []): FilterOption[] => [
  ALL_ACTIONS,
  ...findFilterLabels(models).map((label, index) => ({ value: String(index), label })),
];
