import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/client";
import type { SiblingInformation as SiblingInformationType } from "@/types";


const SiblingInformation = () => {
  console.log("StudentInformationComponent mounted");
  const { id } = useParams();

  const { data, isLoading, error } = useQuery<SiblingInformationType | null>({
    queryKey: ["ay2025_enrolment_applications_sibling1", id],
    queryFn: async () => {
      console.log("Fetching student info for id:", id);
      const { data, error } = await supabase
        .from("ay2025_enrolment_applications")
        .select(`
            siblingFullName1,
            siblingBirthDay1,
            siblingReligion1,
            siblingEducationOccupation1,
            siblingSchoolCompany1
        `)
        .eq("id", id)
        .single();
      console.log("Supabase result:", { data, error });
      if (error) throw error;
      return {
        siblingFullName: data?.siblingFullName1 ?? "",
        siblingBirthDay: data?.siblingBirthDay1 ?? "",
        siblingReligion: data?.siblingReligion1 ?? "",
        siblingEducationOccupation: data?.siblingEducationOccupation1 ?? "",
        siblingSchoolCompany: data?.siblingSchoolCompany1 ?? "",
      } as SiblingInformationType;
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading sibling information.</div>;
  if (!data) return <div>No sibling information found.</div>;

  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Sibling's Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <Label>Full Name</Label>
              </div>
              <Input value={data.siblingFullName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Date of Birth</Label>
              </div>
              <Input value={data.siblingBirthDay || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Religion</Label>
              </div>
              <Input value={data.siblingReligion || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Education</Label>
              </div>
              <Input value={data.siblingEducationOccupation || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>School</Label>
              </div>
              <Input value={data.siblingSchoolCompany || ''} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiblingInformation;
