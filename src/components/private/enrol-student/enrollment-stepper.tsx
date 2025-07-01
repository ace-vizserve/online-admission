import discountPriceTag from "@/assets/discounts-promo-tac.webp";
import enrollmentProcess from "@/assets/enrollment-process.webp";
import Stepper, { Step } from "@/components/ui/stepper";
import "inner-image-zoom/lib/styles.min.css";
import InnerImageZoom from "react-inner-image-zoom";

type Props = {
  academicYear: string;
  setShowEnrollmentProcess: (value: boolean) => void;
};

export default function EnrollmentStepper({ setShowEnrollmentProcess, academicYear }: Props) {
  return (
    <Stepper
      className="mx-auto w-full max-w-3xl"
      initialStep={1}
      onFinalStepCompleted={() => setShowEnrollmentProcess(false)}
      hideStepIndicators
      backButtonText="Previous"
      nextButtonText="Next">
      <Step>
        <div className="space-y-4">
          <div className="w-full md:w-11/12 mx-auto">
            <InnerImageZoom hideCloseButton src={enrollmentProcess} className="w-full h-auto rounded-md" />
          </div>
          <p className="text-sm text-balance -tracking-tighter">
            I/We acknowledge that I/we have read and understood the enrolment process for Academic Year{" "}
            {academicYear.split("y")[1]} at HFSE International School. I/We agree to follow the steps and requirements
            as outlined.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            For inquiries and clarification, please contact our Admissions Officer:
            <br />
            <strong>Ms. Gael at +65 8200 0062</strong>
          </p>
        </div>
      </Step>

      <Step>
        <div className="space-y-4">
          <img src={discountPriceTag} className="max-h-72 md:max-h-96 mx-auto w-max object-cover" />

          <p className="text-sm text-balance -tracking-tighter">
            I/We acknowledge that I/we have read and understood the terms and conditions of the school’s promos and
            discounts. I/We understand that failure to meet the stated terms or to settle payments on time will result
            in the forfeiture of any applicable promos or discounts.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            For inquiries and clarification, please contact our Admissions Officer:
            <br />
            <strong>Ms. Gael at +65 8200 0062</strong>
          </p>
        </div>
      </Step>
    </Stepper>
  );
}
