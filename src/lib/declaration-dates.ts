import { format, parseISO } from "date-fns";

/**
 * Formats a declaration's `startDate`–`endDate` pair for display.
 *
 * Both are date-only strings ("2026-09-16"). `parseISO` reads those as LOCAL midnight, which is
 * what we want: `new Date("2026-09-16")` would parse as UTC midnight and render as the 15th for
 * any viewer west of Greenwich — misreporting which day a child was actually away.
 *
 * Repeated parts are dropped from the left so the common single-day and same-month cases read
 * naturally: "16 Sep 2026", "16 – 18 Sep 2026", "28 Nov – 3 Dec 2026".
 */
export function formatDeclarationDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (startDate === endDate) return format(start, "d MMM yyyy");

  const sameYear = start.getFullYear() === end.getFullYear();
  if (!sameYear) return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;

  const sameMonth = start.getMonth() === end.getMonth();
  const startPart = sameMonth ? format(start, "d") : format(start, "d MMM");
  return `${startPart} – ${format(end, "d MMM yyyy")}`;
}
