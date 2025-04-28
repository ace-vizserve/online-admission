import { Bell, CheckCircle, FilePlus, FileText, Upload, UserPlus } from "lucide-react";

export const HOME_PAGE_TITLE_DESCRIPTION = {
  title: "HFSE International School | Online Admissions Portal",
  description:
    "Apply to HFSE International School online. Create a parent account, submit requirements, and manage your child’s admission with our secure digital portal.",
};

export const ABOUT_PAGE_TITLE_DESCRIPTION = {
  title: "About HFSE International School | Learn Our Mission & Vision",
  description:
    "Discover HFSE International School’s commitment to delivering high-quality K–12 education through innovative, student-centered online learning.",
};

export const ADMISSION_PAGE_TITLE_DESCRIPTION = {
  title: "HFSE Admission Requirements | Documents Needed for Enrollment",
  description:
    "View all the necessary documents and information needed to enroll your child at HFSE International School through our streamlined digital admissions process.",
};

export const FAQ_PAGE_TITLE_DESCRIPTION = {
  title: "HFSE Admissions FAQ | Common Questions Answered",
  description:
    "Get quick answers to frequently asked questions about the HFSE online admission process, parent accounts, required documents, and more.",
};

export const CONTACT_US_PAGE_TITLE_DESCRIPTION = {
  title: "Contact HFSE Admissions | Reach Out to Our Support Team",
  description:
    "Need help with your child’s application? Contact the HFSE Admissions team for assistance with account setup, document submission, or enrollment questions.",
};

export const LOGIN_PAGE_TITLE_DESCRIPTION = {
  title: "Parent Login | HFSE Online Admissions Portal",
  description:
    "Log in to your HFSE parent account to continue your child’s application, upload required documents, and monitor admission status.",
};

export const PARENTS_DASHBOARD_TITLE_DESCRIPTION = {
  title: "Parent Dashboard | Manage Your HFSE Admissions",
  description:
    "Access your personalized HFSE Admissions dashboard to manage student profiles, upload documents, receive notifications, and track your child’s enrollment progress.",
};

export const FORGOT_PASSWORD_TITLE_DESCRIPTION = {
  title: "Reset Your Password | HFSE International School Admissions",
  description:
    "Forgot your password? Reset it here to regain access to your HFSE Parent Portal and continue managing your child's admission and enrollment requirements.",
};

export const USER_DASHBOARD_TITLE_DESCRIPTION = {
  title: "Parent Dashboard | HFSE International School Online Admission",
  description:
    "Access and manage your child’s enrollment requirements with ease through the HFSE Online Admission Parent Dashboard. Upload documents, track application status, and stay updated—all in one place.",
};

export const PARENT_PORTAL_REGISTRATION = {
  title: "Parent Portal Registration | HFSE Admissions Portal",
  description:
    "Create your parent account to start the HFSE admissions process. Fill out the registration form, upload required documents, and manage your child’s application easily.",
};

export const STUDENT_PROFILE_TITLE_DESCRIPTION = {
  title: "Student Profile | HFSE International School Online Admission",
  description:
    "View and update your child’s personal information, enrollment details, and submitted documents through the HFSE Online Admission Student Profile page.",
};

export const ENROL_NEW_STUDENT_TITLE_DESCRIPTION = {
  title: "Enrol a Student | HFSE International School Online Admission",
  description:
    "Complete the enrollment process for a new student. Fill in the necessary details, provide documents, and submit the application for review.",
};

export const ENROL_NEW_STUDENT_STUDENT_INFORMATION_TITLE_DESCRIPTION = {
  title: "Student Information - Enrol New Student | HFSE International School Online Admission",
  description:
    "Provide student details to begin the enrollment process. Ensure all information is accurate and up-to-date.",
};

export const ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION = {
  title: "Family Information - Enrol New Student | HFSE International School Online Admission",
  description:
    "Enter family and guardian information. This helps us understand your child's support system for a smooth enrollment.",
};

