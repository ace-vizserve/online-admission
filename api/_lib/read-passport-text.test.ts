import { describe, expect, it } from "vitest";

import { confirmations, findDate, findLabelledExpiry, readMrz, readPassport, readPassports } from "./read-passport-text";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

// ICAO 9303 specimen passport (expiry 15 Apr 2012, document L898902C3).
const TD3 = ["P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", "L898902C36UTO7408122F1204159ZE184226B<<<<<10"];

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
    expect(readMrz(text)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3", birth: "740812" });
  });

  it("reads a second line that lost or garbled its trailing fillers", () => {
    // Real Tesseract output: "<" fillers read as L, a space added, one filler dropped.
    const line = `${TD3[1].slice(0, 14)} ${TD3[1].slice(14, 36)}<<<LLLLL10`;
    expect(readMrz(line)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3", birth: "740812" });
  });

  it("trims the filler off a passport number shorter than nine characters", () => {
    expect(readMrz(TD3[1].replace("L898902C36", "AB1234<<<1"))?.documentNumber).toBe("AB1234");
  });

  it("finds the line among stray characters OCR added around it", () => {
    expect(readMrz(`a | ~${TD3[1]} ©.`)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3", birth: "740812" });
  });

  it("reads a passport's second line alone when OCR mangled the name line", () => {
    // Real Tesseract output: the first line's "<" fillers came back as K/L runs, too long to be MRZ.
    const text = `P<UTOTAN<K<KWEI<MING<<<<<<LLLLLLLLLLLLLLLLLKLKLK

${TD3[1].replace("UTO", "UT0")}`;
    expect(readMrz(text)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3", birth: "740812" });
  });

  it("undoes letter-for-digit misreads in the date fields", () => {
    expect(readMrz(`${TD3[0]}\n${TD3[1].replace("1204159", "I2O4l59").replace("7408122", "74O8l2Z")}`)).toEqual({
      expiry: utc(2012, 4, 15),
      documentNumber: "L898902C3",
      birth: "740812",
    });
  });

  it("needs a second check digit to agree, so a lone chance match on noise isn't trusted", () => {
    const onlyExpiry = TD3[1].replace("L898902C36", "L898902C37").replace("7408122", "7408123");
    expect(readMrz(onlyExpiry)).toBeNull();
  });

  it("prefers the reading with the most check digits passing", () => {
    const twoChecks = TD3[1].replace("L898902C36", "L898902C37");
    expect(readMrz(`${twoChecks}\n${TD3[1]}`)).toEqual({ expiry: utc(2012, 4, 15), documentNumber: "L898902C3", birth: "740812" });
  });

  it("prefers the better reading whichever comes first, on one line or across lines", () => {
    const twoChecks = TD3[1].replace("L898902C36", "L898902C37");
    const full = { expiry: utc(2012, 4, 15), documentNumber: "L898902C3", birth: "740812" };
    expect(readMrz(`${TD3[1]}\n${twoChecks}`)).toEqual(full);
    expect(readMrz(`${twoChecks}${TD3[1]}`)).toEqual(full);
    expect(readMrz(`${TD3[1]}${twoChecks}`)).toEqual(full);
  });

  it("ignores a line whose date fields aren't digits, or whose sex field is invalid", () => {
    expect(readMrz(TD3[1].replace("7408122", "74A8122"))).toBeNull();
    expect(readMrz(TD3[1].replace("2F12", "2Q12"))).toBeNull();
  });

  it("drops an impossible expiry date even when its check digit passes", () => {
    // 31 Feb: its check digit passes, but it isn't a real date.
    expect(readMrz(TD3[1].replace("1204159", "1202317"))).toEqual({ expiry: null, documentNumber: "L898902C3", birth: "740812" });
    // …and with the number's check failing too, nothing usable is left.
    expect(readMrz(TD3[1].replace("1204159", "1202317").replace("L898902C36", "L898902C37"))).toBeNull();
  });

  it("drops an expiry whose check digit fails but keeps a valid document number", () => {
    expect(readMrz(`${TD3[0]}\n${TD3[1].replace("1204159", "1204169")}`)).toEqual({
      expiry: null,
      documentNumber: "L898902C3",
      birth: "740812",
    });
  });

  it("drops a document number whose check digit fails", () => {
    expect(readMrz(`${TD3[0]}\n${TD3[1].replace("L898902C36", "L898902C37")}`)).toEqual({
      expiry: utc(2012, 4, 15),
      documentNumber: null,
      birth: "740812",
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

describe("readPassport", () => {
  const mrz = { text: TD3.join("\n") };

  it("takes the MRZ expiry, and a number two reads contain", () => {
    expect(readPassport([{ text: "Date of expiry 01/01/2040\nPassport No L898902C3" }, mrz])).toEqual({
      expiry: utc(2012, 4, 15),
      passportNumber: "L898902C3",
      source: "mrz",
    });
  });

  it("leaves out a number only one read contains", () => {
    expect(readPassport([{ text: "noise" }, mrz])).toEqual({ expiry: utc(2012, 4, 15), passportNumber: null, source: "mrz" });
  });

  it("never confirms a P misread as F, which the check digit can't catch", () => {
    // P and F carry the same check-digit weight (25 and 15), so both lines verify.
    const real = { text: TD3[1].replace("L898902C36", "P898902C34") };
    const asF = { text: TD3[1].replace("L898902C36", "F898902C34") };
    expect(readMrz(asF.text)?.documentNumber).toBe("F898902C3");
    expect(readPassport([real, asF]).passportNumber).toBeNull();
    expect(readPassport([real, asF, { text: "No. P898902C3" }]).passportNumber).toBe("P898902C3");
  });

  it("takes the number from the same passport as the expiry when a file holds two", () => {
    // Real upload: both parents' passports in one file. The first passport's number was read once
    // (unconfirmed); the second's twice. The second's number must not be paired with the first's expiry.
    const other = TD3[1].replace("L898902C36", "P2263418B0").replace("7408122", "8707084").replace("1204159", "2905224");
    const reading = readPassport([mrz, { text: other }, { text: `${other}\nPassport No P2263418B` }]);
    expect(readMrz(other)).toMatchObject({ documentNumber: "P2263418B", birth: "870708" });
    expect(reading).toEqual({ expiry: utc(2012, 4, 15), passportNumber: null, source: "mrz" });
  });

  it("pairs a number with the expiry through a matching expiry when the birth date was misread", () => {
    const badNumber = { text: TD3[1].replace("L898902C36", "L898902C37") };
    const misreadBirth = { text: TD3[1].replace("7408122", "7408192") };
    expect(readPassport([badNumber, misreadBirth, { text: "No. L898902C3" }]).passportNumber).toBe("L898902C3");
    // …but not when neither the birth date nor the expiry matches.
    const otherPassport = { text: misreadBirth.text.replace("1204159", "2905224") };
    expect(readPassport([badNumber, otherPassport, { text: "No. L898902C3" }]).passportNumber).toBeNull();
  });

  it("trusts a number in an exact text layer on its own", () => {
    expect(readPassport([{ ...mrz, exact: true }]).passportNumber).toBe("L898902C3");
  });

  it("falls back to a labelled expiry when no MRZ verifies its expiry", () => {
    const badExpiry = { text: TD3[1].replace("1204159", "1204169") };
    expect(readPassport([{ text: "Date of expiry 01/01/2040" }, badExpiry, badExpiry])).toEqual({
      expiry: utc(2040, 1, 1),
      passportNumber: "L898902C3",
      source: "label",
    });
  });

  it("returns an empty reading when nothing is found", () => {
    expect(readPassport([{ text: "blurry nothing" }])).toEqual({ expiry: null, passportNumber: null, source: null });
  });
});

describe("readPassports", () => {
  const mrz = { text: TD3[1] };
  const second = TD3[1].replace("L898902C36", "P2263418B0").replace("7408122", "8707084").replace("1204159", "2905224");

  it("finds two passports on one page", () => {
    const page = { text: `${TD3[1]}\n${second}`, exact: true };
    expect(readPassports([page])).toEqual([
      { expiry: utc(2012, 4, 15), passportNumber: "L898902C3" },
      { expiry: utc(2029, 5, 22), passportNumber: "P2263418B" },
    ]);
  });

  it("keeps apart twins, who share a birth date but not an expiry", () => {
    const twin = TD3[1].replace("L898902C36", "P2263418B0").replace("1204159", "2905224");
    expect(readPassports([mrz, { text: twin }]).map((p) => p.expiry)).toEqual([utc(2012, 4, 15), utc(2029, 5, 22)]);
  });

  it("joins reads of one passport through a shared birth date, expiry or number", () => {
    const noExpiry = { text: TD3[1].replace("1204159", "1204169") }; // birth date, number
    const noNumber = { text: TD3[1].replace("L898902C36", "L898902C37") }; // birth date, expiry
    const otherBirth = { text: TD3[1].replace("7408122", "7408192") }; // number, expiry
    const one = [{ expiry: utc(2012, 4, 15), passportNumber: "L898902C3" }];
    expect(readPassports([noExpiry, noNumber])).toEqual(one);
    expect(readPassports([noNumber, otherBirth])).toEqual(one);
  });

  it("joins two number-only reads through their number when the birth dates disagree", () => {
    // Number and birth date pass on the first; on the second the birth date was misread into another
    // valid one, so only the number links them.
    const first = TD3[1].replace("1204159", "1204169");
    const misread = first.replace("7408122", "7408130");
    expect(readPassports([{ text: first }, { text: misread }])).toEqual([{ expiry: null, passportNumber: "L898902C3" }]);
  });

  it("keeps apart readings with nothing in common", () => {
    const first = { text: TD3[1].replace("1204159", "1204169") }; // number and birth date only
    const second = { text: "P2263418B0UTO8707084F2905229" };
    const noNumber = { text: TD3[1].replace("L898902C36", "L898902C37") }; // birth date and expiry only
    const numberOnly = { text: "P2263418B0UTO8707084F2905229".replace("2905229", "2905220") };
    expect(readPassports([first, first, second, second]).map((p) => p.passportNumber)).toEqual(["L898902C3", "P2263418B"]);
    expect(readPassports([noNumber, numberOnly, numberOnly]).map((p) => p.passportNumber)).toEqual([null, "P2263418B"]);
  });

  it("drops a passport with nothing verified", () => {
    expect(readPassports([{ text: TD3[1].replace("1204159", "1204169") }])).toEqual([]);
  });
});

describe("confirmations", () => {
  it("counts each read containing the number once, ignoring spaces and case, and an exact read twice", () => {
    expect(confirmations("K1234567", [{ text: "k123 4567 and K1234567" }, { text: "nope" }])).toBe(1);
    expect(confirmations("K1234567", [{ text: "K1234567", exact: true }, { text: "K1234567" }])).toBe(3);
  });
});
