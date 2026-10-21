export interface SelectOption {
  value: string | number;
  label: string;
  [extra: string]: unknown;
}

interface BaseProps {
  /** Wired to the input `id` and the label `htmlFor`. */
  id: string;
  label: string;
  /** Filtered in memory by label. */
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Shows a spinner in the dropdown while options are fetching. */
  loading?: boolean;
  /** Appends " *" to the label. */
  required?: boolean;
  isInvalid?: boolean;
}

export interface SingleSelectProps extends BaseProps {
  multiple?: false;
  value?: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
}

export interface MultiSelectProps extends BaseProps {
  multiple: true;
  value?: SelectOption[] | null;
  onChange: (options: SelectOption[]) => void;
}

export type SearchableSelectProps = SingleSelectProps | MultiSelectProps;
