/**
 * Works out what to tell a parent whose application submit just failed.
 *
 * The motivating case: parents filling this in from work laptops sit behind corporate
 * DLP/proxy stacks (Zscaler and friends) that inspect outbound traffic and, on a match, drop the
 * request to `*.supabase.co` outright. The browser reports that identically to a dropped wifi
 * connection - `TypeError: Failed to fetch`, no status, no body - so the response itself can
 * never tell us which happened.
 *
 * What we can do is probe. If our own origin answers while Supabase doesn't, the block is
 * *selective*, which a dead connection cannot produce. That is enough to name the category, and
 * naming the category is all the message needs to do - we never have to identify the specific
 * product doing the blocking.
 */

export type SubmitFailureKind =
  /** Something between the parent and Supabase is dropping the request. Usually a work network. */
  | "blocked"
  /** The device has no working connection at all. */
  | "offline"
  /** A real server-side or application error, which carries its own message. */
  | "unknown";

export type SubmitFailure = {
  kind: SubmitFailureKind;
  title: string;
  description: string;
};

/** How long to wait for the reachability probe before giving up on classifying. */
const PROBE_TIMEOUT_MS = 3000;

/**
 * Whether this error is the shape a failed network round-trip produces.
 *
 * supabase-js is inconsistent here by design: postgrest-js catches the underlying fetch
 * rejection and hands it back as a plain `{ error }`, while the auth client rethrows its own
 * wrapper. Both end up carrying the browser's original wording, so match on that rather than on
 * the class.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return /failed to fetch|networkerror|network error|load failed|fetch failed|err_(network|internet|blocked)/i.test(
    message,
  );
}

/**
 * Asks whether our own origin is reachable right now.
 *
 * Deliberately same-origin: the page is already served from here, so a failure means the
 * device's connection is genuinely gone rather than that one destination is being filtered.
 */
async function isOwnOriginReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    await fetch(`${window.location.origin}/favicon.ico?connectivity-probe=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const BLOCKED: SubmitFailure = {
  kind: "blocked",
  title: "Your application was not submitted",
  description:
    "We couldn't reach our servers. This often happens on work computers or company networks that restrict outside connections. Your answers are saved - please try again on a personal device or using mobile data.",
};

const OFFLINE: SubmitFailure = {
  kind: "offline",
  title: "Your application was not submitted",
  description:
    "Your device appears to be offline. Your answers are saved - please check your internet connection and try again.",
};

/**
 * Classifies a failed submit into what the parent should actually be told.
 *
 * Every message states plainly that the application did *not* go through, and that their answers
 * are still saved. A parent who closes the tab believing they submitted is the worst outcome
 * here, so the copy never leaves that ambiguous.
 */
export async function diagnoseSubmitFailure(error: unknown): Promise<SubmitFailure> {
  if (!isNetworkError(error)) {
    const message = error instanceof Error ? error.message : "";

    return {
      kind: "unknown",
      title: "Your application was not submitted",
      description: message
        ? `${message} Your answers are saved - please try again.`
        : "Something went wrong sending your application. Your answers are saved - please try again.",
    };
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return OFFLINE;
  }

  return (await isOwnOriginReachable()) ? BLOCKED : OFFLINE;
}
