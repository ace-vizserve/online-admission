/**
 * Behaviour tests for the declaration read actions.
 *
 * These cover what this layer is responsible for — the request path, the query string, and
 * unwrapping the SIS's envelope. Header assembly and the error contract belong to `sisFetch`
 * and are proved in `src/lib/sis-fetch.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sisFetch } = vi.hoisted(() => ({ sisFetch: vi.fn() }));
vi.mock("@/lib/sis", () => ({ sisFetch }));

const { fileDeclaration, listDeclarations, listEnrolledStudents, uploadEvidence } = await import("./declarations");

/** The path the single sisFetch call was made with. */
const requestedPath = () => sisFetch.mock.calls[0][0];

beforeEach(() => {
  sisFetch.mockReset().mockResolvedValue({});
});

describe("listEnrolledStudents", () => {
  it("asks for the enrolled-students list, not the report-card students list", async () => {
    await listEnrolledStudents();

    expect(requestedPath()).toBe("api/parent/v2/enrolled-students");
  });

  it("unwraps the students envelope", async () => {
    const students = [{ studentNumber: "H250123", name: "Ana Reyes", className: "P4 Diligence" }];
    sisFetch.mockResolvedValue({ students });

    await expect(listEnrolledStudents()).resolves.toEqual(students);
  });

  it("returns an empty list when the parent has no enrolled children", async () => {
    sisFetch.mockResolvedValue({});

    await expect(listEnrolledStudents()).resolves.toEqual([]);
  });
});

describe("listDeclarations", () => {
  it("asks for the declarations list", async () => {
    await listDeclarations();

    expect(requestedPath()).toBe("api/parent/v2/declarations");
  });

  it("unwraps the declarations envelope", async () => {
    const declarations = [{ id: "3a1f", statusLabel: "With the school" }];
    sisFetch.mockResolvedValue({ declarations });

    await expect(listDeclarations()).resolves.toEqual(declarations);
  });

  it("returns an empty list when nothing has been filed yet", async () => {
    sisFetch.mockResolvedValue({});

    await expect(listDeclarations()).resolves.toEqual([]);
  });

  it("filters by child when asked", async () => {
    await listDeclarations({ studentNumber: "H250123" });

    expect(requestedPath()).toBe("api/parent/v2/declarations?studentNumber=H250123");
  });

  it("filters by status when asked", async () => {
    await listDeclarations({ status: "pending" });

    expect(requestedPath()).toBe("api/parent/v2/declarations?status=pending");
  });

  it("omits empty filters rather than sending a bare question mark", async () => {
    await listDeclarations({ studentNumber: undefined, status: undefined });

    expect(requestedPath()).toBe("api/parent/v2/declarations");
  });

  it("re-throws so useQuery reaches an error state and can show the SIS's own sentence", async () => {
    sisFetch.mockRejectedValue(new Error("invalid or expired token"));

    await expect(listDeclarations()).rejects.toThrow("invalid or expired token");
  });
});

describe("uploadEvidence", () => {
  const file = new File(["x"], "mc.pdf", { type: "application/pdf" });

  it("posts the certificate to the evidence endpoint", async () => {
    sisFetch.mockResolvedValue({ path: "declarations/a/b.pdf" });

    await uploadEvidence(file);

    const [path, init] = sisFetch.mock.calls[0];
    expect(path).toBe("api/parent/v2/declarations/evidence");
    expect(init.method).toBe("POST");
  });

  it("sends the file as multipart form data under the field name the SIS expects", async () => {
    sisFetch.mockResolvedValue({ path: "declarations/a/b.pdf" });

    await uploadEvidence(file);

    const body = sisFetch.mock.calls[0][1].body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
  });

  it("returns the server-checked path, which must be sent back verbatim", async () => {
    sisFetch.mockResolvedValue({ path: "declarations/8f2a/c41b.pdf" });

    await expect(uploadEvidence(file)).resolves.toBe("declarations/8f2a/c41b.pdf");
  });
});

describe("fileDeclaration", () => {
  const payload = {
    declarationType: "absence" as const,
    studentNumbers: ["H250123"],
    startDate: "2026-09-16",
    endDate: "2026-09-18",
    withMedical: false,
  };

  it("posts the declaration as JSON", async () => {
    sisFetch.mockResolvedValue({ filingGroupId: "9e7c", declarations: [] });

    await fileDeclaration(payload);

    const [path, init] = sisFetch.mock.calls[0];
    expect(path).toBe("api/parent/v2/declarations");
    expect(init.method).toBe("POST");
    expect(init.json).toEqual(payload);
  });

  it("returns the filing, including the alreadyFiled flag that marks a duplicate as success", async () => {
    const response = { filingGroupId: "9e7c", declarations: [], alreadyFiled: true };
    sisFetch.mockResolvedValue(response);

    await expect(fileDeclaration(payload)).resolves.toEqual(response);
  });
});
