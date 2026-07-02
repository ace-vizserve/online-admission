import discountPriceTag from "@/assets/discount-codes/july-discounts-ay2026.png";
import enrollmentProcess from "@/assets/enrollment-process.webp";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Stepper, { Step } from "@/components/ui/stepper";
import { Info, Maximize2, Phone } from "lucide-react";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/styles.min.css";

type Props = {
  academicYear: string;
  setShowEnrollmentProcess: (value: boolean) => void;
};

export default function EnrollmentStepper({ setShowEnrollmentProcess, academicYear }: Props) {
  const phone = "+65 8200 0062";

  const ContactInfo = () => (
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-transparent p-4 transition-all hover:shadow-sm">
      <div className="rounded-full bg-primary p-2 text-white shadow-lg shadow-blue-200">
        <Phone className="size-4" />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-primary font-black">Admissions Officer</p>

        <div className="flex items-center space-x-2">
          <p className="text-sm font-semibold text-slate-900">
            Ms. Charlene <span className="text-slate-300 mx-2 font-light">|</span>
            <a href={`tel:${phone}`} className="text-primary hover:underline">
              {phone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Stepper
      className="mx-auto w-full max-w-4xl px-2 py-12"
      initialStep={1}
      onFinalStepCompleted={() => setShowEnrollmentProcess(false)}
      hideStepIndicators
      backButtonText="Go Back"
      nextButtonText="Proceed to Next Step">
      {/* Step 1: Enrollment Process */}
      <Step>
        <div className="space-y-8 py-4">
          <div className="text-center sm:text-left">
            <h2 className="text-primary text-3xl font-black tracking-tight ">Your Enrolment Process</h2>
            <p className="mt-2 text-slate-500 font-medium">
              Review the official timeline and steps for the {academicYear.split("y")[1]} school year.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <InnerImageZoom hideCloseButton src={enrollmentProcess} className="w-full h-auto rounded-2xl" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-lg backdrop-blur-md">
              <Maximize2 className="size-3 text-primary" />
              <span className="text-[9px] md:text-xs"> Click or Tap to Zoom</span>
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

      <Step>
        <div className="space-y-8 py-4">
          <div className="text-center sm:text-left">
            <h2 className="text-primary text-3xl font-black tracking-tight ">Promos & Discounts</h2>
            <p className="mt-2 text-slate-500 font-medium">
              Important terms and conditions regarding school fees and eligibility
            </p>
          </div>

          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger className="group relative outline-none">
                <div className="rounded-xl bg-slate-50 p-4 transition-all group-hover:bg-slate-100">
                  <img
                    src={discountPriceTag}
                    alt="Discount Promo"
                    className="max-h-64 md:max-h-80 w-auto rounded-2xl shadow-lg transition-all duration-500 group-hover:rotate-1 group-hover:scale-105"
                  />
                </div>
                <div className="absolute -right-1 -top-1 flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white">
                  <Maximize2 className="size-4 stroke-3" />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-none p-3 sm:rounded-xl">
                <img src={discountPriceTag} alt="Discount Promo" className="w-full rounded-2xl" />
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
            <div className="flex gap-3">
              <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />

              <p className="text-sm leading-relaxed text-amber-900 font-medium">
                I/We understand that failure to meet the stated terms or to settle payments on time will result in the
                forfeiture of any applicable promos or discounts.
              </p>
            </div>
          </div>

          <ContactInfo />
        </div>
      </Step>
    </Stepper>
  );
}
