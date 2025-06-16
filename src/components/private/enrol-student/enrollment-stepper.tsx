import Stepper, { Step } from "@/components/ui/stepper";

type Props = {
  setShowEnrollmentProcess: (value: boolean) => void;
};

export default function EnrollmentStepper({ setShowEnrollmentProcess }: Props) {
  return (
    <Stepper
      className="mx-auto w-full max-w-3xl"
      initialStep={1}
      onFinalStepCompleted={() => setShowEnrollmentProcess(false)}
      backButtonText="Previous"
      nextButtonText="Next">
      <Step>
        <div className="text-center space-y-8">
          <h2 className="text-balance text-2xl md:text-3xl font-bold">📘 HFSE Online Enrolment Process</h2>
          <p className="text-sm md:text-base text-balance -tracking-tighter">
            Welcome to the HFSE Online Admission Portal! Please follow the steps to complete your child’s enrolment.
          </p>
        </div>
      </Step>

      <Step>
        <div className="text-center space-y-8">
          <h2 className="text-balance text-2xl md:text-3xl font-bold">📝 Step 1 – Fill Out the Enrolment Form</h2>
          <p className="text-sm md:text-base text-balance -tracking-tighter">
            Provide accurate student, academic, and family details. Ensure all required fields are completed.
          </p>
        </div>
      </Step>

      <Step>
        <div className="space-y-8">
          <h2 className="text-balance text-center text-2xl md:text-3xl font-bold">
            📄 Step 2 – Upload Required Documents
          </h2>
          <div className="w-full -tracking-tighter space-y-4">
            <div className="text-sm md:text-base space-y-2">
              <p className="font-semibold">🧒 Student Documents</p>
              <p>
                Please prepare the following documents for your child: ID picture, birth certificate, pass type with a
                valid expiry date, and passport information. The education certificate and medical examination form may
                be submitted at a later time.
              </p>
            </div>
            <div className="text-sm md:text-base space-y-2">
              <p className="font-semibold">👨‍👩‍👧 Parent/Guardian Documents</p>
              <p>
                Parents or guardians are required to submit their pass type and passport information, both showing valid
                expiry dates.
              </p>
            </div>
          </div>
        </div>
      </Step>

      <Step>
        <div className="space-y-8">
          <h2 className="text-balance text-2xl md:text-3xl text-center font-bold">
            🎁 Promo & Discount Terms and Conditions
          </h2>
          <div className="space-y-3">
            <p className="text-sm md:text-base -tracking-tighter">
              Promotions and discounts are valid only for the selected academic year and may vary based on the enrollee
              type (new or current). All requirements must be met before the deadline and are subject to Admissions Team
              approval.
            </p>

            <p className="text-sm md:text-base -tracking-tighter">
              Please note that incomplete submissions or false information may result in the forfeiture of any
              applicable discount.
            </p>
          </div>
          <p className="mt-3 text-xs md:text-sm text-muted-foreground">
            For promo inquiries, you may contact us at:
            <br />
            <strong>admissions@hfse.edu.sg</strong> or <strong>documents.admissions.hfse@gmail.com</strong>
          </p>
        </div>
      </Step>

      <Step>
        <div className="space-y-8">
          <h2 className="text-balance text-center text-2xl md:text-3xl font-bold">✅ Acknowledge Enrolment Process</h2>
          <p className="text-sm md:text-base -tracking-tighter">
            By continuing, you confirm that you have read and understood the enrolment process, including all
            requirements, steps, and applicable terms.
          </p>
        </div>
      </Step>
    </Stepper>
  );
}
