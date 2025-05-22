import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { memo } from "react";

const academicYears = [
  {
    value: "ay2025",
    name: "AY 2025",
    label: "Academic Year 2025",
    description: "Enroll your child for the ongoing school year.",
    details: [
      "Classes are currently ongoing",
      "Late enrollment still accepted",
      "Ideal for students transferring mid-year",
    ],
    buttonText: "Enroll for AY 2025",
  },
  {
    value: "ay2026",
    name: "AY 2026",
    label: "Academic Year 2026",
    description: "Early registration for AY 2026 starts June 2025.",
    details: ["Secure a slot early", "Registration opens July 1, 2025", "Classes begin January 2026"],
    buttonText: "Pre-register for AY 2026",
    isUpcoming: true,
  },
];

type Props = {
  setSelectedAy: (schoolYear: string) => void;
};

const AcademicYearSelector = memo(function ({ setSelectedAy }: Props) {
  return (
    <div className="lg:h-screen flex flex-col items-center justify-center py-12 px-6 bg-muted">
      <h1 className="text-3xl lg:text-4xl font-bold text-center tracking-tight">Choose Academic Year</h1>
      <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {academicYears.map((year) => (
          <div
            key={year.name}
            className="bg-white transition-transform hover:-translate-y-1 hover:shadow-lg border rounded-lg p-6">
            <h3 className="text-lg font-semibold">{year.label}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{year.description}</p>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {year.details.map((detail) => (
                <li key={detail} className="flex items-center gap-2 text-sm">
                  <CircleCheck className="h-4 w-4 text-green-600" />
                  {detail}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setSelectedAy(year.value)}
              variant={year.isUpcoming ? "default" : "outline"}
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
