import { Bell, CheckCircle, FilePlus, FileText, Upload, UserPlus } from "lucide-react";

export const HOME_PAGE_TITLE_DESCRIPTION = {
  title: "HFSE International School | Online Admissions Portal",
  description:
    "Start your child’s journey at HFSE International School. Create a parent account, submit requirements, and manage applications through our secure online admissions portal.",
};

export const APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION = {
  title: "Application Submitted | HFSE International School",
  description:
    "Your child’s application has been successfully submitted. Log in anytime to track the status or upload additional documents through the HFSE Admissions Portal.",
};

export const REGISTRATION_PAGE_TITLE_DESCRIPTION = {
  title: "Create Parent Account | HFSE Admissions Portal",
  description:
    "Register for a parent account to begin your child’s application at HFSE International School. Upload required documents and track enrolment progress with ease.",
};

export const FORGOT_PASSWORD_TITLE_DESCRIPTION = {
  title: "Reset Password | HFSE Admissions Portal",
  description:
    "Forgot your password? Reset it here to regain access to your HFSE Parent Account and continue managing your child’s enrolment.",
};

export const UPDATE_PASSWORD_TITLE_DESCRIPTION = {
  title: "Update Password | HFSE Admissions Portal",
  description:
    "Securely update your HFSE Parent Account password. Keep your account protected while managing your child’s online enrolment and application requirements.",
};

export const STUDENT_PROFILE_TITLE_DESCRIPTION = {
  title: "Student Profile | HFSE International School",
  description:
    "View your child’s personal details, enrolment information, and submitted documents through the HFSE Online Admissions Portal.",
};

export const ENROL_NEW_STUDENT_TITLE_DESCRIPTION = {
  title: "Enrol a Student | HFSE International School",
  description:
    "Begin a new student enrolment at HFSE International School. Complete the required information and upload documents for review.",
};

export const ENROL_NEW_STUDENT_STUDENT_INFORMATION_TITLE_DESCRIPTION = {
  title: "Student Information | Enrolment | HFSE International School",
  description:
    "Enter your child’s personal details to begin the enrolment process at HFSE. Ensure accuracy for a smooth application experience.",
};

export const ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION = {
  title: "Family Information | Enrolment | HFSE International School",
  description: "Provide parent or guardian details to support your child’s admission at HFSE International School.",
};

export const ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION = {
  title: "Enrolment Information | Enrolment | HFSE International School",
  description: "Provide enrolment details to proceed with your child’s application at HFSE International School.",
};

export const ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION = {
  title: "Upload Documents | Enrolment | HFSE International School",
  description:
    "Submit required documents such as academic records and identification to complete your child’s enrolment at HFSE.",
};

export const ENROLMENT_PAGE_FOR_STUDENT = {
  title: "Student Enrolment Records | HFSE International School",
  description:
    "Browse historical enrolment records from HFSE International School. Discover insights into our growing and diverse student community.",
};

export const faq = [
  {
    question: "How do I start the admission process?",
    answer:
      "Create a parent account on the HFSE Admissions Portal. Once registered, you can add your child’s details, upload the required documents, and track the application status.",
  },
  {
    question: "What documents are required for enrolment?",
    answer:
      "Required documents may vary by grade level but generally include: birth certificate, recent report card, certificate of good moral character, ID photo, and other relevant academic records.",
  },
  {
    question: "Can I apply for more than one child?",
    answer:
      "Yes! After creating your parent account, you can add multiple children and manage their applications individually from your dashboard.",
  },
  {
    question: "How will I know if my child's application is complete?",
    answer:
      "Your dashboard will show the status of each document. You’ll also receive notifications if anything is missing or requires revision.",
  },
  {
    question: "What if I don’t have all the required documents yet?",
    answer:
      "You can begin the application and upload the documents you have. You may return later to complete the upload before the deadline.",
  },
  {
    question: "Is there an admission deadline?",
    answer:
      "Yes. HFSE follows an academic calendar. Enrolment periods and deadlines will be posted on the portal and sent to you via email upon registration.",
  },
];

