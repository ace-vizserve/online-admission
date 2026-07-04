import { beforeEach, describe, expect, it, vi } from "vitest";

// A minimal chainable stand-in for the Supabase query builder, scoped to exactly the call
// shapes used by src/actions/drafts.ts:
//   .from(table).upsert(payload, { onConflict })                          // save
//   .from(table).select("*").eq().eq().gt().order()                       // list (awaited, array)
//   .from(table).select("*").eq().eq().maybeSingle()                      // load
//   .from(table).delete().eq().eq()                                      // delete
//   .auth.getSession()
type MockResult = { data?: unknown; error?: { message: string } | null };

function createDraftsSupabaseMock(
  options: {
    session?: { user: { id: string } } | null;
    selectResult?: MockResult;
    upsertResult?: MockResult;
    deleteResult?: MockResult;
  } = {},
) {
  const calls: Array<{
    table: string;
    op: "select" | "upsert" | "delete";
    payload?: unknown;
    onConflict?: string;
    filters: Record<string, unknown>;
    orderBy?: { column: string; options?: unknown };
    calledVia: "maybeSingle" | "then";
  }> = [];

  function makeBuilder(table: string) {
    const filters: Record<string, unknown> = {};
    let op: "select" | "upsert" | "delete" = "select";
    let payload: unknown;
    let onConflict: string | undefined;
    let orderBy: { column: string; options?: unknown } | undefined;

    function record(calledVia: "maybeSingle" | "then") {
      calls.push({ table, op, payload, onConflict, filters: { ...filters }, orderBy, calledVia });
    }

    const builder = {
      upsert(value: unknown, opts?: { onConflict?: string }) {
        op = "upsert";
        payload = value;
        onConflict = opts?.onConflict;
        return builder;
      },
      delete() {
        op = "delete";
        return builder;
      },
      select() {
        op = "select";
        return builder;
      },
      eq(col: string, value: unknown) {
        filters[col] = value;
        return builder;
      },
      gt(col: string, value: unknown) {
        filters[`${col}__gt`] = value;
        return builder;
      },
      order(column: string, opts?: { ascending?: boolean }) {
        orderBy = { column, options: opts };
        return builder;
      },
      async maybeSingle() {
        record("maybeSingle");
        return options.selectResult ?? { data: null, error: null };
      },
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        record("then");
        let result: MockResult;
        if (op === "upsert") result = options.upsertResult ?? { error: null };
        else if (op === "delete") result = options.deleteResult ?? { error: null };
        else result = options.selectResult ?? { data: [], error: null };
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  const sessionValue = options.session === undefined ? { user: { id: "user-1" } } : options.session;

  const supabase = {
    from: (table: string) => makeBuilder(table),
    auth: {
      getSession: async () => ({ data: { session: sessionValue } }),
    },
  };

  return { supabase, calls };
}

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));

const { saveDraftRemote, listDraftsRemote, loadDraftRemote, deleteDraftRemote } = await import("./drafts");

function baseDraft(overrides: Partial<Parameters<typeof saveDraftRemote>[0]> = {}) {
  return {
    draftId: "draft-abc",
    type: "hfse-is" as const,
    academicYear: "2024-2025",
    formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
    currentTab: "/enrol-student/new/student-info",
    activeTab: "/enrol-student/new/student-info",
    completedTabs: ["/enrol-student/new/student-info"],
    createdAt: new Date("2024-05-01T00:00:00Z"),
    lastSavedAt: new Date("2024-06-01T00:00:00Z"),
    expiresAt: new Date("2024-07-01T00:00:00Z"),
    ...overrides,
  };
}