export const ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION = {
  title: "Enrollment Information - Enrol New Student | HFSE International School Online Admission",
  description:
    "Provide the student's academic history to complete the enrollment. This includes previous schooling details and more.",
};

export const ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION = {
  title: "Upload Requirements - Enrol New Student | HFSE International School Online Admission",
  description:
    "Submit all necessary documents to complete the enrollment. Upload academic, identification, and other required files.",
};

export const ENROL_NEW_STUDENT_REVIEW_SUBMIT_TITLE_DESCRIPTION = {
  title: "Review & Submit - Enrol New Student | HFSE International School Online Admission",
  description:
    "Review all the information entered before submitting. Make sure everything is correct for a smooth enrollment process.",
};

export const faq = [
  {
    question: "How do I start the admission process?",
    answer:
      "Create a parent account on the HFSE Admissions Portal. Once registered, you can add your child’s details, upload the required documents, and track the application status.",
  },
  {
    question: "What documents are required for enrollment?",
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
      "Yes. HFSE follows an academic calendar. Enrollment periods and deadlines will be posted on the portal and sent to you via email upon registration.",
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
    title: "Complete Enrollment",
    description:
      "Once all requirements are fulfilled, finalize your child’s admission and prepare for their learning journey.",
  },
];

export const maritalStatuses = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Separated", value: "separated" },
  { label: "Divorced", value: "divorced" },
  { label: "Widowed", value: "widowed" },
] as const;

export const passTypes = [
  { label: "Singaporean", value: "singaporean" },
  { label: "Singaporean PR", value: "singapore_pr" },
  { label: "Dependant Pass", value: "dependant_pass" },
  { label: "Student Pass", value: "student_pass" },
  { label: "Long Term Visit Pass", value: "ltv_pass" },
] as const;

export const religions = [
  { label: "Christianity", value: "christianity" },
  { label: "Roman Catholic", value: "romanCatholic" },
  { label: "Islam", value: "islam" },
  { label: "Hinduism", value: "hinduism" },
  { label: "Buddhism", value: "buddhism" },
  { label: "Judaism", value: "judaism" },
  { label: "Other", value: "other" },
] as const;

export const classLevels = [
  { label: "Young Starters", value: "young-starters" },
  { label: "Primary 1", value: "primary-1" },
  { label: "Primary 2", value: "primary-2" },
  { label: "Primary 3", value: "primary-3" },
  { label: "Primary 4", value: "primary-4" },
  { label: "Primary 5", value: "primary-5" },
  { label: "Primary 6", value: "primary-6" },
  { label: "Secondary 1", value: "secondary-1" },
  { label: "Secondary 2", value: "secondary-2" },
  { label: "Secondary 3", value: "secondary-3" },
  { label: "Secondary 4", value: "secondary-4" },
] as const;

export const classTypes = [
  { label: "Enrichment Class", value: "enrichment-class" },
  { label: "Global Class 3 (ENGLISH + FRENCH)", value: "global-class-3-en-fr" },
  { label: "Global Class 2 (ENGLISH + TAMIL)", value: "global-class-2-en-ta" },
  { label: "Global Class 1 (ENGLISH + MANDARIN)", value: "global-class-1-en-zh" },
  { label: "Standard Class (ENGLISH + TAGALOG)", value: "standard-class-en-fil" },
] as const;

export const preferredSchedule = [
  { label: "Afternoon", value: "afternoon" },
  { label: "Morning", value: "morning" },
] as const;

export const campusDevelopmentFee = [
  { label: "Option 1", value: "option-1" },
  { label: "Option 2", value: "option-2" },
  { label: "Option 3", value: "option-3" },
] as const;

