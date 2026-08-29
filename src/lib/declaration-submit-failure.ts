import { SisError, type SisIssue } from "@/lib/sis";
import type { OverlappingFiling } from "@/types/declarations";

export type SubmitFailureKind =
  | "fields"
  | "datesClosed"
  | "conflict"
  | "forbidden"
  | "rateLimited"
  | "signedOut"
  | "failed";

export type SubmitFailure = {
  kind: SubmitFailureKind;
  /** Shown to the parent. The SIS's own sentence wherever it wrote one for them. */
  message: string;
  /** Field-level messages to place under their inputs. Only on `fields`. */
  issues: SisIssue[];
  /** Every filing that clashed. Only on `conflict`. */
  overlapping: OverlappingFiling[];
  /** Whether pressing submit again could plausibly succeed. */
  retryable: boolean;
  /** Whether to offer a link to the status list, where the clashing filing already sits. */
  showsStatusList: boolean;
  /** Whether to send the parent back to the dates, which are what they need to change. */
  returnsToDates: boolean;
};

/** Shown instead of a raw exception — a parent should never be handed "Failed to fetch". */
const GENERIC = "Something went wrong sending this. Please try again.";

/**
 * Neither 401 body — "missing Bearer token" or "invalid or expired token" — is written for a
 * parent, so the SIS's wording is deliberately dropped here rather than shown.
 */
const SIGNED_OUT = "Your session has expired. Please sign in again.";

/** Narrows the 409's `overlapping` array off the untyped failure body. */
function readOverlapping(payload: unknown): OverlappingFiling[] {
  if (typeof payload !== "object" || payload === null) return [];
  const value = (payload as { overlapping?: unknown }).overlapping;
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is OverlappingFiling => typeof entry === "object" && entry !== null);
}

/**
 * Sorts a failed submit into what the parent should actually see, and where they should go.
 *
 * Branching on STATUS, never on message text: the SIS team owns and rewords that copy, so
 * matching on wording would break silently the next time they improve a sentence.
 *
 * The 400/409 split matters and is easy to get wrong. Both arrive as a flat sentence with no
 * field to highlight, but they need opposite destinations:
 *
 * - `400` (no `issues`) — no selected child has a school day in the whole range. The dates are
 *   what must change, so the parent goes back to them. Note this fires only when the school is
 *   shut for ALL of it: Friday to Tuesday over a weekend is fine.
 * - `409` — those dates are already on record, pending or approved. Nothing to change here;
 *   the filing they need is in the status list.
 *
 * (Before 29 Aug 2026 a clash answered 400 too, which is why these once shared a branch.)
 */
export function classifySubmitFailure(error: unknown): SubmitFailure {
  const base = { issues: [], overlapping: [], retryable: false, showsStatusList: false, returnsToDates: false };

  if (!(error instanceof SisError)) {
    return { ...base, kind: "failed", message: GENERIC, retryable: true };
  }

  const withMessage = { ...base, message: error.message };

  if (error.status === 401) {
    return { ...base, kind: "signedOut", message: SIGNED_OUT };
  }

  if (error.status === 400 && error.issues?.length) {
    return { ...withMessage, kind: "fields", issues: error.issues };
  }

  if (error.status === 400) {
    return { ...withMessage, kind: "datesClosed", returnsToDates: true };
  }

  if (error.status === 409) {
    return {
      ...withMessage,
      kind: "conflict",
      showsStatusList: true,
      overlapping: readOverlapping(error.payload),
    };
  }

  if (error.status === 403) {
    return { ...withMessage, kind: "forbidden" };
  }

  if (error.status === 429) {
    const wait = error.retryAfterSeconds;
    return {
      ...base,
      kind: "rateLimited",
      message: wait
        ? `Too many attempts. Please try again in ${wait} seconds.`
        : "Too many attempts. Please try again shortly.",
      retryable: true,
    };
  }

  // 5xx and anything else: the SIS's sentence if it gave one, and retrying may genuinely work.
  return { ...withMessage, kind: "failed", message: error.message || GENERIC, retryable: true };
}
