import { AdminStudent } from "@/actions/admin";

export type SortCol = "name" | "level" | "enroleeNumber";
export type SortDir = "asc" | "desc";

export type StudentListOptions = {
  levelFilter: string;
  search: string;
  sortCol: SortCol;
  sortDir: SortDir;
};

// Null name parts must vanish, not render as the string "null" — live rows can be incomplete.
export function studentDisplayName(s: AdminStudent): string {
  const givenNames = [s.firstName, s.middleName].filter(Boolean).join(" ");
  return [s.lastName, givenNames].filter(Boolean).join(", ");
}

export function filterAndSortStudents(
  students: AdminStudent[],
  { levelFilter, search, sortCol, sortDir }: StudentListOptions,
): AdminStudent[] {
  let result = levelFilter === "all" ? students : students.filter((s) => s.levelApplied === levelFilter);

  const q = search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (s) => studentDisplayName(s).toLowerCase().includes(q) || (s.enroleeNumber ?? "").toLowerCase().includes(q),
    );
  }

  const sortValue = (s: AdminStudent) =>
    sortCol === "level" ? (s.levelApplied ?? "") : sortCol === "enroleeNumber" ? (s.enroleeNumber ?? "") : studentDisplayName(s);

  return [...result].sort((a, b) =>
    sortDir === "asc" ? sortValue(a).localeCompare(sortValue(b)) : sortValue(b).localeCompare(sortValue(a)),
  );
}

export function distinctLevels(students: AdminStudent[]): string[] {
  return [...new Set(students.map((s) => s.levelApplied).filter((l): l is string => !!l))].sort();
}
