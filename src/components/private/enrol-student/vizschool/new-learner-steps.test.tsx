/**
 * Step-lock reachability for the VizSchool new-learner wizard — the same derived-reachability
 * rule as new-student-steps.tsx, on the flow that shares the tab-state store. VizSchool has no
 * medical requirement, so studentInfo validity is studentDetails + addressContact only.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewLearnerSteps from "./new-learner-steps";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentTabStateStore } from "@/zustand-store";

const navigateSpy = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => navigateSpy };
});

const STUDENT_INFO = "/vizschool/enrol-student/new/student-info";
const FAMILY_INFO = "/vizschool/enrol-student/new/family-info";
const ENROLLMENT_INFO = "/vizschool/enrol-student/new/enrollment-info";
const UPLOAD_REQUIREMENTS = "/vizschool/enrol-student/new/upload-requirements";

beforeEach(() => {
  resetEnrolmentStores();
  navigateSpy.mockClear();
});

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

describe("new-learner-steps.tsx — step reachability", () => {
  it("unlocks Student Information on a draft where completedTabs lost it", async () => {
    seedFormState("vizschool-new", {
      studentInfo: { studentDetails: { isValid: true } }, // addressContact never confirmed
      familyInfo: { motherInfo: { isValid: true }, fatherInfo: { isValid: true } },
      enrollmentInfo: { isValid: true },
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { isValid: true },
      },
    });
    useEnrolNewStudentTabStateStore.setState({
      currentTab: ENROLLMENT_INFO,
      activeTab: ENROLLMENT_INFO,
      completedTabs: [FAMILY_INFO, ENROLLMENT_INFO, UPLOAD_REQUIREMENTS],
    });

    const user = userEvent.setup();
    renderForm(<NewLearnerSteps />, { flow: "vizschool-new" });

    expect(isLocked(step(/student information/i))).toBe(false);

    await user.click(step(/student information/i));
    expect(navigateSpy).toHaveBeenCalledWith(expect.stringContaining(STUDENT_INFO));
  });

  it("keeps later steps locked on a brand-new application", () => {
    seedFormState("vizschool-new", {});
    useEnrolNewStudentTabStateStore.setState({
      currentTab: STUDENT_INFO,
      activeTab: STUDENT_INFO,
      completedTabs: [],
    });

    renderForm(<NewLearnerSteps />, { flow: "vizschool-new" });

    expect(isLocked(step(/student information/i))).toBe(false);
    expect(isLocked(step(/family information/i))).toBe(true);
    expect(isLocked(step(/upload requirements/i))).toBe(true);
  });

  it("does not lock a step the old rule already allowed", () => {
    seedFormState("vizschool-new", {});
    useEnrolNewStudentTabStateStore.setState({
      currentTab: UPLOAD_REQUIREMENTS,
      activeTab: UPLOAD_REQUIREMENTS,
      completedTabs: [UPLOAD_REQUIREMENTS],
    });

    renderForm(<NewLearnerSteps />, { flow: "vizschool-new" });

    expect(isLocked(step(/upload requirements/i))).toBe(false);
  });
});

/**
 * The green/red/numbered badge is derived from the form data, so a draft whose `completedTabs`
 * log is missing an entry still reads correctly. The log keeps one job: separating a step that
 * was never touched from one that was submitted and has since gone incomplete.
 */
describe("new-learner-steps.tsx — badge state", () => {
  it("shows a step as complete when its data is valid but the log never recorded it", () => {
    seedFormState("vizschool-new", { studentInfo: { studentDetails: { isValid: true }, addressContact: { isValid: true } } });
    useEnrolNewStudentTabStateStore.setState({
      currentTab: "/vizschool/enrol-student/new/family-info",
      activeTab: "/vizschool/enrol-student/new/family-info",
      completedTabs: [],
    });

    renderForm(<NewLearnerSteps />, { flow: "vizschool-new" });

    expect(badge(step(/student information/i))).toBe("complete");
  });

  it("still flags a submitted step whose data is no longer valid", () => {
    seedFormState("vizschool-new", {});
    useEnrolNewStudentTabStateStore.setState({
      currentTab: "/vizschool/enrol-student/new/family-info",
      activeTab: "/vizschool/enrol-student/new/family-info",
      completedTabs: ["/vizschool/enrol-student/new/family-info"],
    });

    renderForm(<NewLearnerSteps />, { flow: "vizschool-new" });

    expect(badge(step(/family information/i))).toBe("invalid");
  });

  it("leaves an untouched incomplete step as a plain numbered badge", () => {
    seedFormState("vizschool-new", {});
    useEnrolNewStudentTabStateStore.setState({
      currentTab: "/vizschool/enrol-student/new/student-info",
      activeTab: "/vizschool/enrol-student/new/student-info",
      completedTabs: [],
    });

    renderForm(<NewLearnerSteps />, { flow: "vizschool-new" });

    expect(badge(step(/upload requirements/i))).toBe("pending");
  });
});