export const features = [
  {
    icon: UserPlus,
    title: "Create a Parent Account",
    description: "Sign up to begin the admissions process and manage your child's application with ease.",
  },
  {
    icon: FilePlus,
    title: "Add Student Information",
    description: "Enter essential details about your child including grade level, previous school, and more.",
  },
  {
    icon: Upload,
    title: "Upload Admission Requirements",
    description: "Securely submit necessary documents such as birth certificates, report cards, and ID photos.",
  },
  {
    icon: FileText,
    title: "Track Application Status",
    description: "Monitor your child’s progress in real time and receive updates on missing or verified documents.",
  },
  {
    icon: Bell,
    title: "Get Notified Instantly",
    description: "Receive alerts when documents are approved or additional information is required.",
  },
  {
    icon: CheckCircle,
    title: "Complete Enrolment",
    description:
      "Once all requirements are fulfilled, finalize your child’s admission and prepare for their learning journey.",
  },
];

export const applicationTypes = [
  "New Student Pass Application",
  "New STP Application (Current HFSE Student)",
  "Student Pass Transfer Application",
];

export const maritalStatuses = [
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Separated", value: "Separated" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed", value: "Widowed" },
] as const;

export const studentPassTypes = [
  { label: "Singaporean", value: "Singaporean" },
  { label: "Singapore PR", value: "Singapore PR" },
  { label: "Dependent Pass", value: "Dependent Pass" },
  { label: "Student Pass", value: "Student Pass" },
  { label: "Long Term Visit Pass", value: "Long Term Visit Pass" },
] as const;

export const parentGuardianPassTypes = [
  { label: "E-PASS", value: "E-PASS" },
  { label: "S-PASS", value: "S-PASS" },
  { label: "Dependent Pass", value: "Dependent Pass" },
  { label: "Permanent Resident", value: "Permanent Resident" },
  { label: "Other", value: "Other" },
] as const;

export const religions = [
  { label: "Christianity", value: "Christianity" },
  { label: "Roman Catholic", value: "Roman Catholic" },
  { label: "Islam", value: "Islam" },
  { label: "Hinduism", value: "Hinduism" },
  { label: "Buddhism", value: "Buddhism" },
  { label: "Judaism", value: "Judaism" },
  { label: "Other", value: "Other" },
] as const;

export const classLevels = [
  {
    label: "YoungStarter Little Star",
    value: "YoungStarter Little Star",
  },
  {
    label: "YoungStarter Junior Star",
    value: "YoungStarter Junior Star",
  },

  { label: "Primary One", value: "Primary One" },
  { label: "Primary Two", value: "Primary Two" },
  { label: "Primary Three", value: "Primary Three" },
  { label: "Primary Four", value: "Primary Four" },
  { label: "Primary Five", value: "Primary Five" },
  { label: "Primary Six", value: "Primary Six" },

  { label: "Secondary One", value: "Secondary One" },
  { label: "Secondary Two", value: "Secondary Two" },
  { label: "Secondary Three", value: "Secondary Three" },
  { label: "Secondary Four", value: "Secondary Four" },

  {
    label: "HFSE Global Education Programme – Year 1 (equivalent to K2)",
    value: "HFSE Global Education Programme – Year 1 (equivalent to K2)",
  },
  {
    label: "HFSE Global Education Programme – Year 2 (equivalent to Primary One)",
    value: "HFSE Global Education Programme – Year 2 (equivalent to Primary One)",
  },
  {
    label: "HFSE Global Education Programme - Primary 2",
    value: "HFSE Global Education Programme - Primary 2",
  },
  {
    label: "HFSE Global Education Programme - Primary 3",
    value: "HFSE Global Education Programme - Primary 3",
  },
  {
    label: "HFSE Global Education Programme - Primary 4",
    value: "HFSE Global Education Programme - Primary 4",
  },
  {
    label: "HFSE Global Education Programme - Primary 5",
    value: "HFSE Global Education Programme - Primary 5",
  },
  {
    label: "HFSE Global Education Programme - Primary 6",
    value: "HFSE Global Education Programme - Primary 6",
  },
  {
    label: "HFSE Global Education Programme – Year 8",
    value: "HFSE Global Education Programme – Year 8",
  },
  {
    label: "HFSE Global Education Programme – Year 9",
    value: "HFSE Global Education Programme – Year 9",
  },
  {
    label: "HFSE Global Education Programme – Year 10",
    value: "HFSE Global Education Programme – Year 10",
  },
] as const;

