import { SisError, type SisIssue } from "@/lib/sis";

export type SubmitFailureKind = "fields" | "conflict" | "forbidden" | "rateLimited" | "failed";

export type SubmitFailure = {
  kind: SubmitFailureKind;
  /** Shown to the parent. The SIS's own sentence wherever it supplied one. */
  message: string;
  /** Field-level messages to place under their inputs. Only on `fields`. */
  issues: SisIssue[];
  /** Whether pressing submit again could plausibly succeed. */
  retryable: boolean;
  /** Whether to offer a link to the status list, where the clashing filing already sits. */
  showsStatusList: boolean;
};

/** Shown instead of a raw exception — a parent should never be handed "Failed to fetch". */
const GENERIC = "Something went wrong sending this. Please try again.";

/**
 * Sorts a failed submit into what the parent should actually see.
 *
 * Branching on STATUS, never on message text: the SIS team owns and rewords that copy, so
 * matching on wording would break silently the next time they improve a sentence.
 *
 * A 400 is two different things depending on whether it carries `issues`. With them it is a form
 * error to correct in place; without them it is a refusal the form cannot fix — in practice an
 * overlap with a declaration already filed for those days, which is not the parent's mistake and
 * should not be dressed in destructive red.
 */
export function classifySubmitFailure(error: unknown): SubmitFailure {
  if (!(error instanceof SisError)) {
    return { kind: "failed", message: GENERIC, issues: [], retryable: true, showsStatusList: false };
  }

  const base = { message: error.message, issues: [], retryable: false, showsStatusList: false };

  if (error.status === 400 && error.issues?.length) {
    return { ...base, kind: "fields", issues: error.issues };
  }

  if (error.status === 400 || error.status === 409) {
    return { ...base, kind: "conflict", showsStatusList: true };
  }

  if (error.status === 403) {
    return { ...base, kind: "forbidden" };
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
  return { ...base, kind: "failed", message: error.message || GENERIC, retryable: true };
}
