/**
 * Step-lock reachability for the HFSE-IS new-student wizard.
 *
 * Regression cover for a parent whose resumed draft had `student-info` missing from
 * `completedTabs` while `currentTab` had already advanced past it — which made step 1
 * permanently unclickable, with no code path able to restore it (`setCompletedTabs` only
 * ever adds, and resume restores the array verbatim).
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewStudentSteps from "./new-student-steps";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentTabStateStore } from "@/zustand-store";

const navigateSpy = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => navigateSpy };
});

const STUDENT_INFO = "/enrol-student/new/student-info";
const FAMILY_INFO = "/enrol-student/new/family-info";
const ENROLLMENT_INFO = "/enrol-student/new/enrollment-info";
const UPLOAD_REQUIREMENTS = "/enrol-student/new/upload-requirements";

const VALID_STUDENT = {
  studentDetails: { isValid: true },
  addressContact: { isValid: true },
  medicalInformation: { isValid: true },
};
const VALID_FAMILY = { motherInfo: { isValid: true }, fatherInfo: { isValid: true } };
const VALID_UPLOADS = {
  studentUploadRequirements: { isValid: true },
  parentGuardianUploadRequirements: { isValid: true },
};

beforeEach(() => {
  resetEnrolmentStores();
  navigateSpy.mockClear();
});

function seedTabs(state: { currentTab: string; activeTab: string; completedTabs: string[] }) {
  useEnrolNewStudentTabStateStore.setState(state);
}

function step(name: RegExp) {
  return screen.getByText(name).closest("li")!;
}

function isLocked(el: HTMLElement) {
  return el.className.includes("cursor-not-allowed");
}

function badge(el: HTMLElement) {
  const cls = el.querySelector("svg")?.getAttribute("class") ?? "";
  if (cls.includes("lucide-check")) return "complete";
  if (cls.includes("lucide-circle-alert")) return "invalid";
  return "pending";
}

describe("new-student-steps.tsx — step reachability", () => {
  it("unlocks Student Information on a draft where completedTabs lost it", async () => {
    // The reported state: steps 2-4 completed, currentTab past step 1, student data incomplete.
    seedFormState("hfse-new", {
      studentInfo: { studentDetails: { isValid: true }, addressContact: { isValid: true } },
      familyInfo: VALID_FAMILY,
      enrollmentInfo: { isValid: true },
      uploadRequirements: VALID_UPLOADS,
    });
    seedTabs({
      currentTab: ENROLLMENT_INFO,
      activeTab: ENROLLMENT_INFO,
      completedTabs: [FAMILY_INFO, ENROLLMENT_INFO, UPLOAD_REQUIREMENTS],
    });

    const user = userEvent.setup();
    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(isLocked(step(/student information/i))).toBe(false);

    await user.click(step(/student information/i));
    expect(navigateSpy).toHaveBeenCalledWith(expect.stringContaining(STUDENT_INFO));
  });

  it("keeps later steps locked on a brand-new application", () => {
    seedFormState("hfse-new", {});
    seedTabs({ currentTab: STUDENT_INFO, activeTab: STUDENT_INFO, completedTabs: [] });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(isLocked(step(/student information/i))).toBe(false);
    expect(isLocked(step(/family information/i))).toBe(true);
    expect(isLocked(step(/enrolment information/i))).toBe(true);
    expect(isLocked(step(/upload requirements/i))).toBe(true);
  });

  it("opens exactly the next step once Student Information is valid", () => {
    seedFormState("hfse-new", { studentInfo: VALID_STUDENT });
    seedTabs({ currentTab: STUDENT_INFO, activeTab: STUDENT_INFO, completedTabs: [] });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(isLocked(step(/student information/i))).toBe(false);
    expect(isLocked(step(/family information/i))).toBe(false);
    expect(isLocked(step(/enrolment information/i))).toBe(true);
  });

  it("does not lock a step the old rule already allowed", () => {
    // completedTabs claims upload-requirements even though its data is absent — the previous
    // rule allowed clicking it, so the new rule must not take that away.
    seedFormState("hfse-new", {});
    seedTabs({
      currentTab: UPLOAD_REQUIREMENTS,
      activeTab: UPLOAD_REQUIREMENTS,
      completedTabs: [UPLOAD_REQUIREMENTS],
    });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(isLocked(step(/upload requirements/i))).toBe(false);
  });

  it("unlocks every step once the whole form is valid", () => {
    seedFormState("hfse-new", {
      studentInfo: VALID_STUDENT,
      familyInfo: VALID_FAMILY,
      enrollmentInfo: { isValid: true },
      uploadRequirements: VALID_UPLOADS,
    });
    seedTabs({ currentTab: UPLOAD_REQUIREMENTS, activeTab: UPLOAD_REQUIREMENTS, completedTabs: [] });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    for (const name of [/student information/i, /family information/i, /enrolment information/i, /upload requirements/i]) {
      expect(isLocked(step(name))).toBe(false);
    }
  });
});

/**
 * The green/red/numbered badge is derived from the form data, so a draft whose `completedTabs`
 * log is missing an entry still reads correctly. The log keeps one job: separating a step that
 * was never touched from one that was submitted and has since gone incomplete.
 */
describe("new-student-steps.tsx — badge state", () => {
  it("shows a step as complete when its data is valid but the log never recorded it", () => {
    seedFormState("hfse-new", { studentInfo: VALID_STUDENT });
    useEnrolNewStudentTabStateStore.setState({
      currentTab: "/enrol-student/new/family-info",
      activeTab: "/enrol-student/new/family-info",
      completedTabs: [],
    });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(badge(step(/student information/i))).toBe("complete");
  });

  it("still flags a submitted step whose data is no longer valid", () => {
    seedFormState("hfse-new", {});
    useEnrolNewStudentTabStateStore.setState({
      currentTab: "/enrol-student/new/family-info",
      activeTab: "/enrol-student/new/family-info",
      completedTabs: ["/enrol-student/new/family-info"],
    });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(badge(step(/family information/i))).toBe("invalid");
  });

  it("leaves an untouched incomplete step as a plain numbered badge", () => {
    seedFormState("hfse-new", {});
    useEnrolNewStudentTabStateStore.setState({
      currentTab: "/enrol-student/new/student-info",
      activeTab: "/enrol-student/new/student-info",
      completedTabs: [],
    });

    renderForm(<NewStudentSteps />, { flow: "hfse-new" });

    expect(badge(step(/upload requirements/i))).toBe("pending");
  });
});