export const languages = [
  { label: "Afar", value: "aa" },
  { label: "Abkhazian", value: "ab" },
  { label: "Afrikaans", value: "af" },
  { label: "Akan", value: "ak" },
  { label: "Amharic", value: "am" },
  { label: "Arabic", value: "ar" },
  { label: "Aragonese", value: "an" },
  { label: "Assamese", value: "as" },
  { label: "Avaric", value: "av" },
  { label: "Avestan", value: "ae" },
  { label: "Aymara", value: "ay" },
  { label: "Azerbaijani", value: "az" },
  { label: "Bashkir", value: "ba" },
  { label: "Belarusian", value: "be" },
  { label: "Bulgarian", value: "bg" },
  { label: "Bihari", value: "bh" },
  { label: "Bislama", value: "bi" },
  { label: "Bambara", value: "bm" },
  { label: "Bengali", value: "bn" },
  { label: "Tibetan", value: "bo" },
  { label: "Breton", value: "br" },
  { label: "Bosnian", value: "bs" },
  { label: "Catalan", value: "ca" },
  { label: "Chechen", value: "ce" },
  { label: "Chamorro", value: "ch" },
  { label: "Corsican", value: "co" },
  { label: "Cree", value: "cr" },
  { label: "Czech", value: "cs" },
  { label: "Church Slavic", value: "cu" },
  { label: "Chuvash", value: "cv" },
  { label: "Welsh", value: "cy" },
  { label: "Danish", value: "da" },
  { label: "German", value: "de" },
  { label: "Divehi", value: "dv" },
  { label: "Dzongkha", value: "dz" },
  { label: "Ewe", value: "ee" },
  { label: "Greek", value: "el" },
  { label: "English", value: "en" },
  { label: "Esperanto", value: "eo" },
  { label: "Spanish", value: "es" },
  { label: "Estonian", value: "et" },
  { label: "Basque", value: "eu" },
  { label: "Persian", value: "fa" },
  { label: "Fulah", value: "ff" },
  { label: "Finnish", value: "fi" },
  { label: "Fijian", value: "fj" },
  { label: "Faroese", value: "fo" },
  { label: "French", value: "fr" },
  { label: "Western Frisian", value: "fy" },
  { label: "Irish", value: "ga" },
  { label: "Gaelic", value: "gd" },
  { label: "Galician", value: "gl" },
  { label: "Guarani", value: "gn" },
  { label: "Gujarati", value: "gu" },
  { label: "Manx", value: "gv" },
  { label: "Hausa", value: "ha" },
  { label: "Hebrew", value: "he" },
  { label: "Hindi", value: "hi" },
  { label: "Hiri Motu", value: "ho" },
  { label: "Croatian", value: "hr" },
  { label: "Haitian", value: "ht" },
  { label: "Hungarian", value: "hu" },
  { label: "Armenian", value: "hy" },
  { label: "Herero", value: "hz" },
  { label: "Interlingua", value: "ia" },
  { label: "Indonesian", value: "id" },
  { label: "Interlingue", value: "ie" },
  { label: "Igbo", value: "ig" },
  { label: "Sichuan Yi", value: "ii" },
  { label: "Inupiaq", value: "ik" },
  { label: "Ido", value: "io" },
  { label: "Icelandic", value: "is" },
  { label: "Italian", value: "it" },
  { label: "Inuktitut", value: "iu" },
  { label: "Japanese", value: "ja" },
  { label: "Javanese", value: "jv" },
  { label: "Georgian", value: "ka" },
  { label: "Kongo", value: "kg" },
  { label: "Kikuyu", value: "ki" },
  { label: "Kuanyama", value: "kj" },
  { label: "Kazakh", value: "kk" },
  { label: "Kalaallisut", value: "kl" },
  { label: "Khmer", value: "km" },
  { label: "Kannada", value: "kn" },
  { label: "Korean", value: "ko" },
  { label: "Kanuri", value: "kr" },
  { label: "Kashmiri", value: "ks" },
  { label: "Kurdish", value: "ku" },
  { label: "Komi", value: "kv" },
  { label: "Cornish", value: "kw" },
  { label: "Kirghiz", value: "ky" },
  { label: "Latin", value: "la" },
  { label: "Luxembourgish", value: "lb" },
  { label: "Ganda", value: "lg" },
  { label: "Limburgan", value: "li" },
  { label: "Lingala", value: "ln" },
  { label: "Lao", value: "lo" },
  { label: "Lithuanian", value: "lt" },
  { label: "Luba-Katanga", value: "lu" },
  { label: "Latvian", value: "lv" },
  { label: "Malagasy", value: "mg" },
  { label: "Marshallese", value: "mh" },
  { label: "Maori", value: "mi" },
  { label: "Macedonian", value: "mk" },
  { label: "Malayalam", value: "ml" },
  { label: "Mongolian", value: "mn" },
  { label: "Marathi", value: "mr" },
  { label: "Malay", value: "ms" },
  { label: "Maltese", value: "mt" },
  { label: "Burmese", value: "my" },
  { label: "Nauru", value: "na" },
  { label: "Norwegian Bokmål", value: "nb" },
  { label: "North Ndebele", value: "nd" },
  { label: "Nepali", value: "ne" },
  { label: "Ndonga", value: "ng" },
  { label: "Dutch", value: "nl" },
  { label: "Norwegian Nynorsk", value: "nn" },
  { label: "Norwegian", value: "no" },
  { label: "South Ndebele", value: "nr" },
  { label: "Navajo", value: "nv" },
  { label: "Chichewa", value: "ny" },
  { label: "Occitan", value: "oc" },
  { label: "Ojibwa", value: "oj" },
  { label: "Oromo", value: "om" },
  { label: "Oriya", value: "or" },
  { label: "Ossetian", value: "os" },
  { label: "Panjabi", value: "pa" },
  { label: "Pali", value: "pi" },
  { label: "Polish", value: "pl" },
  { label: "Pashto", value: "ps" },
  { label: "Portuguese", value: "pt" },
  { label: "Quechua", value: "qu" },
  { label: "Romansh", value: "rm" },
  { label: "Rundi", value: "rn" },
  { label: "Romanian", value: "ro" },
  { label: "Russian", value: "ru" },
  { label: "Kinyarwanda", value: "rw" },
  { label: "Sanskrit", value: "sa" },
  { label: "Sardinian", value: "sc" },
  { label: "Sindhi", value: "sd" },
  { label: "Northern Sami", value: "se" },
  { label: "Sango", value: "sg" },
  { label: "Sinhala", value: "si" },
  { label: "Slovak", value: "sk" },
  { label: "Slovenian", value: "sl" },
  { label: "Samoan", value: "sm" },
  { label: "Shona", value: "sn" },
  { label: "Somali", value: "so" },
  { label: "Albanian", value: "sq" },
  { label: "Serbian", value: "sr" },
  { label: "Swati", value: "ss" },
  { label: "Sotho, Southern", value: "st" },
  { label: "Sundanese", value: "su" },
  { label: "Swedish", value: "sv" },
  { label: "Swahili", value: "sw" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Tajik", value: "tg" },
  { label: "Thai", value: "th" },
  { label: "Tigrinya", value: "ti" },
  { label: "Turkmen", value: "tk" },
  { label: "Tagalog", value: "tl" },
  { label: "Tswana", value: "tn" },
  { label: "Tonga", value: "to" },
  { label: "Turkish", value: "tr" },
  { label: "Tsonga", value: "ts" },
  { label: "Tatar", value: "tt" },
  { label: "Twi", value: "tw" },
  { label: "Tahitian", value: "ty" },
  { label: "Uighur", value: "ug" },
  { label: "Ukrainian", value: "uk" },
  { label: "Urdu", value: "ur" },
  { label: "Uzbek", value: "uz" },
  { label: "Venda", value: "ve" },
  { label: "Vietnamese", value: "vi" },
  { label: "Volapük", value: "vo" },
  { label: "Walloon", value: "wa" },
  { label: "Wolof", value: "wo" },
  { label: "Xhosa", value: "xh" },
  { label: "Yiddish", value: "yi" },
  { label: "Yoruba", value: "yo" },
  { label: "Zhuang", value: "za" },
  { label: "Chinese", value: "zh" },
  { label: "Zulu", value: "zu" },
] as const;
