import students from "@/assets/students.webp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SEO, { BASE_URL } from "@/pages/seo";
import { useSelectAcademicYear, useSelectOpenHouseInstitution } from "@/zustand-store";
import { Radio, RadioGroup } from "@headlessui/react";
import { ArrowUpRight, CheckCircle2, ChevronRight, GraduationCap, School } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import hfseLogo from "../../../assets/hfse-logo.webp";

export default function OpenHouseLanding() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);

  const institution = useSelectOpenHouseInstitution((state) => state.institution);
  const setInstitution = useSelectOpenHouseInstitution((state) => state.setInstitution);

  const navigate = useNavigate();

  const handleProceed = () => {
    navigate("/open-house/residency-status", {
      state: {
        enroleeType: "New",
        isOpenHouseRegistration: true,
      },
    });
  };

  const institutionConfig = {
    youngstarters: {
      name: "Youngstarters Open House",
      subtitle: "Nursery & Kindergarten (4 - 6 years)",
      icon: GraduationCap,
    },
    hfse: {
      name: "HFSE International School Open House",
      subtitle: "Primary to Secondary (Cambridge International)",
      icon: School,
    },
  } as const;

  useEffect(() => {
    if (!sessionStorage.length) return;
    sessionStorage.clear();
    location.reload();
  }, []);

  return (
    <>
      <SEO
        title="HFSE International School Open House Registration | Book Your Campus Visit"
        description="Register for HFSE International School Open House. Experience our Cambridge curriculum, tour modern facilities, and meet our educators. Youngstarters (18m-6yo) and International School sessions available."
        canonical={`${BASE_URL}/open-house-registration`}
        image={students}
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "EventPage",
          name: "HFSE International School Open House Registration",
          description:
            "Register for HFSE Open House events. Explore Youngstarters (18m-6yo) and International School (Primary+) programmes. Cambridge curriculum excellence, campus tours, and educator meet-and-greets.",
          url: `${BASE_URL}/open-house-registration`,
          inLanguage: "en-GB",
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          startDate: "2026-02-01", // First event date
          eventLocation: {
            "@type": "School",
            name: "HFSE International School",
            address: {
              "@type": "PostalAddress",
              addressCountry: "SG",
              addressRegion: "Singapore",
            },
          },
          organizer: {
            "@type": "School",
            name: "HFSE International School",
          },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "SGD",
            availability: "https://schema.org/InStock",
          },
          potentialAction: {
            "@type": "RegisterAction",
            name: "Register for Open House",
            target: `${BASE_URL}/open-house-registration`,
          },
        }}
      />

      <div className="animate-in fade-in slide-in-from-top-2 duration-500 min-h-screen flex justify-center items-center bg-slate-50 text-primary selection:bg-primary/10 py-12 md:py-20">
        <section className="w-full px-6 overflow-hidden">
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -translate-y-1/2 size-[500px] bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl mx-auto relative z-10 text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <img
                src={hfseLogo}
                alt="HFSE International School"
                className="h-12 md:h-14 w-auto drop-shadow-lg hover:scale-105 transition-all duration-500 "
              />

              {/* Elegant Vertical Divider */}
              <div className="h-10 w-px bg-slate-300/50" />

              <img
                src="/ys-logo.png"
                alt="Youngstarters"
                className="h-12 md:h-14 w-auto drop-shadow-lg hover:scale-105 transition-all duration-500 "
              />
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary mb-3">
                Open House Registration
              </h1>
              <p className="text-base md:text-lg text-slate-500 font-semibold max-w-md mx-auto">
                Select your session to begin your journey with us.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-2xl rounded-xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-6 md:p-8 mb-8">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-primary uppercase tracking-[0.2em] ml-1">
                    Select academic year
                  </label>

                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    {["ay2026", "ay2027"].map((year) => {
                      const isSelected = academicYear === year;

                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setAcademicYear(year)}
                          className={cn(
                            "relative cursor-pointer h-14 rounded-lg transition-all duration-300 group overflow-hidden",
                            isSelected
                              ? "bg-white text-primary shadow-md ring-1 ring-slate-200"
                              : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
                          )}>
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span
                              className={cn(
                                "text-[10px] uppercase tracking-tighter font-black opacity-60 transition-colors",
                                isSelected ? "text-primary" : "text-slate-400",
                              )}>
                              {year === "ay2026" ? "Current Year" : "Upcoming Year"}
                            </span>
                            <span className="text-base font-black tracking-tight">AY {year.replace("ay", "")}</span>
                          </div>

                          {/* Active Indicator Pin */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="size-1.5 rounded-full bg-primary" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Programme Selection */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-primary uppercase tracking-[0.2em] ml-1">
                    Select Programme
                  </label>

                  <RadioGroup value={institution} onChange={setInstitution} className="grid gap-3">
                    {(Object.keys(institutionConfig) as Array<keyof typeof institutionConfig>).map((key) => {
                      const item = institutionConfig[key];
                      const Icon = item.icon;

                      return (
                        <Radio
                          key={key}
                          value={key}
                          className={({ checked, focus }) =>
                            cn(
                              "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer outline-none",
                              checked
                                ? "border-primary bg-primary/[0.02] shadow-sm ring-4 ring-primary/5"
                                : "border-slate-50 bg-white hover:border-slate-200",
                              focus && "ring-2 ring-primary ring-offset-2",
                            )
                          }>
                          {({ checked }) => (
                            <>
                              <div
                                className={cn(
                                  "size-11 rounded-xl flex items-center justify-center transition-colors",
                                  checked ? "bg-primary text-white" : "bg-slate-50 text-slate-400",
                                )}>
                                <Icon className="size-6" strokeWidth={2.5} />
                              </div>

                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between gap-2">
                                  <h4
                                    className={cn(
                                      "font-bold text-sm transition-colors",
                                      checked ? "text-slate-900" : "text-slate-500",
                                    )}>
                                    {item.name}
                                  </h4>
                                  {checked && (
                                    <CheckCircle2
                                      className="size-4 text-primary animate-in zoom-in shrink-0"
                                      strokeWidth={3}
                                    />
                                  )}
                                </div>
                                <p
                                  className={cn(
                                    "text-[10px] font-bold leading-tight mt-0.5",
                                    checked ? "text-primary/70" : "text-slate-400",
                                  )}>
                                  {item.subtitle}
                                </p>
                              </div>
                            </>
                          )}
                        </Radio>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              disabled={!academicYear || !institution}
              onClick={handleProceed}
              className="w-full max-w-sm h-14 rounded-xl font-black uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group">
              <span className="flex items-center gap-2">
                Continue to Registration
                <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <div className="mt-8">
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200/60 max-w-[280px] mx-auto">
                <p className="text-[11px] text-slate-500 font-bold">Already registered?</p>
                <Link
                  to="/admission/dashboard"
                  target="_parent"
                  className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline underline-offset-4 group">
                  Access Dashboard
                  <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
