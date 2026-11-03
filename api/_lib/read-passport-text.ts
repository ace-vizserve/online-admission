/**
 * Turns the raw text of a passport (from a PDF's text layer or from OCR) into the values the
 * upload dialog's sub-fields hold. Every reader here is deliberately conservative:
 * it returns `null` rather than guess, because a wrong value it fills in is worse than an empty
 * field the parent fills in by hand.
 */

export type DocumentReading = {
  /** UTC midnight of the expiry day — the same shape `toUTCDateOnly` gives the form. */
  expiry: Date | null;
  passportNumber: string | null;
  /** Where the expiry came from: the passport's machine-readable zone (check-digit verified) or a
   * printed "Date of Expiry"-style label. */
  source: "mrz" | "label" | null;
};

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

/** OCR's usual misreads, undone only inside fields that must be digits (or letters) — the check
 * digits then confirm the result, so a wrong "fix" can't get through. */
const TO_DIGIT: Record<string, string> = { O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", S: "5", G: "6", B: "8" };
const TO_LETTER: Record<string, string> = { 0: "O", 1: "I", 5: "S", 8: "B" };
const asDigits = (s: string) => [...s].map((c) => TO_DIGIT[c] ?? c).join("");
const asLetters = (s: string) => [...s].map((c) => TO_LETTER[c] ?? c).join("");

/** ICAO 9303 check digit: weights 7-3-1, "<" counts 0, A-Z count 10-35. */
function checkDigit(s: string): string {
  const value = (c: string) => (c === "<" ? 0 : /\d/.test(c) ? +c : c.charCodeAt(0) - 55);
  return String([...s].reduce((sum, c, i) => sum + value(c) * [7, 3, 1][i % 3], 0) % 10);
}

/** Document number → expiry check digit: the first 28 characters of a passport's second MRZ line. */
const MRZ_HEAD = 28;

/**
 * Expiry + document number from a passport's machine-readable zone. Only its second line is read
 * (the name line above it is what OCR mangles most), and it's found by its shape anywhere in a
 * line, so stray characters OCR adds around it don't matter. A value counts only when its own check
 * digit passes and one more of the line's three does too — two independent checks make a chance
 * match on OCR noise vanishingly unlikely.
 */
export type MrzReading = {
  expiry: Date | null;
  documentNumber: string | null;
  /** YYMMDD as read, check digit or not: tells apart two passports in one file. */
  birth: string;
};

type CheckedReading = MrzReading & { checks: number };

/** The line's best reading, wherever in the line it sits. */
function readMrzLine(line: string): CheckedReading | null {
  let best: CheckedReading | null = null;
  for (let i = 0; i + MRZ_HEAD <= line.length; i++) {
    const head = line.slice(i, i + MRZ_HEAD);
    const number = head.slice(0, 9);
    const nationality = asLetters(head.slice(10, 13));
    const birth = asDigits(head.slice(13, 19));
    const sex = head[20];
    const expiry = asDigits(head.slice(21, 27));
    if (!/^[A-Z0-9<]{9}$/.test(number) || !/^[A-Z<]{3}$/.test(nationality) || !/^[MFX<]$/.test(sex)) continue;
    if (!/^\d{6}$/.test(birth) || !/^\d{6}$/.test(expiry)) continue;

    const numberOk = checkDigit(number) === asDigits(head[9]);
    const birthOk = checkDigit(birth) === asDigits(head[19]);
    const expiryOk = checkDigit(expiry) === asDigits(head[27]);
    const checks = +numberOk + +birthOk + +expiryOk;
    if (checks < 2 || (best && checks <= best.checks)) continue;

    best = {
      expiry: expiryOk ? utcDate(2000 + +expiry.slice(0, 2), +expiry.slice(2, 4) - 1, +expiry.slice(4, 6)) : null,
      documentNumber: numberOk ? number.replace(/<+$/, "") : null,
      birth,
      checks,
    };
  }
  return best;
}

/** Every line's reading: one scanned page can hold more than one passport. */
function readMrzLines(text: string): CheckedReading[] {
  return normalize(text)
    .split(/\r?\n/)
    .map((line) => readMrzLine(line.replace(/\s+/g, "")))
    .filter((r): r is CheckedReading => !!r && !!(r.expiry || r.documentNumber));
}

export function readMrz(text: string): MrzReading | null {
  const best = readMrzLines(text).reduce<CheckedReading | null>((top, r) => (top && top.checks >= r.checks ? top : r), null);
  return best && { expiry: best.expiry, documentNumber: best.documentNumber, birth: best.birth };
}

/** One read of a page's text: an OCR pass (one model, one image variant) or the PDF's own text layer. */
export type PageRead = {
  text: string;
  /** The PDF's text layer: exact text, not a guess, so it confirms a number on its own. */
  exact?: boolean;
};

const compact = (text: string) => normalize(text).replace(/\s+/g, "");

/** How many separate reads contain `number` — each OCR read once, an exact text layer twice. */
export function confirmations(number: string, reads: readonly PageRead[]): number {
  return reads.reduce((n, read) => n + (compact(read.text).includes(number) ? (read.exact ? 2 : 1) : 0), 0);
}

/** One passport found in a file, with only the values that were verified. */
export type PassportRead = { expiry: Date | null; passportNumber: string | null };

/**
 * Every passport in a file, from every read of its pages (some files hold both parents' in one
 * upload). Readings belong to the same passport when they share a birth date, expiry or number and
 * no two verified expiries disagree, which is what keeps twins apart. The expiry has to pass its
 * check digit. The number needs more: the check digit can't tell some letters apart (P and F weigh
 * the same, so a misread P passes as F), so it only counts once two separate reads contain it:
 * another pass at the MRZ, or the general model's read of the number printed on the data page.
 */
export function readPassports(reads: readonly PageRead[]): PassportRead[] {
  const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();
  const groups: MrzReading[][] = [];
  for (const reading of reads.flatMap((read) => readMrzLines(read.text))) {
    const group = groups.find((members) => {
      const expiry = members.find((m) => m.expiry)?.expiry;
      if (expiry && reading.expiry && !sameDay(expiry, reading.expiry)) return false;
      return members.some(
        (m) =>
          m.birth === reading.birth ||
          (m.expiry && reading.expiry) ||
          (m.documentNumber && m.documentNumber === reading.documentNumber),
      );
    });
    if (group) group.push(reading);
    else groups.push([reading]);
  }

  return groups
    .map((members) => ({
      expiry: members.find((m) => m.expiry)?.expiry ?? null,
      passportNumber:
        members.map((m) => m.documentNumber).find((n): n is string => !!n && confirmations(n, reads) >= 2) ?? null,
    }))
    .filter((passport) => passport.expiry || passport.passportNumber);
}

/** The file's first passport with a verified expiry, or else a printed "Date of Expiry"-style label. */
export function readPassport(reads: readonly PageRead[]): DocumentReading {
  const passports = readPassports(reads);
  const first = passports.find((p) => p.expiry);
  if (first) return { expiry: first.expiry, passportNumber: first.passportNumber, source: "mrz" };

  const labelled = findLabelledExpiry(reads.map((read) => read.text).join("\n"));
  return { expiry: labelled, passportNumber: passports[0]?.passportNumber ?? null, source: labelled ? "label" : null };
}
