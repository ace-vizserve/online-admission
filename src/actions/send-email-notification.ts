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
    const { data: studentName, error: fetchError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("firstName, middleName, lastName")
      .eq("enroleeNumber", enroleeNumber)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const admissionPanelParams = Number(enroleeNumber.slice(3));
    const admissionPanelUrl = `https://panel.enrol.hfse.edu.sg/admin/content/${academicYear}_enrolment_applications/${admissionPanelParams}`;

    const { data, error } = await supabase.functions.invoke("resend-email", {
      body: {
        role,
        parentEmail,
        updatedSections,
        section,
        admissionPanelUrl,
        enrollmentNumber: enroleeNumber,
        studentName: `${studentName.lastName}, ${studentName.firstName} ${studentName.lastName ?? ""}`,
      },
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
