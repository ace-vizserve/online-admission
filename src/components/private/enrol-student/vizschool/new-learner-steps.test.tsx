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
