/**
 * Which previously-uploaded documents may be carried into a new application.
 *
 * Every document slot on `*_enrolment_documents` has a sibling `<slot>Status` column. Only a file
 * the school holds as `Valid` or `Uploaded` is carried forward — a `Rejected`, `Expired` or
 * `For submission` file is left behind so the parent uploads a fresh one, instead of the old one
 * reappearing as already done.
 *
 * A file stored on a Supabase project that has since been deleted is a dead link whatever its
 * status says, so it is left behind too.
 */

export const CARRY_OVER_STATUSES = ["Valid", "Uploaded"] as const;

/** Hosts of the deleted Supabase projects older files were uploaded to — their links no longer open. */
export const DEAD_FILE_HOSTS = ["hgochparbrqtgeigvnzx.supabase.co", "wgrezfnxruefdbkgqqlt.supabase.co"] as const;

function isDeadLink(file: string): boolean {
  return DEAD_FILE_HOSTS.some((host) => file.includes(host));
}

/** True when `row[column]` holds a live file AND `row[`${column}Status`]` is one we carry forward. */
export function isCarriedFile(row: Record<string, unknown> | null | undefined, column: string): boolean {
  const file = row?.[column];
  if (file == null || file === "" || isDeadLink(String(file))) return false;
  return (CARRY_OVER_STATUSES as readonly unknown[]).includes(row?.[`${column}Status`]);
}

/** `row[column]` when it is carried forward (see `isCarriedFile`), otherwise `undefined`. */
export function carriedFile(row: Record<string, unknown> | null | undefined, column: string) {
  return isCarriedFile(row, column) ? row?.[column] : undefined;
}
