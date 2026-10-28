import { parse } from "mrz";

/**
 * Turns the raw text of a passport / Singapore pass (from a PDF's text layer or from OCR) into
 * the values the upload dialog's sub-fields hold. Every reader here is deliberately conservative:
 * it returns `null` rather than guess, because a wrong value it fills in is worse than an empty
 * field the parent fills in by hand.
 */

export type DocumentReading = {
  /** UTC midnight of the expiry day — the same shape `toUTCDateOnly` gives the form. */
  expiry: Date | null;
  /** One of the document's own pass-type option values, never free text. */
  passType: string | null;
  passportNumber: string | null;
  /** Where the expiry came from: the passport's machine-readable zone (check-digit verified) or a
   * printed "Date of Expiry"-style label. */
  source: "mrz" | "label" | null;
};

type PassTypeOption = { readonly value: string };

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, SEPT: 8, OCT: 9, NOV: 10, DEC: 11,
};

function normalize(text: string): string {
  return text.toUpperCase().replace(/[‘’`´]/g, "'").replace(/[«‹]/g, "<");
}

function utcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month, day));
  // Rejects rollovers like 31/02 → 3 March, which an OCR misread can easily produce.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return date;
}

/** First day-first (Singapore convention) or ISO date in `s`. Two-digit years are not accepted —
 * outside the MRZ they're too ambiguous to trust. */
export function findDate(s: string): Date | null {
  const patterns: { re: RegExp; build: (m: RegExpMatchArray) => Date | null }[] = [
    { re: /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/, build: (m) => utcDate(+m[1], +m[2] - 1, +m[3]) },
    { re: /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/, build: (m) => utcDate(+m[3], +m[2] - 1, +m[1]) },
    {
      re: /\b(\d{1,2})[\s-]*([A-Z]{3,9})[\s-]*(\d{4})\b/,
      build: (m) => {
        const month = MONTHS[m[2].slice(0, 4)] ?? MONTHS[m[2].slice(0, 3)];
        return month == null ? null : utcDate(+m[3], month, +m[1]);
      },
    },
  ];

  let best: { index: number; date: Date } | null = null;
  for (const { re, build } of patterns) {
    const match = s.match(re);
    if (!match || match.index == null) continue;
    const date = build(match);
    if (date && (!best || match.index < best.index)) best = { index: match.index, date };
  }
  return best?.date ?? null;
}

const EXPIRY_LABEL =
  /DATE\s*OF\s*EXPIR(?:Y|ATION)|EXPIR(?:Y|ATION)\s*DATE|VALID\s*(?:UNTIL|TILL|THRU|THROUGH)|EXPIRES?\s*(?:ON)?\b/;

/** A date printed on the same line as an expiry label, or on the line right after it (cards often
 * print the label above the value). Nothing further away is trusted — it could be the issue date. */
export function findLabelledExpiry(text: string): Date | null {
  // OCR often puts a blank line between a label and its value, so "next line" means next non-blank.
  const lines = normalize(text)
    .split(/\r?\n/)
    .filter((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    const label = lines[i].match(EXPIRY_LABEL);
    if (!label || label.index == null) continue;
    const sameLine = lines[i].slice(label.index + label[0].length);
    const date = findDate(sameLine) ?? findDate(lines[i + 1] ?? "");
    if (date) return date;
  }
  return null;
}

/** MRZ formats by line length: TD3 (passports, 2×44), TD2 (2×36), TD1 (ID cards, 3×30). */
const MRZ_SHAPES = [
  { lines: 2, length: 44 },
  { lines: 2, length: 36 },
  { lines: 3, length: 30 },
];

const fit = (line: string, length: number) => line.slice(0, length).padEnd(length, "<");
const mrzLike = (line: string, length: number) => line.includes("<") && Math.abs(line.length - length) <= 2;

function mrzCandidates(text: string): string[][] {
  const lines = normalize(text)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ""))
    .filter(Boolean);
  const candidates: string[][] = [];

  for (const { lines: count, length } of MRZ_SHAPES) {
    for (let i = 0; i + count <= lines.length; i++) {
      const group = lines.slice(i, i + count);
      if (group.every((l) => mrzLike(l, length))) candidates.push(group.map((l) => fit(l, length)));
    }
  }

  // A passport's expiry and number are both on its second MRZ line, and the first (the name, a
  // long run of "<" fillers) is the one OCR mangles most — so also try each passport-length line
  // on its own, behind a blank first line. Its check digits still have to pass.
  for (const line of lines) {
    if (mrzLike(line, 44)) candidates.push([`P<${"<".repeat(42)}`, fit(line, 44)]);
  }
  return candidates;
}

function validField(details: { field: string | null; valid: boolean }[], field: string): boolean {
  const own = details.find((d) => d.field === field);
  const check = details.find((d) => d.field === `${field}CheckDigit`);
  return !!own?.valid && !!check?.valid;
}

/** Expiry + document number from the machine-readable zone, each only when its check digit
 * confirms the read — this is the one source accurate enough to block an upload on. */
export function readMrz(text: string): { expiry: Date | null; documentNumber: string | null } | null {
  for (const lines of mrzCandidates(text)) {
    let result;
    try {
      result = parse(lines, { autocorrect: true });
    } catch {
      continue;
    }

    const raw = result.fields.expirationDate;
    const expiry =
      raw && validField(result.details, "expirationDate")
        ? utcDate(2000 + +raw.slice(0, 2), +raw.slice(2, 4) - 1, +raw.slice(4, 6))
        : null;
    const documentNumber =
      result.documentNumber && validField(result.details, "documentNumber") ? result.documentNumber : null;

    if (expiry || documentNumber) return { expiry, documentNumber };
  }
  return null;
}

/** Keyword → the canonical pass it names. Order doesn't matter: the earliest match in the text
 * wins, since a pass's own title comes before any mention of e.g. a sponsor's pass. */
const PASS_KEYWORDS: { re: RegExp; kind: string }[] = [
  { re: /STUDENT'?S?\s+PASS/, kind: "student" },
  { re: /DEPEND[AE]NT'?S?\s+PASS/, kind: "dependent" },
  { re: /LONG[\s-]*TERM\s+VISIT/, kind: "ltvp" },
  { re: /EMPLOYMENT\s+PASS/, kind: "employment" },
  // "S Pass" — but not the tail of "Student's Pass" / "Dependant's Pass".
  { re: /(?:^|[^A-Z'])S[\s-]?PASS\b/, kind: "spass" },
  { re: /PERMANENT\s+RESIDENT|RE-?ENTRY\s+PERMIT/, kind: "pr" },
];

/** The option values each canonical pass maps to across the student and parent/guardian lists. */
const KIND_VALUES: Record<string, string[]> = {
  student: ["Student Pass"],
  dependent: ["Dependent Pass"],
  ltvp: ["Long Term Visit Pass"],
  employment: ["E-PASS"],
  spass: ["S-PASS"],
  pr: ["Singapore PR", "Permanent Resident"],
};

export function detectPassType(text: string, options: readonly PassTypeOption[]): string | null {
  const upper = normalize(text);
  let earliest: { index: number; kind: string } | null = null;

  for (const { re, kind } of PASS_KEYWORDS) {
    const match = upper.match(re);
    if (match?.index != null && (!earliest || match.index < earliest.index)) earliest = { index: match.index, kind };
  }
  if (!earliest) return null;

  const allowed = new Set(options.map((o) => o.value));
  return KIND_VALUES[earliest.kind].find((v) => allowed.has(v)) ?? null;
}

export function readPassport(text: string): DocumentReading {
  const mrz = readMrz(text);
  if (mrz?.expiry) {
    return { expiry: mrz.expiry, passType: null, passportNumber: mrz.documentNumber, source: "mrz" };
  }
  const labelled = findLabelledExpiry(text);
  return {
    expiry: labelled,
    passType: null,
    passportNumber: mrz?.documentNumber ?? null,
    source: labelled ? "label" : null,
  };
}

export function readPass(text: string, options: readonly PassTypeOption[]): DocumentReading {
  const passType = detectPassType(text, options);
  const mrzExpiry = readMrz(text)?.expiry ?? null;
  const expiry = mrzExpiry ?? findLabelledExpiry(text);
  return { expiry, passType, passportNumber: null, source: mrzExpiry ? "mrz" : expiry ? "label" : null };
}