function baseDraftRow(overrides: Record<string, unknown> = {}) {
  return {
    draft_id: "draft-abc",
    user_id: "user-1",
    type: "hfse-is",
    academic_year: "2024-2025",
    form_state: { studentInfo: { studentDetails: { firstName: "Juan" } } },
    current_tab: "/enrol-student/new/student-info",
    active_tab: "/enrol-student/new/student-info",
    completed_tabs: ["/enrol-student/new/student-info"],
    created_at: "2024-05-01T00:00:00.000Z",
    last_saved_at: "2024-06-01T00:00:00.000Z",
    expires_at: "2024-07-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// saveDraftRemote
// ---------------------------------------------------------------------------

describe("saveDraftRemote", () => {
  it("throws when there is no authenticated session", async () => {
    const harness = createDraftsSupabaseMock({ session: null });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(saveDraftRemote(baseDraft())).rejects.toThrow("Not authenticated");
  });

  it("upserts the correct row shape, keyed on draft_id, scoped to the session user", async () => {
    const harness = createDraftsSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await saveDraftRemote(baseDraft());

    expect(harness.calls).toHaveLength(1);
    const call = harness.calls[0];
    expect(call.table).toBe("application_drafts");
    expect(call.op).toBe("upsert");
    expect(call.onConflict).toBe("draft_id");
    expect(call.payload).toEqual({
      draft_id: "draft-abc",
      user_id: "user-1",
      type: "hfse-is",
      academic_year: "2024-2025",
      form_state: { studentInfo: { studentDetails: { firstName: "Juan" } } },
      current_tab: "/enrol-student/new/student-info",
      active_tab: "/enrol-student/new/student-info",
      completed_tabs: ["/enrol-student/new/student-info"],
      created_at: "2024-05-01T00:00:00.000Z",
      last_saved_at: "2024-06-01T00:00:00.000Z",
      expires_at: "2024-07-01T00:00:00.000Z",
    });
  });

  it("accepts ISO string dates as well as Date objects", async () => {
    const harness = createDraftsSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await saveDraftRemote(
      baseDraft({
        createdAt: "2024-05-01T00:00:00.000Z",
        lastSavedAt: "2024-06-01T00:00:00.000Z",
        expiresAt: "2024-07-01T00:00:00.000Z",
      }),
    );

    const call = harness.calls[0];
    expect(call.payload).toMatchObject({
      created_at: "2024-05-01T00:00:00.000Z",
      last_saved_at: "2024-06-01T00:00:00.000Z",
      expires_at: "2024-07-01T00:00:00.000Z",
    });
  });

  it("propagates the Supabase error message on failure", async () => {
    const harness = createDraftsSupabaseMock({ upsertResult: { error: { message: "upsert failed" } } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(saveDraftRemote(baseDraft())).rejects.toThrow("upsert failed");
  });
});

// ---------------------------------------------------------------------------
// listDraftsRemote
// ---------------------------------------------------------------------------

describe("listDraftsRemote", () => {
  it("throws when there is no authenticated session", async () => {
    const harness = createDraftsSupabaseMock({ session: null });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(listDraftsRemote("hfse-is")).rejects.toThrow("Not authenticated");
  });

  it("scopes by user_id + type, filters non-expired, orders by last_saved_at desc, and maps rows", async () => {
    const harness = createDraftsSupabaseMock({ selectResult: { data: [baseDraftRow()], error: null } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await listDraftsRemote("hfse-is");

    const call = harness.calls[0];
    expect(call.table).toBe("application_drafts");
    expect(call.filters.user_id).toBe("user-1");
    expect(call.filters.type).toBe("hfse-is");
    expect(call.filters["expires_at__gt"]).toEqual(expect.any(String));
    expect(call.orderBy).toEqual({ column: "last_saved_at", options: { ascending: false } });

    expect(result).toEqual([
      {
        state: {
          draftId: "draft-abc",
          type: "hfse-is",
          academicYear: "2024-2025",
          formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
          currentTab: "/enrol-student/new/student-info",
          activeTab: "/enrol-student/new/student-info",
          completedTabs: ["/enrol-student/new/student-info"],
          createdAt: "2024-05-01T00:00:00.000Z",
          lastSavedAt: "2024-06-01T00:00:00.000Z",
          expiresAt: "2024-07-01T00:00:00.000Z",
        },
      },
    ]);
  });

  it("returns an empty array when there are no matching drafts", async () => {
    const harness = createDraftsSupabaseMock({ selectResult: { data: [], error: null } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    expect(await listDraftsRemote("viz-school")).toEqual([]);
  });

  it("propagates the Supabase error message on failure", async () => {
    const harness = createDraftsSupabaseMock({ selectResult: { data: null, error: { message: "list failed" } } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(listDraftsRemote("hfse-is")).rejects.toThrow("list failed");
  });
});

// ---------------------------------------------------------------------------
// loadDraftRemote
// ---------------------------------------------------------------------------

describe("loadDraftRemote", () => {
  it("throws when there is no authenticated session", async () => {
    const harness = createDraftsSupabaseMock({ session: null });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(loadDraftRemote("draft-abc")).rejects.toThrow("Not authenticated");
  });

  it("returns the mapped draft, falling back to empty strings for null optional columns", async () => {
    const harness = createDraftsSupabaseMock({
      selectResult: {
        data: baseDraftRow({ academic_year: null, current_tab: null, active_tab: null }),
        error: null,
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await loadDraftRemote("draft-abc");

    const call = harness.calls[0];
    expect(call.filters.draft_id).toBe("draft-abc");
    expect(call.filters.user_id).toBe("user-1");
    expect(call.calledVia).toBe("maybeSingle");

    expect(result?.state.academicYear).toBe("");
    expect(result?.state.currentTab).toBe("");
    expect(result?.state.activeTab).toBe("");
    expect(result?.state.draftId).toBe("draft-abc");
  });

  it("returns null when no draft matches", async () => {
    const harness = createDraftsSupabaseMock({ selectResult: { data: null, error: null } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    expect(await loadDraftRemote("missing-draft")).toBeNull();
  });

  it("propagates the Supabase error message on failure", async () => {
    const harness = createDraftsSupabaseMock({ selectResult: { data: null, error: { message: "load failed" } } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(loadDraftRemote("draft-abc")).rejects.toThrow("load failed");
  });
});

// ---------------------------------------------------------------------------
// deleteDraftRemote
// ---------------------------------------------------------------------------

describe("deleteDraftRemote", () => {
  it("throws when there is no authenticated session", async () => {
    const harness = createDraftsSupabaseMock({ session: null });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(deleteDraftRemote("draft-abc")).rejects.toThrow("Not authenticated");
  });

  it("deletes scoped to draft_id + user_id", async () => {
    const harness = createDraftsSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await deleteDraftRemote("draft-abc");

    const call = harness.calls[0];
    expect(call.table).toBe("application_drafts");
    expect(call.op).toBe("delete");
    expect(call.filters).toEqual({ draft_id: "draft-abc", user_id: "user-1" });
  });

  it("propagates the Supabase error message on failure", async () => {
    const harness = createDraftsSupabaseMock({ deleteResult: { error: { message: "delete failed" } } });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(deleteDraftRemote("draft-abc")).rejects.toThrow("delete failed");
  });
});
