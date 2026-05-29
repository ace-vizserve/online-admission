import { supabase } from "@/lib/client";
import { useEffect, useState } from "react";

const SIS_BASE = (import.meta.env.PROD ? import.meta.env.VITE_SIS_URL : "http://localhost:3000/").replace(/\/$/, "") + "/";

export type Publication = {
  term_id: string;
  term_number: number | null;
  term_label: string;
  publish_from: string;
  publish_until: string;
};

export type StudentCard = {
  student_id: string;
  student_number: string;
  full_name: string;
  class_label: string;
  ay_code: string;
  publications: Publication[];
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; students: StudentCard[] }
  | { status: "error"; message: string };

export function useParentReportCards() {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setState({ status: "error", message: "Not signed in" });
        return;
      }

      const res = await fetch(`${SIS_BASE}/api/parent/v2/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (!cancelled) setState({ status: "error", message: body.error ?? "Failed to load" });
        return;
      }
      const json = await res.json();
      if (!cancelled) setState({ status: "ok", students: json.students ?? [] });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
