import { supabase } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";

export type SchoolConfig = {
  principal_name: string | null;
  ceo_name: string | null;
  organization_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  phone_number: string | null;
  website_url: string | null;
  contact_email: string | null;
  pei_registration_number: string | null;
  pei_registration_start_date: string | null;
  pei_registration_end_date: string | null;
  logo_url: string | null;
};

const COLUMNS =
  "principal_name, ceo_name, organization_name, address_line_1, address_line_2, phone_number, website_url, contact_email, pei_registration_number, pei_registration_start_date, pei_registration_end_date, logo_url";

/**
 * School-wide branding/config (letterhead, signatory names) from the shared
 * `school_config` table. Single row; rarely changes, so cached indefinitely.
 */
export function useSchoolConfig() {
  return useQuery({
    queryKey: ["school-config"],
    queryFn: async (): Promise<SchoolConfig | null> => {
      const { data, error } = await supabase.from("school_config").select(COLUMNS).limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      return data as SchoolConfig | null;
    },
    staleTime: Infinity,
  });
}
