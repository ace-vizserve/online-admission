import Logo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import VizSchoolLogo from "@/components/vizschool-logo";
import { useParentAcademicYears } from "@/hooks/use-parent-academic-years";
import { academicYearCards } from "@/lib/parent-academic-years";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { memo, useMemo } from "react";

const PROGRAM_LOGO = { hfse: Logo, vizschool: VizSchoolLogo } as const;

/**
 * Column count at `lg` and up, by number of cards. Three is the layout the page has always had; one and two
 * are narrowed so a lone card does not stretch across the screen; four goes two-by-two before four across.
 * Literal class names so Tailwind generates them.
 */
const GRID_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1 max-w-md",
  2: "lg:grid-cols-2 max-w-4xl",
  3: "lg:grid-cols-3 max-w-(--breakpoint-xl)",
  4: "lg:grid-cols-2 xl:grid-cols-4 max-w-(--breakpoint-xl)",
};

type Props = {
  setSelectedAy: (schoolYear: string) => void;
};

const AcademicYearSelector = memo(function ({ setSelectedAy }: Props) {
  // The SIS's open years, or today's hardcoded ones while it loads / if it fails — never an empty screen.
  const { years } = useParentAcademicYears();
  const academicYears = useMemo(
    () => academicYearCards(years).map((card) => ({ ...card, logo: PROGRAM_LOGO[card.program] })),
    [years],
  );

  return (
    <div className="animate-in fade-in duration-500 relative min-h-screen flex items-center justify-center flex-col px-4 py-12 md:py-16 lg:py-0">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Choose Academic Year</h1>
        <p className="text-lg md:text-xl text-muted-foreground text-pretty">
          Select the academic year for your child's enrolment journey
        </p>
      </div>
      <div
        className={cn(
          "mt-8 md:mt-12 w-full mx-auto grid grid-cols-1 items-center gap-8",
          GRID_COLUMNS[Math.min(Math.max(academicYears.length, 1), 4)],
        )}>
        {academicYears.map((year) => (
          <div
            key={year.value}
            className={cn(
              "relative bg-card transition-all duration-300 border border-border rounded-xl p-8 flex flex-col",
              {
                "border-2 border-secondary shadow-md lg:py-12 order-first lg:order-none":
                  year.isPopular && !year.isClosed,
                "hover:shadow-md": !year.isClosed,
                "bg-muted/20 border-border opacity-75 grayscale-[0.5] cursor-not-allowed select-none": year.isClosed,
              },
            )}>
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
