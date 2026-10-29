import { getEvent, listEvents, saveRegistration } from "@/actions/events";
import useSession from "@/hooks/use-session";
import type { RegistrationBody } from "@/types/events";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Open events and this family's answered events. Keyed by email like the other account-wide queries. */
export function useEvents(ay?: string) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["events", session?.user.email, ay ?? null],
    queryFn: () => listEvents(ay),
    enabled: session != null,
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

/** Saves the whole family's answers; refreshes the list and this event afterwards. */
export function useSaveRegistration(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RegistrationBody) => saveRegistration(slug, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["events"] }),
        queryClient.invalidateQueries({ queryKey: ["event", slug] }),
      ]);
    },
  });
}
