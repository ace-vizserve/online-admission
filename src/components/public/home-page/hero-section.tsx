import students from "@/assets/landing-page/students.png";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, StepForwardIcon } from "lucide-react";

function HeroSection() {
  return (
    <div className="py-12 lg:py-0 w-full lg:h-screen lg:max-h-[750px] flex items-center justify-center overflow-hidden">
      <MaxWidthWrapper className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="my-auto">
          <Badge variant={"outline"}>Just released v1.0.0</Badge>
          <h1 className="mt-6 max-w-[17ch] text-4xl md:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold !leading-[1.2] tracking-tight">
            Apply, track, and manage your child’s admission documents—all in one place
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg">
            Explore a collection of Shadcn UI blocks and components, ready to preview and copy. Streamline your
            development workflow with easy-to-implement examples.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <Button size="lg" className=" text-base">
              Enroll now <ArrowUpRight className="!h-5 !w-5" />
            </Button>
            <Button variant="outline" size="lg" className=" text-base shadow-none">
              Continue Application
              <StepForwardIcon className="!h-5 !w-5" />
            </Button>
          </div>
        </div>
        <div className="w-full aspect-video lg:aspect-auto lg:h-full bg-accent rounded-xl">
          <img src={students} alt="HFSE International School Students" className="object-cover h-auto w-full" />
        </div>
      </MaxWidthWrapper>
    </div>
  );
}

export default HeroSection;
