import Logo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import VizSchoolLogo from "@/components/vizschool-logo";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { memo } from "react";

const academicYears = [
  {
    value: "ay2026",
    name: "AY 2026",
    label: "Academic Year 2026",
    description: "Enrol your child for the ongoing school year.",

    details: [
      "Classes are currently ongoing",
      "Late enrolment still accepted",
      "Ideal for students transferring mid-year",
    ],
    buttonText: "Register for AY 2026",
    isUpcoming: false,
    logo: Logo,
  },

  {
    value: "vizschool-ay2026",
    name: "Vizschool AY2026",
    label: "Vizschool AY2026",
    description: "Early registration for AY 2026 starts Jan 2026.",
    details: ["Enrolling now for upcoming term", "Secure your spot early"],
    buttonText: "Enrol in Vizschool AY 2026",
    isPopular: true,
    logo: VizSchoolLogo,
  },
  {
    value: "ay2027",
    name: "AY 2027",
    label: "Academic Year 2027",
    description: "Early registration for AY 2027 starts July 2027.",
    details: ["Secure a slot early", "Registration opens 1 July 2026", "Classes begin January 2027"],
    buttonText: "Enrol for AY 2027",
    logo: Logo,
    isUpcoming: true,
    isClosed: false,
  },
];

type Props = {
  setSelectedAy: (schoolYear: string) => void;
};

const AcademicYearSelector = memo(function ({ setSelectedAy }: Props) {
  return (
    <div className="animate-in fade-in duration-500 relative min-h-screen flex items-center justify-center flex-col px-4 py-12 md:py-16 lg:py-0">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Choose Academic Year</h1>
        <p className="text-lg md:text-xl text-muted-foreground text-pretty">
          Select the academic year for your child's enrolment journey
        </p>
      </div>
      <div className="mt-8 md:mt-12 w-full mx-auto max-w-(--breakpoint-xl) grid grid-cols-1 lg:grid-cols-3 items-center gap-8">
        {academicYears.map((year) => (
          <div
            key={year.name}
            className={cn("relative bg-card transition-all duration-300 border border-border rounded-xl p-8 flex flex-col", {
              "border-2 border-secondary shadow-md lg:py-12 order-first lg:order-none": year.isPopular && !year.isClosed,
              "hover:shadow-md": !year.isClosed,
              "bg-muted/20 border-border opacity-75 grayscale-[0.5] cursor-not-allowed select-none": year.isClosed,
            })}>
            {year.isClosed ? (
              <Badge className="absolute font-bold uppercase tracking-widest text-[10px] top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted-foreground text-background border-none px-4 py-1.5 shadow-sm">
                Applications Closed
              </Badge>
            ) : null}

            <div className={cn("flex flex-col flex-grow", year.isClosed && "opacity-60")}>
              <div className="mb-6 flex justify-center">
                <year.logo className={cn("transition-transform", year.isPopular ? "h-20" : "h-16")} />
              </div>

              <h3
                className={cn(
                  "text-xl md:text-2xl font-bold text-center",
                  year.isClosed ? "text-muted-foreground" : year.isPopular ? "text-secondary" : "text-primary",
                )}>
                {year.label}
              </h3>

              <p className="mt-2 font-semibold text-sm text-center text-muted-foreground leading-relaxed">
                {year.description}
              </p>

              <Separator className="my-6" />

              <ul className="space-y-3 flex-grow">
                {year.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                    <CircleCheck
                      className={cn(
                        "size-4 mt-0.5 shrink-0",
                        year.isClosed ? "text-muted-foreground/50" : "text-success",
                      )}
                    />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              disabled={year.isClosed}
              onClick={() => setSelectedAy(year.value)}
              variant={year.isClosed ? "outline" : year.isPopular ? "secondary" : "cta"}
              size={"lg"}
              className={cn(
                "text-xs mt-8 w-full py-7 transition-all gap-3 md:text-sm font-semibold uppercase tracking-widest",
                year.isClosed && "bg-transparent text-muted-foreground",
              )}>
              {year.isClosed ? "Unavailable" : year.buttonText}
              {!year.isClosed && <ArrowUpRight size={18} strokeWidth={3} />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AcademicYearSelector;
