import { supabase } from "@/lib/client";

/** Where the SIS runs during local development. */
const LOCAL_SIS = "http://localhost:3000/";

/**
 * Resolves the SIS API base URL, always with exactly one trailing slash
 * (e.g. `https://hfse-sis.vercel.app/`).
 *
 * Dev ALWAYS points at the locally-running SIS, deliberately ignoring `VITE_SIS_URL`: server-side
 * SIS work lands locally before it is deployed, so dev must reach it without a deploy. Honouring
 * `VITE_SIS_URL` here instead sent dev at the deployed SIS, where a not-yet-deployed route returns
 * a 404 HTML page carrying no `Access-Control-Allow-Origin` — which the browser blocks and reports
 * only as an unreadable "Failed to fetch".
 *
 * Prod — and `vite preview`, which sets PROD — uses `VITE_SIS_URL`, and never falls back to
 * localhost: a production bundle calling localhost would fail only on the parent's machine.
 *
 * Every SIS caller resolves the base from here so they cannot disagree. They previously did:
 * `use-report-card` always used `VITE_SIS_URL` while `use-parent-report-cards` used localhost in
 * dev, so the term list came from the local SIS while the card itself came from the deployed one —
 * the list looked current while the payload was stale.
 *
 * Takes the env as an argument rather than reading `import.meta.env` directly so the resolution
 * rule is testable without stubbing module-level globals.
 */
export function resolveSisBase(env: { PROD: boolean; VITE_SIS_URL?: string }): string {
  const base = env.PROD ? (env.VITE_SIS_URL?.trim() ?? "") : LOCAL_SIS;
  return base.replace(/\/+$/, "") + "/";
}

/** The SIS API base URL for this build. Every SIS caller resolves from here so they cannot disagree. */
export const SIS_BASE = resolveSisBase(import.meta.env as { PROD: boolean; VITE_SIS_URL?: string });

/** A field-level validation message from the SIS, worded for a parent to read as-is. */
export type SisIssue = { path: string; message: string };

/** Shown when the SIS fails without a readable body — a gateway error, or HTML from a proxy. */
const UNREADABLE_FAILURE = "Something went wrong contacting the school's system. Please try again.";

/**
 * A failed SIS call. Carries `status` so callers can distinguish 401 (send to login) from 403
 * (show as-is) from 400 (field errors), plus the `issues` and `Retry-After` those statuses bring.
 *
 * `message` is the SIS's own sentence wherever it supplied one. Those are written for parents and
 * maintained by the SIS team — render them rather than substituting our own copy.
 */
export class SisError extends Error {
  readonly status: number;
  readonly issues?: SisIssue[];
  readonly retryAfterSeconds?: number;
  /**
   * The whole parsed failure body.
   *
   * Some responses carry more than a sentence — the 409 on a declaration lists every clashing
   * filing — and teaching this transport layer those shapes would put domain knowledge in the
   * wrong place. Callers narrow it themselves.
   */
  readonly payload?: unknown;

  constructor(
    message: string,
    status: number,
    issues?: SisIssue[],
    retryAfterSeconds?: number,
    payload?: unknown,
  ) {
    super(message);
    this.name = "SisError";
    this.status = status;
    this.issues = issues;
    this.retryAfterSeconds = retryAfterSeconds;
    this.payload = payload;
  }
}

export type SisFetchInit = {
  method?: string;
  /** A JSON payload. Serialised and marked `application/json`. Mutually exclusive with `body`. */
  json?: unknown;
  /** A raw body — in practice `FormData`, for the evidence upload. */
  body?: BodyInit;
  signal?: AbortSignal;
};

/**
 * Calls the SIS with the signed-in parent's Supabase access token.
 *
 * Callers pass `json` or `body`, never headers: that is what keeps the multipart rule correct.
 * `FormData` must go out WITHOUT a `Content-Type`, because only the browser knows the boundary
 * it generated — setting `multipart/form-data` by hand produces a body the server cannot parse.
 */
export async function sisFetch<T>(path: string, init: SisFetchInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new SisError("You are not signed in. Please sign in and try again.", 401);

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body = init.body;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }

  const response = await fetch(`${SIS_BASE}${path}`, {
    method: init.method,
    headers,
    body,
    signal: init.signal,
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; issues?: SisIssue[] }
    | null;

  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    throw new SisError(
      payload?.error ?? UNREADABLE_FAILURE,
      response.status,
      payload?.issues,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      payload,
    );
  }

  return payload as T;
}
