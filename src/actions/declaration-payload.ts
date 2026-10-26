import type { DeclarationType } from "@/types/declarations";

/**
 * The wizard's form state. One flat shape feeds both branches, because the parent can go back and
 * switch between absence and travel — a discriminated union would fight that.
 */
export type DeclarationFormValues = {
  declarationType: DeclarationType;
  studentNumbers: string[];
  startDate: string;
  endDate: string;
  withMedical: boolean;
  evidencePath: string;
  evidenceUrl: string;
  destinationCountry: string;
  destinationCity: string;
  parentNote: string;
};

type AbsencePayload = {
  declarationType: "absence";
  studentNumbers: string[];
  startDate: string;
  endDate: string;
  withMedical: boolean;
  evidencePath?: string;
  evidenceUrl?: string;
  parentNote?: string;
};

type TravelPayload = {
  declarationType: "travel";
  studentNumbers: string[];
  startDate: string;
  endDate: string;
  destinationCountry: string;
  destinationCity?: string;
  parentNote?: string;
};

export type DeclarationPayload = AbsencePayload | TravelPayload;

/**
 * Builds the request body for `POST /api/parent/v2/declarations`.
 *
 * The two shapes are strict and MUST NOT be mixed — the SIS rejects `withMedical` on a travel
 * declaration, and `destinationCountry` on an absence, rather than ignoring them. Because the
 * form holds every field regardless of branch (a parent who fills in a destination and then
 * switches to "absence" leaves it populated), this builds each shape from scratch instead of
 * deleting keys from a merged object: there is then no path by which a stale field survives.
 */
export function toDeclarationPayload(values: DeclarationFormValues): DeclarationPayload {
  const common = {
    studentNumbers: values.studentNumbers,
    startDate: values.startDate,
    endDate: values.endDate,
  };

  const note = values.parentNote.trim();
  const parentNote = note ? { parentNote: note } : {};

  if (values.declarationType === "travel") {
    const city = values.destinationCity.trim();
    return {
      declarationType: "travel",
      ...common,
      destinationCountry: values.destinationCountry.trim(),
      ...(city ? { destinationCity: city } : {}),
      ...parentNote,
    };
  }

  // Evidence only travels with `withMedical`. Sending a path the parent then backed out of
  // would attach a certificate to a declaration that claims not to have one.
  const path = values.withMedical ? values.evidencePath.trim() : "";
  const url = values.withMedical ? values.evidenceUrl.trim() : "";

  return {
    declarationType: "absence",
    ...common,
    withMedical: values.withMedical,
    ...(path ? { evidencePath: path } : {}),
    ...(url ? { evidenceUrl: url } : {}),
    ...parentNote,
  };
}
