import { supabase } from "@/lib/client";
import { useEffect, useState } from "react";

const SIS_BASE = (import.meta.env.VITE_SIS_URL as string).replace(/\/$/, "") + "/";

export type Cell = { quarterly: number | null; letter: string | null; is_na: boolean };

export type SubjectRow = {
  subject: { id: string; code: string; name: string; is_examinable: boolean };
  t1: Cell;
  t2: Cell;
  t3: Cell;
  t4: Cell;
  annual: number | null;
  annual_letter: string | null;
};

export type Term = {
  id: string;
  term_number: number;
  label: string;
  virtue_theme: string | null;
};

export type AttendanceRecord = {
  term_id: string;
  school_days: number | null;
  days_present: number | null;
  days_late: number | null;
};

export type CommentRecord = { term_id: string; comment: string | null; submitted?: boolean };

/**
 * A submitted adviser comment from a term EARLIER than the one being viewed. Kept in its own
 * payload field — never merged into `comments` — because the card reads `comments[0]`/`terms[0]`
 * and would otherwise render an earlier term's comment under the viewed term's heading.
 *
 * Each entry carries its own label and virtue theme: `payload.terms` only holds the viewed term,
 * so these cannot be looked up. Server-side guarantees: trimmed, never empty, never a draft,
 * never an unreleased or future term, never the viewed term, and always empty when termNumber is 4.
 */
export type EarlierComment = {
  term_id: string;
  term_number: number;
  term_label: string;
  virtue_theme: string | null;
  comment: string;
};

export type ReportCardPayload = {
  ay: { id: string; label: string };
  terms: Term[];
  student: {
    id: string;
    student_number: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    full_name: string;
  };
  section: { id: string; name: string; form_class_adviser: string | null };
  level: { id: string; code: string; label: string; level_type: string };
  enrollment_status: string;
  subjects: SubjectRow[];
  attendance: AttendanceRecord[];
  comments: CommentRecord[];
  /** Earlier terms' submitted comments, ascending by term_number. Empty on the Term 4 card. */
  earlierComments: EarlierComment[];
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; payload: ReportCardPayload }
  | { status: "error"; message: string };

export function useReportCard(studentId: never, termNumber: number | null) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!studentId) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setState({ status: "error", message: "Not signed in" });
        return;
      }

      const params = new URLSearchParams({ studentId });
      if (termNumber !== null) params.set("termNumber", String(termNumber));
      const res = await fetch(`${SIS_BASE}api/parent/v2/report-card?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (!cancelled) setState({ status: "error", message: body.error ?? "Failed to load" });
        return;
      }
      const json = await res.json();
      if (!cancelled) setState({ status: "ok", payload: json.payload });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId, termNumber]);

  return state;
}
