import { getSectionCardsDetails } from "@/actions/private";
import useSession from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";

/**
 * Shared source for outstanding document requirements, consumed by the sidebar "Document
 * Requirements" badge, the dashboard stat card, and the Document Requirements page.
 *
 * All three deliberately share one query key. getSectionCardsDetails is expensive — it fetches
 * the student list and then calls getStudentDetails once per student — and it used to run under
 * two different keys (["section-cards", email] on the dashboard, ["pending-tasks", email] on
 * the page), so navigating between them refetched everything. One key means one fetch.
 *
 * Unlike useDraftRows, this does not opt into refetchOnMount: the global default in main.tsx is
 * already `refetchOnMount: false`, which is what keeps the sidebar badge from re-running the
 * per-student fetch on every navigation.
 */
export function usePendingTasks() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["pending-tasks", session?.user.email],
    queryFn: getSectionCardsDetails,
    enabled: session != null,
  });
}
