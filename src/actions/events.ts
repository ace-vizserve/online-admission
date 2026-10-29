import { SisError, sisFetch } from "@/lib/sis";
import type {
  ParentEventDetail,
  ParentEventList,
  RegistrationBody,
  SaveRegistrationResponse,
} from "@/types/events";

/**
 * Parent events API. Like the declarations actions, these do not swallow errors: the SIS words its
 * failures for parents, and the pages need the query or mutation to reach an error state to show them.
 */

/** Open events plus the events this family has answered. `ay` is an academic-year code such as "AY2026". */
export async function listEvents(ay?: string): Promise<ParentEventList> {
  const query = ay ? `?ay=${encodeURIComponent(ay)}` : "";
  return await sisFetch<ParentEventList>(`api/parent/v2/events${query}`);
}

export async function getEvent(slug: string): Promise<ParentEventDetail> {
  return await sisFetch<ParentEventDetail>(`api/parent/v2/events/${encodeURIComponent(slug)}`);
}

export async function saveRegistration(slug: string, body: RegistrationBody): Promise<SaveRegistrationResponse> {
  return await sisFetch<SaveRegistrationResponse>(`api/parent/v2/events/${encodeURIComponent(slug)}/registration`, {
    method: "PUT",
    json: body,
  });
}

/**
 * Turns a failed save into messages the form can place.
 *
 * The SIS answers a 400 with `{ error, errors }`. Keys in `errors`: a family question is `<questionId>`;
 * a child's question is `<studentNumber>.<questionId>`; a child's reason is `<studentNumber>.reason`.
 * `form` is the sentence for the top of the page; `fields` is keyed exactly as the SIS keys it.
 */
export function mapRegistrationErrors(err: unknown): { form?: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  if (!(err instanceof SisError)) return { form: err instanceof Error ? err.message : undefined, fields };
  const payload = err.payload as { errors?: unknown } | null | undefined;
  const raw = payload?.errors;
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === "string") fields[key] = value;
    }
  }
  return { form: err.message || undefined, fields };
}
