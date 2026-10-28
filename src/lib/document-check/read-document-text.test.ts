import { describe, expect, it } from "vitest";

import {
  detectPassType,
  findDate,
  findLabelledExpiry,
  readMrz,
  readPass,
  readPassport,
} from "./read-document-text";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

// ICAO 9303 specimen passport (expiry 15 Apr 2012, document L898902C3).
const TD3 = ["P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", "L898902C36UTO7408122F1204159ZE184226B<<<<<10"];
// ICAO 9303 specimen TD1 ID card (expiry 15 Apr 2012, document D23145890).
const TD1 = ["I<UTOD231458907<<<<<<<<<<<<<<<", "7408122F1204159UTO<<<<<<<<<<<6", "ERIKSSON<<ANNA<MARIA<<<<<<<<<<"];

const STUDENT_OPTIONS = [
  { value: "Singaporean" },
  { value: "Singapore PR" },
  { value: "Dependent Pass" },
  { value: "Student Pass" },
  { value: "Long Term Visit Pass" },
];
const PARENT_OPTIONS = [
  { value: "E-PASS" },
  { value: "S-PASS" },
  { value: "Dependent Pass" },
  { value: "Permanent Resident" },
  { value: "Other" },
];

describe("findDate", () => {
  it.each([
    ["14/11/2030", utc(2030, 11, 14)],
    ["14-11-2030", utc(2030, 11, 14)],
    ["1.2.2030", utc(2030, 2, 1)],
    ["2030-11-14", utc(2030, 11, 14)],
    ["14 NOV 2030", utc(2030, 11, 14)],
    ["14-NOV-2030", utc(2030, 11, 14)],
    ["14 SEPT 2030", utc(2030, 9, 14)],
    ["14 SEPTEMBER 2030", utc(2030, 9, 14)],
  ])("reads %s", (input, expected) => {
    expect(findDate(input)).toEqual(expected);
  });

  it("returns the earliest date in the string", () => {
    expect(findDate("from 01 JAN 2020 to 31/12/2025")).toEqual(utc(2020, 1, 1));
    expect(findDate("2025-12-31 then 01/01/2020")).toEqual(utc(2025, 12, 31));
  });

  it("rejects impossible dates and unknown months", () => {
    expect(findDate("31/02/2030")).toBeNull();
    expect(findDate("14 FOO 2030")).toBeNull();
    expect(findDate("no date here")).toBeNull();
    expect(findDate("14/11/30")).toBeNull();
  });

  it("falls back to a later pattern when an earlier one is impossible", () => {
    expect(findDate("31/02/2030 14 NOV 2030")).toEqual(utc(2030, 11, 14));
  });
});

describe("findLabelledExpiry", () => {
  it.each([
    "Date of Expiry: 14/11/2030",
    "EXPIRY DATE 14 Nov 2030",
    "Date of expiration 14-11-2030",
    "Valid until 14/11/2030",
    "Expires on 14/11/2030",
  ])("reads the date on the label's line: %s", (text) => {
    expect(findLabelledExpiry(text)).toEqual(utc(2030, 11, 14));
  });

  it("reads the date on the next non-blank line after the label", () => {
    expect(findLabelledExpiry("Date of Expiry\n14/11/2030")).toEqual(utc(2030, 11, 14));
    expect(findLabelledExpiry("Date of Expiry\n\n  \n14/11/2030")).toEqual(utc(2030, 11, 14));
  });

  it("ignores dates before the label and dates two lines away", () => {
    expect(findLabelledExpiry("Issued 01/01/2020 Date of Expiry")).toBeNull();
    expect(findLabelledExpiry("Date of Expiry\nName\n14/11/2030")).toBeNull();
  });

  it("keeps looking past a label with no date", () => {
    expect(findLabelledExpiry("Expiry date\nsee below\nfoo\nValid till 14/11/2030")).toEqual(utc(2030, 11, 14));
  });

  it("returns null with no label", () => {
    expect(findLabelledExpiry("Date of issue 14/11/2020")).toBeNull();
  });
});

