import discountPriceTag from "@/assets/discount-codes/sept-discounts-promo-tac.webp";
import enrollmentProcess from "@/assets/enrollment-process.webp";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Stepper, { Step } from "@/components/ui/stepper";
import "inner-image-zoom/lib/styles.min.css";
import { Copy, Info, Phone } from "lucide-react";
import InnerImageZoom from "react-inner-image-zoom";
import { toast } from "sonner";

type Props = {
  academicYear: string;
  setShowEnrollmentProcess: (value: boolean) => void;
};

export default function EnrollmentStepper({ setShowEnrollmentProcess, academicYear }: Props) {
  const phone = "+65 8200 0062";

  async function copyPhoneNumber() {
    try {
      await navigator.clipboard.writeText(phone);
      toast.info("Phone number copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  const ContactInfo = () => (
    <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
      <div className="rounded-full bg-primary/20 p-2 text-primary">
        <Phone className="size-4" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Need Help?</p>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium leading-none">
            Ms. Charlene <span className="text-muted-foreground mx-1">|</span>
            <span className="text-primary font-bold">{phone}</span>
          </p>
          <Copy onClick={copyPhoneNumber} className="hidden lg:flex size-4 cursor-pointer" />
        </div>
      </div>
    </div>
  );

  return (
    <Stepper
      className="mx-auto w-full max-w-3xl"
      initialStep={1}
      onFinalStepCompleted={() => setShowEnrollmentProcess(false)}
      hideStepIndicators
      backButtonText="Previous"
      nextButtonText="Acknowledge & Next">
      {/* Step 1: Enrollment Process */}
      <Step>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-primary">Enrollment Process</h2>
            <p className="text-sm font-medium">
              Review the official timeline and steps for Academic Year {academicYear.split("y")[1]}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border bg-white transition-all">
            <InnerImageZoom hideCloseButton src={enrollmentProcess} className="w-full h-auto rounded-lg" />

            <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
              Click to Zoom
            </div>
          </div>

          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
            <div className="flex gap-3">
              <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-amber-900 font-medium">
                I/We acknowledge that I/we have read and understood the enrolment process. I/We agree to follow the
                steps and requirements as outlined.
              </p>
            </div>
          </div>

          <ContactInfo />
        </div>
      </Step>

      {/* Step 2: Terms & Discounts */}
      <Step>
        <div className="space-y-6 py-4 mt-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-primary">Promos & Discounts</h2>
            <p className="text-sm font-medium">Important terms and conditions regarding school fees and eligibility</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Dialog>
              <DialogTrigger>
                <div className="relative">
                  <img
                    src={discountPriceTag}
                    alt="Discount Promo"
                    className="max-h-64 md:max-h-80 w-auto rounded-lg shadow-lg transition-transform hover:scale-[1.02]"
                  />

                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                    Click to Zoom
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="!max-w-xl pt-10 md:pt-12">
                <img src={discountPriceTag} alt="Discount Promo" className="w-full h-auto rounded-lg" />
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
            <div className="flex gap-3">
              <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-amber-900 font-medium">
                I/We understand that failure to meet the stated terms or to settle payments on time will result in the{" "}
                <strong>forfeiture</strong> of any applicable promos or discounts.
              </p>
            </div>
          </div>

          <ContactInfo />
        </div>
      </Step>
    </Stepper>
  );
}
