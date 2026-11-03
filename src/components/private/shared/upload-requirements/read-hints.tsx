import { cn } from "@/lib/utils";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";

import { DocumentCheck, ReadField } from "./use-document-check";

export type ReadHints = Partial<Record<ReadField["role"], ReactNode>>;

/** One line under a detail field saying how it relates to what was read off the document. */
function renderHint(field: ReadField, docName: string) {
  const ok = field.status === "match";
  const text = {
    match: `From your ${docName}`,
    differs: `Your ${docName} shows ${field.value}`,
    empty: `Your ${docName} shows ${field.value}`,
    expired: `Your ${docName} shows ${field.value}, which has expired`,
  }[field.status];

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs [&>svg]:size-3.5 [&>svg]:shrink-0",
        ok ? "text-success" : field.status === "empty" ? "text-muted-foreground" : "text-warning",
      )}>
      {ok ? <CheckCircle2 /> : field.status !== "empty" && <TriangleAlert />}
      {text}
    </p>
  );
}

/** The hint for each detail field that was read, keyed by role, for the field components to show. */
export function readHints(check: DocumentCheck): ReadHints {
  return Object.fromEntries(
    check.readFields.map((field) => [field.role, renderHint(field, check.docName)]),
  );
}
