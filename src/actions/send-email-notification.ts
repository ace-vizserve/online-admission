import { supabase } from "@/lib/client";

type Props = {
  academicYear: string;
  enroleeNumber: string;
  role: string;
  parentEmail: string;
  updatedSections: string[];
  section: "Student Information" | "Student Documents" | "Parent/Guardian Information" | "Parent/Guardian Documents";
};

export async function sendEmailNotification({
  parentEmail,
  role,
  updatedSections,
  section,
  enroleeNumber,
  academicYear,
}: Props) {
  try {
    const admissionPanelParams = Number(enroleeNumber.slice(3));
    const admissionPanelUrl = `https://panel.enrol.hfse.edu.sg/admin/content/${academicYear}_enrolment_applications/${admissionPanelParams}`;

    const { data, error } = await supabase.functions.invoke("resend-email", {
      body: { role, parentEmail, updatedSections, section, admissionPanelUrl },
    });

    if (error) {
      return console.error({ error });
    }

    console.log({ data });
  } catch (error) {
    const err = error as Error;
    console.log(err);
  }
}
