import { getEvent, listEvents, saveRegistration } from "@/actions/events";
import useSession from "@/hooks/use-session";
import type { RegistrationBody } from "@/types/events";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Open events and this family's answered events. Keyed by email like the other account-wide queries. */
export function useEvents(ay?: string) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["events", session?.user.email, ay ?? null],
    queryFn: () => listEvents(ay),
    placeholderData: keepPreviousData,
    enabled: session != null,
    // The app's default is not to refetch on mount; this list must be current
    // whenever it opens (a new event, a closed one, the family's own answers).
    refetchOnMount: true,
  });
}

/** One event with its form and this family's saved answers. */
export function useEvent(slug: string | undefined) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["event", slug, session?.user.email],
    queryFn: () => getEvent(slug as string),
    enabled: session != null && !!slug,
  });
}

/**
 * Saves the whole family's answers; refreshes the list and this event afterwards. `refetchType: "all"`
 * because the list is not on screen during the form: it must be current before the parent lands back on
 * it, and Edit must reopen with the saved answers.
 */
export function useSaveRegistration(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RegistrationBody) => saveRegistration(slug, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["events"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["event", slug], refetchType: "all" }),
      ]);
    },
  });
}
