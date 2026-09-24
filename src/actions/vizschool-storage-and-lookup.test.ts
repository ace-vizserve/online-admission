/**
 * VizSchool paths that used to build names from the selector key (`vizschool-ay2026`) or a hardcoded year:
 *  - document uploads went to the storage folder `vizschool-ay2026/documents/`, while the documents page
 *    reads and re-uploads under `ay2026/documents/` — so a later delete missed the file;
 *  - `vizSchoolLookupNewEnrolledStudent` matched `V26%` whatever year it was asked about.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";

const storage = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn(),
}));

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
  storage: { from: () => storage },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { deleteFile, documentsFolder, storagePathsForDelete, uploadFileToBucket, vizSchoolLookupNewEnrolledStudent } =
  await import("./private");

const PUBLIC_BASE = "https://proj.supabase.co/storage/v1/object/public/parent-portal";

let harness: ReturnType<typeof createSupabaseMock>;

beforeEach(() => {
  harness = createSupabaseMock();
  mockState.from = harness.supabase.from;
  mockState.auth.getSession = harness.supabase.auth.getSession;
  storage.upload.mockReset().mockImplementation(async (path: string) => ({ data: { path }, error: null }));
  storage.remove.mockReset().mockResolvedValue({ data: [], error: null });
  storage.getPublicUrl.mockReset().mockImplementation((path: string) => ({ data: { publicUrl: `${PUBLIC_BASE}/${path}` } }));
});

describe("document storage folder", () => {
  it("is the table year's folder for a VizSchool key and unchanged for an HFSE-IS one", () => {
    expect(documentsFolder("vizschool-ay2026")).toBe("ay2026/documents");
    expect(documentsFolder("ay2027")).toBe("ay2027/documents");
  });

  it("a VizSchool upload lands in ay2026/documents/", async () => {
    const file = new File(["x"], "id.png", { type: "image/png" });

    const result = await uploadFileToBucket(true, [file], "vizschool-ay2026");

    expect(storage.upload.mock.calls[0][0]).toMatch(/^ay2026\/documents\/\d+_id\.png$/);
    expect(result?.imagePath).toMatch(new RegExp(`^${PUBLIC_BASE}/ay2026/documents/`));
  });
});

describe("deleting a stored document", () => {
  it("deletes by the path recorded in the URL — including a pre-fix vizschool-ay2026/ file", async () => {
    await deleteFile(`${PUBLIC_BASE}/vizschool-ay2026/documents/1700000000000_passport.pdf`, "ay2026");

    expect(storage.remove).toHaveBeenCalledWith(["vizschool-ay2026/documents/1700000000000_passport.pdf"]);
  });

  it("deletes a current file from its own folder, decoding the URL", () => {
    expect(storagePathsForDelete(`${PUBLIC_BASE}/ay2026/documents/1_my%20file.pdf?t=1`, "vizschool-ay2026")).toEqual([
      "ay2026/documents/1_my file.pdf",
    ]);
  });

  it("with no path to go on, tries the table folder and then the legacy VizSchool folder", () => {
    expect(storagePathsForDelete("1_id.png", "vizschool-ay2026")).toEqual([
      "ay2026/documents/1_id.png",
      "vizschool-ay2026/documents/1_id.png",
    ]);
    expect(storagePathsForDelete("1_id.png", "ay2026")).toEqual(["ay2026/documents/1_id.png"]);
  });

  it("still re-throws a storage failure so the caller keeps the document on screen", async () => {
    storage.remove.mockResolvedValue({ data: null, error: { message: "storage down" } });

    await expect(deleteFile(`${PUBLIC_BASE}/ay2026/documents/1_id.png`, "ay2026")).rejects.toThrow("storage down");
  });
});

describe("vizSchoolLookupNewEnrolledStudent", () => {
  const LEARNER = { nric: "S1234567A", birthDay: "2015-01-01", fullName: "Test Learner" };

  it.each([
    ["ay2026", "ay2026_enrolment_applications", "V26%"],
    ["ay2027", "ay2027_enrolment_applications", "V27%"],
    ["vizschool-ay2027", "ay2027_enrolment_applications", "V27%"],
  ])("for %s reads %s and matches student numbers %s", async (academicYear, table, pattern) => {
    await vizSchoolLookupNewEnrolledStudent({ academicYear, ...LEARNER });

    expect(harness.calls).toHaveLength(1);
    expect(harness.calls[0].table).toBe(table);
    expect(harness.calls[0].filters["studentNumber.ilike"]).toBe(pattern);
  });
});
