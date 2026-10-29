// Mirrors the SIS parent events API (lib/events/parent.ts and lib/events/form.ts in the SIS repo).
// The SIS is the source of truth: change it there first.

export type QuestionType = "info" | "short" | "long" | "pick_one" | "tick_many" | "number" | "date" | "signature";

export type EventQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  help: string;
  required: boolean;
  imageUrl: string | null;
  choices: string[];
  allowOther: boolean;
  agreement: string;
  showWhen: { questionId: string; equals: string } | null;
};

export type EventSection = {
  id: string;
  title: string;
  description: string;
  scope: "child" | "family";
  allowingOnly: boolean;
  questions: EventQuestion[];
};

export type EventForm = { sections: EventSection[] };

export type Consent = "allowing" | "not_allowing";
export type AnswerValue = string | string[] | number | null;
export type Answers = Record<string, AnswerValue>;

export type ParentStatus = "registered" | "not_joining" | "not_registered";

export const STATUS_LABELS: Record<ParentStatus, string> = {
  registered: "Registered",
  not_joining: "Not joining",
  not_registered: "Not registered yet",
};

export type ParentChildStatus = {
  studentNumber: string;
  name: string;
  status: ParentStatus;
};

export type ParentEventRow = {
  slug: string;
  title: string;
  startsOn: string;
  endsOn: string | null;
  timeLabel: string;
  venue: string;
  scopeLabel: string;
  closesAt: string;
  canRegister: boolean;
  children: ParentChildStatus[];
};

export type ParentEventList = {
  open: ParentEventRow[];
  mine: ParentEventRow[];
  academicYears: string[];
  currentAy: string;
};

export type ParentEventDetail = {
  event: ParentEventRow & {
    description: string;
    answerMode: "consent" | "register";
  };
  form: EventForm;
  children: {
    studentNumber: string;
    name: string;
    levelLabel: string;
    className: string;
    /** False for a child shown only because they answered earlier; the SIS refuses them on save. */
    canRegister: boolean;
  }[];
  submission: {
    parentName: string;
    parentPhone: string;
    familyAnswers: Answers;
    signatureName: string | null;
    signedAt: string | null;
  } | null;
  registrations: Record<
    string,
    {
      status: "registered" | "not_joining";
      reason: string | null;
      answers: Answers;
    }
  >;
  prefill: { parentName: string; parentPhone: string };
};

export type RegistrationBody = {
  parentName: string;
  parentPhone: string;
  children: {
    studentNumber: string;
    consent: Consent;
    reason?: string;
    answers: Answers;
  }[];
  familyAnswers: Answers;
  signatureName?: string;
};

export type SaveRegistrationResponse = { savedAt: string };
