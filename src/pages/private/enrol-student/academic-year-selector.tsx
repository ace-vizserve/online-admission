import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { memo } from "react";

const academicYears = [
  {
    value: "ay2025",
    name: "AY 2025",
    label: "Academic Year 2025",
    description: "Enrol your child for the ongoing school year.",
    details: [
      "Classes are currently ongoing",
      "Late enrolment still accepted",
      "Ideal for students transferring mid-year",
    ],
    buttonText: "Enrol for AY 2025",
    // isClosed: true,
  },
  {
    value: "ay2026",
    name: "AY 2026",
    label: "Academic Year 2026",
    description: "Early registration for AY 2026 starts July 2025.",
    details: ["Secure a slot early", "Registration opens 1 July 2025", "Classes begin January 2026"],
    buttonText: "Register for AY 2026",
    isUpcoming: true,
  },
];

type Props = {
  setSelectedAy: (schoolYear: string) => void;
};

const AcademicYearSelector = memo(function ({ setSelectedAy }: Props) {
  return (
    <div className="relative min-h-screen flex items-center justify-center flex-col px-4 py-8 md:py-0">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-balance">Choose Academic Year</h1>

        <p className="text-lg md:text-xl text-muted-foreground text-pretty">
          Select the academic year for your child's enrolment journey
        </p>
      </div>
      <div className="mt-8 md:mt-12 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {academicYears.map((year) => (
          <div
            key={year.name}
            className="relative bg-white transition-transform hover:-translate-y-1 hover:shadow-lg border rounded-lg p-6">
            {/* {year.isClosed && (
              <Badge
                variant={"destructive"}
                className="text-[10px] font-bold absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 uppercase">
                Enrolment Closed
              </Badge>
            )} */}

            <h3 className={`text-lg md:text-2xl font-bold ${year.isUpcoming ? "text-primary" : "text-secondary"}`}>
              {year.label}
            </h3>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">{year.description}</p>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {year.details.map((detail) => (
                <li key={detail} className="flex items-center gap-2 text-sm md:text-base">
                  <CircleCheck className="size-4 md:size-5 text-green-600" />
                  {detail}
                </li>
              ))}
            </ul>
            <Button
              // disabled={year.isClosed}
              onClick={() => setSelectedAy(year.value)}
              variant={year.isUpcoming ? "default" : "secondary"}
              size={"lg"}
              className="w-full mt-6 gap-2 cursor-pointer">
              {year.buttonText}
              <ArrowUpRight />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AcademicYearSelector;
