/**
 * Pure merge algorithm for `getPreviousParentGuardianDocuments`' cross-year scan (`private.ts`).
 *
 * A parent's uploaded documents live across two per-academic-year tables: the file URL is on
 * `*_enrolment_documents`, while the passport number / pass type / expiry metadata for that same
 * document is on `*_enrolment_applications` — the two rows are joined by `enroleeNumber`. A
 * document "slot" (e.g. "mother's passport") is therefore 3 fields that must all come from the
 * SAME application — mixing a file URL from one application with the number/expiry from another
 * would pair an uploaded file with metadata that was never actually entered for it.
 *
 * Carrying a returning parent's LATEST documents into a new enrollment means resolving each of
 * the 6 slots (mother/father/guardian × passport/pass) independently: pulling each one from
 * whichever prior application most recently actually had it uploaded, rather than taking every
 * field from a single "latest application" row (which can be incomplete — e.g. an application
 * that didn't need guardian info would otherwise hide guardian docs sitting on an older one).
 *
 * This module holds only the in-memory fold — no Supabase/I-O — so it can be tested exhaustively
 * without mocking a database. `private.ts` drives it one academic year at a time (newest first),
 * feeding in that year's already-fetched rows and stopping as soon as every slot is filled.
 */

export type ParentGuardianDocGroup = {
  /** Column name shared by both tables: `<documents-table>.<column>` is the file URL,
   * `<applications-table>.<column>` is the metadata (passport number, or pass type). */
  column: string;
  /** Output field name for the metadata value — `${role}PassportNumber` or `${role}PassType`. */
  metaOutputKey: string;
  /** Output field name for the expiry value, and the column name on both tables (`${column}Expiry`). */
  expiryKey: string;
};

const ROLES = ["mother", "father", "guardian"] as const;

/** The 6 independent document slots a parent/guardian upload step tracks. */
export const PARENT_GUARDIAN_DOC_GROUPS: ParentGuardianDocGroup[] = ROLES.flatMap((role) => [
  { column: `${role}Passport`, metaOutputKey: `${role}PassportNumber`, expiryKey: `${role}PassportExpiry` },
  { column: `${role}Pass`, metaOutputKey: `${role}PassType`, expiryKey: `${role}PassExpiry` },
]);

/** One row from a `*_enrolment_applications` select — metadata columns only. */
export type ParentGuardianApplicationRow = { enroleeNumber: string } & Record<string, unknown>;

/** One row from a `*_enrolment_documents` select — file-URL columns only. */
export type ParentGuardianDocumentRow = Record<string, unknown>;

export type MergeState = {
  /** Accumulated output fields — same flat shape as `parentGuardianUploadRequirements`. */
  docs: Record<string, unknown>;
  /** Which `ParentGuardianDocGroup.column`s have already been resolved (never overwritten). */
  filled: Set<string>;
};

export function createMergeState(): MergeState {
  return { docs: {}, filled: new Set() };
}

/** True once every one of the 6 slots has been resolved — the caller can stop scanning older
 * academic years the moment this is true. */
export function isMergeComplete(state: MergeState): boolean {
  return state.filled.size === PARENT_GUARDIAN_DOC_GROUPS.length;
}

function isPresent(value: unknown): boolean {
  return value != null && value !== "";
}

/**
 * Folds one academic year's worth of already-fetched rows into `state`, filling any slot that's
 * still empty. `appRows` must already be ordered newest-first (the DB's `ORDER BY created_at
 * DESC`); within that order, and across repeated calls for older years, the FIRST row seen to
 * have a slot populated wins — later (older) matches for an already-filled slot are ignored.
 *
 * Returns a new state; does not mutate the one passed in.
 */
export function mergeYearIntoState(
  state: MergeState,
  appRows: ParentGuardianApplicationRow[],
  docsByEnrolee: Map<string, ParentGuardianDocumentRow>,
): MergeState {
  const docs = { ...state.docs };
  const filled = new Set(state.filled);

  for (const appRow of appRows) {
    if (filled.size === PARENT_GUARDIAN_DOC_GROUPS.length) break;

    const docRow = docsByEnrolee.get(appRow.enroleeNumber);
    if (!docRow) continue;

    for (const group of PARENT_GUARDIAN_DOC_GROUPS) {
      if (filled.has(group.column)) continue;

      const fileValue = docRow[group.column];
      if (!isPresent(fileValue)) continue;

      docs[group.column] = fileValue;

      const metaValue = appRow[group.column];
      if (isPresent(metaValue)) docs[group.metaOutputKey] = metaValue;

      const expiryValue = appRow[group.expiryKey];
      if (isPresent(expiryValue)) docs[group.expiryKey] = expiryValue;

      filled.add(group.column);
    }
  }

  return { docs, filled };
}