describe("readMrz", () => {
  it("reads a passport MRZ with spaces and OCR guillemets", () => {
    const text = `noise\n${TD3[0].replace(/<</g, "« ‹")}\n${TD3[1].toLowerCase()}\n`;
    expect(readMrz(text)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3" });
  });

  it("reads an ID-card (TD1) MRZ", () => {
    expect(readMrz(TD1.join("\n"))).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "D23145890" });
  });

  it("pads a line that lost trailing filler characters", () => {
    expect(readMrz(`${TD3[0].slice(0, 42)}\n${TD3[1]}`)?.expiry).toEqual(utc(2012, 4, 15));
  });

  it("reads a passport's second line alone when OCR mangled the name line", () => {
    // Real Tesseract output: the first line's "<" fillers came back as K/L runs, too long to be MRZ.
    const text = `P<UTOTAN<K<KWEI<MING<<<<<<LLLLLLLLLLLLLLLLLKLKLK

${TD3[1].replace("UTO", "UT0")}`;
    expect(readMrz(text)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3" });
  });

  it("autocorrects a letter O in the expiry digits", () => {
    expect(readMrz(`${TD3[0]}\n${TD3[1].replace("1204159", "12O4159")}`)?.expiry).toEqual(utc(2012, 4, 15));
  });

  it("drops an expiry whose check digit fails but keeps a valid document number", () => {
    expect(readMrz(`${TD3[0]}\n${TD3[1].replace("1204159", "1204169")}`)).toEqual({
      expiry: null,
      documentNumber: "L898902C3",
    });
  });

  it("drops a document number whose check digit fails", () => {
    expect(readMrz(`${TD3[0]}\n${TD3[1].replace("L898902C36", "L898902C37")}`)).toEqual({
      expiry: utc(2012, 4, 15),
      documentNumber: null,
    });
  });

  it("returns null when nothing in the MRZ is verifiable", () => {
    const broken = TD3[1].replace("L898902C36", "L898902C37").replace("1204159", "1204169");
    expect(readMrz(`${TD3[0]}\n${broken}`)).toBeNull();
  });

  it("returns null for text with no MRZ-shaped lines", () => {
    expect(readMrz("REPUBLIC OF SINGAPORE\nSTUDENT'S PASS")).toBeNull();
  });

});

describe("detectPassType", () => {
  it.each([
    ["STUDENT'S PASS", STUDENT_OPTIONS, "Student Pass"],
    ["Student’s Pass", STUDENT_OPTIONS, "Student Pass"],
    ["DEPENDANT'S PASS", STUDENT_OPTIONS, "Dependent Pass"],
    ["DEPENDANT'S PASS", PARENT_OPTIONS, "Dependent Pass"],
    ["LONG-TERM VISIT PASS", STUDENT_OPTIONS, "Long Term Visit Pass"],
    ["EMPLOYMENT PASS", PARENT_OPTIONS, "E-PASS"],
    ["S PASS", PARENT_OPTIONS, "S-PASS"],
    ["Work pass: S-Pass", PARENT_OPTIONS, "S-PASS"],
    ["PERMANENT RESIDENT", STUDENT_OPTIONS, "Singapore PR"],
    ["RE-ENTRY PERMIT", PARENT_OPTIONS, "Permanent Resident"],
  ])("%s → %s", (text, options, expected) => {
    expect(detectPassType(text, options)).toBe(expected);
  });

  it("doesn't read Student's/Dependant's Pass as S Pass", () => {
    expect(detectPassType("STUDENTS PASS", PARENT_OPTIONS)).toBeNull();
    expect(detectPassType("DEPENDANT'S PASS", [{ value: "S-PASS" }])).toBeNull();
  });

  it("uses the earliest pass named in the text", () => {
    expect(detectPassType("DEPENDANT'S PASS\nSponsor: EMPLOYMENT PASS holder", PARENT_OPTIONS)).toBe(
      "Dependent Pass",
    );
  });

  it("returns null when the pass isn't one of this document's options", () => {
    expect(detectPassType("STUDENT'S PASS", PARENT_OPTIONS)).toBeNull();
  });

  it("returns null when no pass is named", () => {
    expect(detectPassType("REPUBLIC OF SINGAPORE", STUDENT_OPTIONS)).toBeNull();
  });
});

describe("readPassport", () => {
  it("prefers the MRZ", () => {
    expect(readPassport(`Date of expiry 01/01/2040\n${TD3.join("\n")}`)).toEqual({
      expiry: utc(2012, 4, 15),
      passType: null,
      passportNumber: "L898902C3",
      source: "mrz",
    });
  });

  it("falls back to a labelled expiry, keeping a verified MRZ number", () => {
    const badExpiry = TD3[1].replace("1204159", "1204169");
    expect(readPassport(`Date of expiry 01/01/2040\n${TD3[0]}\n${badExpiry}`)).toEqual({
      expiry: utc(2040, 1, 1),
      passType: null,
      passportNumber: "L898902C3",
      source: "label",
    });
  });

  it("returns an empty reading when nothing is found", () => {
    expect(readPassport("blurry nothing")).toEqual({
      expiry: null,
      passType: null,
      passportNumber: null,
      source: null,
    });
  });
});

describe("readPass", () => {
  it("reads the pass type and labelled expiry", () => {
    expect(readPass("STUDENT'S PASS\nDate of Expiry\n14 NOV 2030", STUDENT_OPTIONS)).toEqual({
      expiry: utc(2030, 11, 14),
      passType: "Student Pass",
      passportNumber: null,
      source: "label",
    });
  });

  it("prefers a card MRZ expiry", () => {
    expect(readPass(`DEPENDANT'S PASS\nExpiry 01/01/2040\n${TD1.join("\n")}`, STUDENT_OPTIONS)).toMatchObject({
      expiry: utc(2012, 4, 15),
      source: "mrz",
    });
  });

  it("returns no source when there's no expiry", () => {
    expect(readPass("EMPLOYMENT PASS", PARENT_OPTIONS)).toEqual({
      expiry: null,
      passType: "E-PASS",
      passportNumber: null,
      source: null,
    });
  });
});
