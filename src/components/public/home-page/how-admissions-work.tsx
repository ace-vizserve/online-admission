import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { features } from "@/data";
import { ArrowUpRight } from "lucide-react";

function HowAdmissionsWork() {
  return (
    <div className="w-full flex items-center justify-center py-12 md:py-16 lg:py-20">
      <MaxWidthWrapper>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">How Admissions Work</h2>
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col border rounded-xl py-6 px-5">
              <div className="mb-3 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                <feature.icon className="h-6 w-6" />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-1 text-foreground/80 text-[15px]">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="py-14 md:py-10 w-max ml-auto">
          <Button className="gap-2" variant={"secondary"}>
            See admission requirements <ArrowUpRight />
          </Button>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}

export default HowAdmissionsWork;
