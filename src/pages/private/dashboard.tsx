import students from "@/assets/students.webp";
import { SectionCards } from "@/components/private/dashboard/section-cards";
import StudentsList from "@/components/private/dashboard/students-list";
import { useEffect } from "react";
import SEO, { BASE_URL } from "../seo";

function Dashboard() {
  useEffect(() => {
    if (!sessionStorage.length) return;
    sessionStorage.clear();
    location.reload();
  }, []);

  return (
    <>
      <SEO
        title="HFSE International School Online Admission Dashboard | Manage Your Enrolment"
        description="Log in to HFSE International School's online admission dashboard to manage applications, track enrolment status, and access student learning resources through VizSchool LMS."
        canonical={`${BASE_URL}/admission/dashboard`}
        image={students}
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "HFSE International School Online Admission Dashboard",
          description:
            "Log in to HFSE International School's online admission dashboard to manage applications, track enrolment status, and access student learning resources through VizSchool LMS.",
          url: `${BASE_URL}/admission/dashboard`,
          inLanguage: "en-GB",
          potentialAction: {
            "@type": "LoginAction",
            name: "Access HFSE Admission Dashboard",
          },
        }}
      />

      <div className="max-w-screen-2xl mx-auto w-full flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <SectionCards />
        <StudentsList />
      </div>
    </>
  );
}

export default Dashboard;
