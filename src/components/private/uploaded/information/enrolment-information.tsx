import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { supabase } from "@/lib/client";
import type { EnrollmentInformation as EnrollmentInformationType } from "@/types";

const EnrolmentInformation = () => {
  const { id } = useParams();
  console.log("id param:", id);
  const { data, isLoading, error } = useQuery<EnrollmentInformationType | null>({
    queryKey: ["ay2025_enrolment_applications_information", id],
    queryFn: async () => {
      console.log("Fetching student info for id:", id);
      const { data, error } = await supabase
        .from("ay2025_enrolment_applications")
        .select(`
              levelApplied,
              classType,
              preferredSchedule,
              availSchoolBus,
              availUniform,
              availStudentCare,
              additionalLearningNeeds,
              discount1,
              discount2,
              discount3,
              referrerName
            `)
        .eq("id", id)
        .single();
      console.log("Supabase returned:", data);
      if (error) console.error("Supabase error:", error);
      return {
        levelApplied: data?.levelApplied ?? "",
        classType: data?.classType ?? "",
        preferredSchedule: data?.preferredSchedule ?? "",
        availSchoolBus: data?.availSchoolBus ?? "",
        availUniform: data?.availUniform ?? "",
        availStudentCare: data?.availStudentCare ?? "",
        additionalLearningNeeds: data?.additionalLearningNeeds ?? "",
        campusDevelopment: '',
        discount1: data?.discount1 ?? "",
        discount2: data?.discount2 ?? "",
        discount3: data?.discount3 ?? "",
        referrerName: data?.referrerName ?? "",
      } as EnrollmentInformationType;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading enrolment information.</div>;
  if (!data) return <div></div>;

  // Collect non-empty discounts
  const discounts = [data.discount1, data.discount2, data.discount3].filter(Boolean);

  return (
    <div className="mb-4">
            <Card>
                <CardHeader>
                    <CardTitle>Enrollment Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="mb-2">
                            <Label>Class Level</Label>
                        </div>
                        <Input value={data.levelApplied || ''} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Class Type</Label>
                        </div>
                        <Input value={data.classType || ''} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Preferred Schedule</Label>
                        </div>
                        <Input value={data.preferredSchedule || ''} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Additional Learning or Special Needs</Label>
                        </div>
                        <Input value={data.additionalLearningNeeds || 'No additional learning or special needs'} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Bus Service</Label>
                        </div>
                        <Input value={data.availSchoolBus || ''} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>School Uniform</Label>
                        </div>
                        <Input value={data.availUniform || ''} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Student Care</Label>
                        </div>
                        <Input value={data.availStudentCare || ''} readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Campus Development</Label>
                        </div>
                        {data.campusDevelopment ? (
                          <Select value={data.campusDevelopment} disabled>
                            <SelectTrigger className="w-[527px]">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Option 1">Option 1</SelectItem>
                              <SelectItem value="Option 2">Option 2</SelectItem>
                              <SelectItem value="Option 3">Option 3</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select disabled value="">
                            <SelectTrigger className="w-[527px]">
                              <SelectValue placeholder="No campus development" />
                            </SelectTrigger>
                          </Select>
                        )}
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Apply Discount Code</Label>
                        </div>
                        {discounts.length === 0 ? (
                            <Input value="No discount code" readOnly />
                        ) : (
                            <div className="flex flex-col gap-2">
                                {discounts.map((discount, idx) => (
                                    <Input key={idx} value={discount} readOnly />
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Referrer's Name</Label>
                        </div>
                        <Input value={data.referrerName || 'No referrer name'} readOnly />
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
  )
}

export default EnrolmentInformation