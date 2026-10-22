/**
 * A backend record whose full shape belongs to the API, not the library.
 * Known fields are declared on the domain types; everything else stays readable.
 */
export interface ApiRecord {
  [field: string]: unknown;
}

export interface PaginatedList<T> {
  count: number;
  results: T[];
}
