/**
 * A minimal chainable stand-in for the Supabase query builder, scoped to exactly the call
 * shapes used by submitEnrollment / submitExistingEnrollment / submitVizSchoolEnrollment
 * (src/actions/private.ts), their shared helpers (src/actions/enrolment-payload.ts), and
 * getReEnrollmentData (src/actions/get-reenrollment-data.ts):
 *
 *   .from(table).insert(payload).select(cols).single()
 *   .from(table).update(payload).eq(col, val)...select(cols).single()
 *   .from(table).insert(payload)                          // awaited directly, no .select()
 *   .from(table).update(payload).eq(col, val)...           // awaited directly, no .select()
 *   .from(table).select(cols).eq(col, val).or(expr).single()   // ownership lookup
 *   .from(table).select(cols).eq(col, val).or(expr)             // awaited directly, no .single()/.maybeSingle() — returns an array (options.rows)
 *   .from(table).select(cols).eq(col, val)                      // awaited directly, no .single()/.maybeSingle() — returns an array (options.rows)
 *   .auth.getSession()
 *
 * Every terminal call is recorded (table, op, payload, filters) so tests can assert on
 * exactly what was sent to Supabase. `.insert().select().single()` and
 * `.update().select().single()` echo the id/payload back as `data` — the submit functions
 * only ever read back the column(s) *they themselves just wrote*, so echoing is sufficient
 * and keeps the mock from needing to know anything about real column formats.
 */

export type RecordedCall = {
  table: string;
  op: "insert" | "update" | "select";
  payload?: Record<string, unknown>;
  filters: Record<string, unknown>;
  selectCols?: string;
};

export type SupabaseMockOptions = {
  sessionEmail?: string;
  ownershipLookup?: { data: Record<string, unknown> | null; error: { message: string } | null };
  /** Rows returned per table for un-singled select chains (awaited directly, no `.single()`/`.maybeSingle()`). */
  rows?: Record<string, Record<string, unknown>[]>;
  errorOn?: (call: RecordedCall) => { message: string } | null | undefined;
};

export function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const calls: RecordedCall[] = [];
  let nextId = 1;

  function makeBuilder(table: string) {
    let op: RecordedCall["op"] | null = null;
    let payload: Record<string, unknown> | undefined;
    let selectCols: string | undefined;
    const filters: Record<string, unknown> = {};
    let insertedId: number | undefined;
    let calledVia: "single" | "maybeSingle" | "then" = "then";

    function resolveTerminal() {
      const call: RecordedCall = { table, op: op ?? "select", payload, filters: { ...filters }, selectCols };
      calls.push(call);

      const forcedError = options.errorOn?.(call);
      if (forcedError) return { data: null, error: forcedError };

      if (op === "insert") {
        if (selectCols) return { data: { id: insertedId, ...payload }, error: null };
        return { data: null, error: null };
      }

      if (op === "update") {
        if (selectCols) return { data: { ...payload }, error: null };
        return { data: null, error: null };
      }

      // Un-singled select chains (e.g. getReEnrollmentData's applications/documents fetch)
      // resolve to an array of seeded rows rather than the single-row ownership-lookup shape.
      if (calledVia === "then") {
        return { data: options.rows?.[table] ?? [], error: null };
      }

      // Pure select chains via `.single()`/`.maybeSingle()` occur for the re-enrollment
      // ownership lookup in this mock's scope (submitExistingEnrollment reads the returning
      // student's studentNumber).
      if (table.includes("_enrolment_applications") && "or" in filters) {
        return (
          options.ownershipLookup ?? {
            data: { studentNumber: "H260099" },
            error: null,
          }
        );
      }

      return { data: null, error: null };
    }

    const builder = {
      insert(value: Record<string, unknown>) {
        op = "insert";
        payload = value;
        insertedId = nextId++;
        return builder;
      },
      update(value: Record<string, unknown>) {
        op = "update";
        payload = value;
        return builder;
      },
      select(cols: string) {
        if (op === null) op = "select";
        selectCols = cols;
        return builder;
      },
      eq(col: string, value: unknown) {
        filters[col] = value;
        return builder;
      },
      or(expr: string) {
        filters.or = expr;
        return builder;
      },
      order() {
        return builder;
      },
      limit() {
        return builder;
      },
      async single() {
        calledVia = "single";
        return resolveTerminal();
      },
      async maybeSingle() {
        calledVia = "maybeSingle";
        return resolveTerminal();
      },
      // Supabase query builders are themselves thenable — code that awaits `.insert(...)` or
      // `.update(...).eq(...)` directly (no `.select()`/`.single()`) relies on this, as does
      // getReEnrollmentData's un-singled `.select("*").eq(...)` array reads.
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        calledVia = "then";
        return Promise.resolve(resolveTerminal()).then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  const supabase = {
    from: (table: string) => makeBuilder(table),
    auth: {
      getSession: async () => ({
        data: { session: { user: { email: options.sessionEmail ?? "parent@example.com" } } },
      }),
    },
  };

  return { supabase, calls };
}
