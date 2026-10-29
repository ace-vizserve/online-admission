import type { ReactNode } from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[1]?.[0] ?? "") : "")).toUpperCase();
}

/** A child's initials, name and class across the top of their card. */
export default function ChildHeader({
  child,
  badge,
}: {
  child: { name: string; levelLabel: string; className: string };
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b px-5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
        {initials(child.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{child.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[child.levelLabel, child.className].filter(Boolean).join(" · ")}
        </p>
      </div>
      {badge && <div className="ml-auto shrink-0">{badge}</div>}
    </div>
  );
}
