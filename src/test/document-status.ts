/** Stamps `<column>Status: "Valid"` on every file column of a documents-row fixture that holds a
 * value and has no status of its own — the carry-over only reads files with an accepted status
 * (src/actions/carry-over-status.ts), so a fixture without statuses would carry nothing. */
export function withValidStatuses<T extends Record<string, unknown>>(row: T): T {
  const stamped: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (key === "enroleeNumber" || key.endsWith("Status") || !value || `${key}Status` in row) continue;
    stamped[`${key}Status`] = "Valid";
  }
  return stamped as T;
}