export const vizSchoolClassLevels = [
  { label: "Primary One", value: "Primary One" },
  { label: "Primary Two", value: "Primary Two" },
  { label: "Primary Three", value: "Primary Three" },
  { label: "Primary Four", value: "Primary Four" },
  { label: "Primary Five", value: "Primary Five" },
  { label: "Primary Six", value: "Primary Six" },
  { label: "Secondary One", value: "Secondary One" },
  { label: "Secondary Two", value: "Secondary Two" },
  { label: "Secondary Three", value: "Secondary Three" },
  { label: "Secondary Four", value: "Secondary Four" },
] as const;

export const classTypes = [
  { label: "Enrichment Class", value: "Enrichment Class" },
  { label: "Global Class (CAMBRIDGE)", value: "Global Class (CAMBRIDGE)" },
  { label: "Global Class 3 (ENGLISH + FRENCH)", value: "Global Class 3 (ENGLISH + FRENCH)" },
  { label: "Global Class 2 (ENGLISH + TAMIL)", value: "Global Class 2 (ENGLISH + TAMIL)" },
  { label: "Global Class 1 (ENGLISH + MANDARIN)", value: "Global Class 1 (ENGLISH + MANDARIN)" },
  { label: "Standard Class (ENGLISH + TAGALOG)", value: "Standard Class (ENGLISH + TAGALOG)" },
] as const;

export const PRIMARY_CLASS_LEVELS = [
  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",
  "HFSE Global Education Programme – Year 2 (equivalent to Primary One)",
  "HFSE Global Education Programme - Primary 2",
  "HFSE Global Education Programme - Primary 3",
  "HFSE Global Education Programme - Primary 4",
  "HFSE Global Education Programme - Primary 5",
  "HFSE Global Education Programme - Primary 6",
];

export const SECONDARY_SDF_CLASS_LEVELS = [
  "Secondary One",
  "Secondary Two",
  "Secondary Three",
  "Secondary Four",
  "HFSE Global Education Programme – Year 8",
  "HFSE Global Education Programme – Year 9",
  "HFSE Global Education Programme – Year 10",
];

export const campusDevelopmentFee = [
  { label: "Option 1 – Full payment (S$1,350 upfront)", value: "Option 1" },
  { label: "Option 2 – Partial + Monthly (S$250 + S$100/mo)", value: "Option 2" },
  { label: "Option 3 – Monthly only (S$125/mo)", value: "Option 3" },
] as const;

export const campusDevelopmentFeeSecondary = [
  { label: "Option 1 – Full payment (S$1,350 upfront)", value: "Option 1" },
  { label: "Option 2 – Partial + Monthly (S$250 + S$100/mo)", value: "Option 2" },
  { label: "Option 3 – Monthly only (S$125/mo)", value: "Option 3" },
] as const;

export const campusDevelopmentFeePrimary = [
  { label: "Option 1: Full Payment (SGD 1050 UPFRONT)", value: "Option 1" },
  { label: "Option 2: Partial (SGD 250 + SGD 75/mo)", value: "Option 2" },
  { label: "Option 3: Monthly Only (SGD 100/mo)", value: "Option 3" },
] as const;

export const medicalConditions = [
  { id: "allergies", label: "Allergies", requiresDetails: true },
  { id: "asthma", label: "Asthma" },
  { id: "heartConditions", label: "Heart Conditions" },
  { id: "epilepsy", label: "Epilepsy / Seizures" },
  { id: "diabetes", label: "Diabetes" },
  { id: "eczema", label: "Eczema / Skin Conditions" },
  { id: "foodAllergies", label: "Food Allergies", requiresDetails: true },
  { id: "other", label: "Other Medical Condition", requiresDetails: true },
  { id: "none", label: "None of the above" },
];

export const preferredPaymentScheme = [
  { label: "Annual (Full Payment)", value: "Annual (Full Payment)" },
  { label: "Quarterly Payment", value: "Quarterly Payment" },
  { label: "Monthly Payment", value: "Monthly Payment" },
] as const;

export const preferredPaymentMethod = [
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "GIRO", value: "GIRO" },
  { label: "Credit/Debit Card ( 3% platform fee)", value: "Credit/Debit Card Payment" },
] as const;
