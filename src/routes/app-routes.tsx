import AdminGuard from "@/components/auth/admin-guard";
import AdminUnauthenticatedGuard from "@/components/auth/admin-unauthenticated-guard";
import AuthGuard from "@/components/auth/auth-guard";
import UnauthenticatedGuard from "@/components/auth/unauthenticated-guard";
import ErrorPage from "@/components/error-page";
import AdminLayout from "@/components/layout/admin-layout";
import AdmissionLayout from "@/components/layout/admission";
import NewStudentLayout from "@/components/layout/new-student-layout";
import OldStudentLayout from "@/components/layout/old-student-layout";
import OpenHouseLayout from "@/components/layout/open-house/open-house-layout";
import ScrollToTop from "@/components/layout/scroll-to-top";
import CurrentLearnerLayout from "@/components/layout/vizschool/current-learner-layout";
import NewLearnerLayout from "@/components/layout/vizschool/new-learner-layout";
import ForgotPassword from "@/pages/auth/forgot-password";
import Login from "@/pages/auth/login";
import Registration from "@/pages/auth/Registration";
import UpdatePassword from "@/pages/auth/update-password";
import CreateParent from "@/pages/admin/create-parent";
import AdminLogin from "@/pages/admin/login";
import MoveStudent from "@/pages/admin/move-student";
import RecoveryLink from "@/pages/admin/recovery-link";
import ResetPassword from "@/pages/admin/reset-password";
import NotFound from "@/pages/not-found";
import AccountSettings from "@/pages/private/account-settings";
import AdmissionGuidelines from "@/pages/private/admission-guidelines";
import Dashboard from "@/pages/private/dashboard";
import Drafts from "@/pages/private/drafts";
import ApplicationSubmitted from "@/pages/private/enrol-student/application-submitted";
import EnrolStudent from "@/pages/private/enrol-student/enrol-student";
import EnrollmentInformation from "@/pages/private/enrol-student/new/enrollment-information";
import FamilyInformation from "@/pages/private/enrol-student/new/family-information";
import StudentInformation from "@/pages/private/enrol-student/new/student-information";
import UploadRequirements from "@/pages/private/enrol-student/new/upload-requirements";
import OldEnrollmentInformation from "@/pages/private/enrol-student/old/old-enrollment-information";
import OldFamilyInformation from "@/pages/private/enrol-student/old/old-family-information";
import OldStudentInformation from "@/pages/private/enrol-student/old/old-student-information";
import OldUploadRequirements from "@/pages/private/enrol-student/old/old-upload-requirements";
import ResidencyStatus from "@/pages/private/enrol-student/residency-status";
import STPGuidelines from "@/pages/private/enrol-student/stp-guidelines";
import CurrentEnrollmentInformation from "@/pages/private/enrol-student/vizschool/current/current-enrollment-information";
import CurrentFamilyInformation from "@/pages/private/enrol-student/vizschool/current/current-family-information";
import CurrentLearnerInformation from "@/pages/private/enrol-student/vizschool/current/current-learner-information";
import CurrentUploadRequirements from "@/pages/private/enrol-student/vizschool/current/current-upload-requirements";
import LearnerEnrollmentInformation from "@/pages/private/enrol-student/vizschool/new/learner-enrollment-information";
import LearnerFamilyInformation from "@/pages/private/enrol-student/vizschool/new/learner-family-information";
import LearnerInformation from "@/pages/private/enrol-student/vizschool/new/learner-information";
import LearnerUploadRequirements from "@/pages/private/enrol-student/vizschool/new/learner-upload-requirements";
import { Enrollment } from "@/pages/private/Enrollment";
import AccountInformation from "@/pages/private/open-house/application-form/account-information";
import OpenHouseEnrollmentInformation from "@/pages/private/open-house/application-form/open-house-enrollment-information";
import OpenHouseFamilyInformation from "@/pages/private/open-house/application-form/open-house-family-information";
import OpenHouseStudentInformation from "@/pages/private/open-house/application-form/open-house-student-information";
import OpenHouseUploadRequirements from "@/pages/private/open-house/application-form/open-house-upload-requirements";
import OpenHouseLanding from "@/pages/private/open-house/open-house-landing";
import RegistrationSubmitted from "@/pages/private/open-house/registration-submitted";
import PendingTasks from "@/pages/private/pending-tasks";
import { ReportCards } from "@/pages/private/report-cards";
import SingleEnrol from "@/pages/private/Single-enrol";
import StudentPhoto from "@/pages/private/student-photo";
import StudentProfile from "@/pages/private/student-profile";
import Uploaded from "@/pages/private/uploaded";
import CompleteEnrolment from "@/pages/public/complete-enrolment";
import Homepage from "@/pages/public/home-page";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <UnauthenticatedGuard>
              <Navigate to={"/login"} />
            </UnauthenticatedGuard>
          }
        />
        <Route
          path="/welcome"
          element={
            <UnauthenticatedGuard>
              <Homepage />
            </UnauthenticatedGuard>
          }
        />
        <Route
          path="/login"
          element={
            <UnauthenticatedGuard>
              <Login />
            </UnauthenticatedGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <UnauthenticatedGuard>
              <ForgotPassword />
            </UnauthenticatedGuard>
          }
        />
        <Route
          path="/update-password"
          element={
            <AuthGuard>
              <UpdatePassword />
            </AuthGuard>
          }
        />
        <Route
          path="/registration"
          element={
            <UnauthenticatedGuard>
              <Registration />
            </UnauthenticatedGuard>
          }
        />

        <Route
          path="/open-house-registration"
          element={
            <UnauthenticatedGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <OpenHouseLanding />
              </ErrorBoundary>
            </UnauthenticatedGuard>
          }
        />

        <Route
          path="/open-house/residency-status"
          element={
            <UnauthenticatedGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <ResidencyStatus />
              </ErrorBoundary>
            </UnauthenticatedGuard>
          }
        />

        <Route
          path="/open-house/stp-guidelines"
          element={
            <UnauthenticatedGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <STPGuidelines />
              </ErrorBoundary>
            </UnauthenticatedGuard>
          }
        />

        {/* Parent Routes */}
        <Route path="admission" element={<AdmissionLayout />}>
          <Route
            index
            path="dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />

          <Route
            path="report-cards"
            element={
              <AuthGuard>
                <ReportCards />
              </AuthGuard>
            }
          />

          <Route
            path="pending-tasks"
            element={
              <AuthGuard>
                <PendingTasks />
              </AuthGuard>
            }
          />

          <Route
            path="account-settings"
            element={
              <AuthGuard>
                <AccountSettings />
              </AuthGuard>
            }
          />

          <Route
            path="guidelines"
            element={
              <AuthGuard>
                <AdmissionGuidelines />
              </AuthGuard>
            }
          />

          <Route
            path="students/:id"
            element={
              <AuthGuard>
                <StudentProfile />
              </AuthGuard>
            }
          />

          <Route
            path="students/:id/photo"
            element={
              <AuthGuard>
                <StudentPhoto />
              </AuthGuard>
            }
          />

          <Route
            path="enrolments"
            element={
              <AuthGuard>
                <Enrollment />
              </AuthGuard>
            }></Route>

          <Route
            path="enrolments/:id"
            element={
              <AuthGuard>
                <SingleEnrol />
              </AuthGuard>
            }
          />

          <Route
            path="enrolments/application/:id"
            element={
              <AuthGuard>
                <Uploaded />
              </AuthGuard>
            }
          />

          <Route
            path="drafts"
            element={
              <AuthGuard>
                <Drafts />
              </AuthGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="enrol-student"
          element={
            <AuthGuard>
              <EnrolStudent />
            </AuthGuard>
          }
        />

        <Route
          path="enrol-student/residency-status"
          element={
            <AuthGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <ResidencyStatus />
              </ErrorBoundary>
            </AuthGuard>
          }
        />

        <Route
          path="enrol-student/stp-guidelines"
          element={
            <AuthGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <STPGuidelines />
              </ErrorBoundary>
            </AuthGuard>
          }
        />

        <Route element={<OldStudentLayout />}>
          <Route
            index
            path="/enrol-student/:id/student-info"
            element={
              <AuthGuard>
                <OldStudentInformation />
              </AuthGuard>
            }
          />
          <Route
            path="/enrol-student/:id/family-info"
            element={
              <AuthGuard>
                <OldFamilyInformation />
              </AuthGuard>
            }
          />
          <Route
            path="/enrol-student/:id/enrollment-info"
            element={
              <AuthGuard>
                <OldEnrollmentInformation />
              </AuthGuard>
            }
          />
          <Route
            path="/enrol-student/:id/documents"
            element={
              <AuthGuard>
                <OldUploadRequirements />
              </AuthGuard>
            }
          />
        </Route>

        <Route path="enrol-student/new" element={<NewStudentLayout />}>
          <Route
            path="student-info"
            element={
              <AuthGuard>
                <StudentInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="family-info"
            element={
              <AuthGuard>
                <FamilyInformation />
              </AuthGuard>
            }
          />
          <Route
            path="enrollment-info"
            element={
              <AuthGuard>
                <EnrollmentInformation />
              </AuthGuard>
            }
          />
          <Route
            path="upload-requirements"
            element={
              <AuthGuard>
                <UploadRequirements />
              </AuthGuard>
            }
          />
        </Route>

        {/* VizSchool */}
        <Route element={<CurrentLearnerLayout />}>
          <Route
            index
            path="/vizschool/enrol-student/:id/student-info"
            element={
              <AuthGuard>
                <CurrentLearnerInformation />
              </AuthGuard>
            }
          />
          <Route
            path="/vizschool/enrol-student/:id/family-info"
            element={
              <AuthGuard>
                <CurrentFamilyInformation />
              </AuthGuard>
            }
          />
          <Route
            path="/vizschool/enrol-student/:id/enrollment-info"
            element={
              <AuthGuard>
                <CurrentEnrollmentInformation />
              </AuthGuard>
            }
          />
          <Route
            path="/vizschool/enrol-student/:id/documents"
            element={
              <AuthGuard>
                <CurrentUploadRequirements />
              </AuthGuard>
            }
          />
        </Route>

        <Route path="vizschool/enrol-student/new" element={<NewLearnerLayout />}>
          <Route
            path="student-info"
            element={
              <AuthGuard>
                <LearnerInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="family-info"
            element={
              <AuthGuard>
                <LearnerFamilyInformation />
              </AuthGuard>
            }
          />
          <Route
            path="enrollment-info"
            element={
              <AuthGuard>
                <LearnerEnrollmentInformation />
              </AuthGuard>
            }
          />
          <Route
            path="upload-requirements"
            element={
              <AuthGuard>
                <LearnerUploadRequirements />
              </AuthGuard>
            }
          />
        </Route>

        {/* OPEN HOUSE */}
        <Route
          path="open-house"
          element={
            <UnauthenticatedGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <OpenHouseLayout />
              </ErrorBoundary>
            </UnauthenticatedGuard>
          }>
          <Route
            path="account-info"
            element={
              <UnauthenticatedGuard>
                <AccountInformation />
              </UnauthenticatedGuard>
            }
          />
          <Route
            path="student-info"
            element={
              <UnauthenticatedGuard>
                <OpenHouseStudentInformation />
              </UnauthenticatedGuard>
            }
          />
          <Route
            index
            path="family-info"
            element={
              <UnauthenticatedGuard>
                <OpenHouseFamilyInformation />
              </UnauthenticatedGuard>
            }
          />
          <Route
            path="enrollment-info"
            element={
              <UnauthenticatedGuard>
                <OpenHouseEnrollmentInformation />
              </UnauthenticatedGuard>
            }
          />
          <Route
            path="upload-requirements"
            element={
              <UnauthenticatedGuard>
                <OpenHouseUploadRequirements />
              </UnauthenticatedGuard>
            }
          />
        </Route>

        <Route
          path="/registration-submitted"
          element={
            <UnauthenticatedGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <ApplicationSubmitted />
              </ErrorBoundary>
            </UnauthenticatedGuard>
          }
        />

        <Route
          path="/application-submitted"
          element={
            <AuthGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <ApplicationSubmitted />
              </ErrorBoundary>
            </AuthGuard>
          }
        />

        <Route
          path="/open-house-registration-submitted"
          element={
            <UnauthenticatedGuard>
              <ErrorBoundary fallback={<ErrorPage />}>
                <RegistrationSubmitted />
              </ErrorBoundary>
            </UnauthenticatedGuard>
          }
        />
        {/* Admin */}
        <Route
          path="/admin/login"
          element={
            <AdminUnauthenticatedGuard>
              <AdminLogin />
            </AdminUnauthenticatedGuard>
          }
        />
        <Route path="admin" element={<AdminLayout />}>
          <Route
            path="move-student"
            element={
              <AdminGuard>
                <MoveStudent />
              </AdminGuard>
            }
          />
          <Route
            path="reset-password"
            element={
              <AdminGuard>
                <ResetPassword />
              </AdminGuard>
            }
          />
          <Route
            path="create-parent"
            element={
              <AdminGuard>
                <CreateParent />
              </AdminGuard>
            }
          />
          <Route
            path="recovery-link"
            element={
              <AdminGuard>
                <RecoveryLink />
              </AdminGuard>
            }
          />
        </Route>

        {/* Public — token-gated, no login required */}
        <Route
          path="/complete-enrolment/:token"
          element={
            <ErrorBoundary fallback={<ErrorPage />}>
              <CompleteEnrolment />
            </ErrorBoundary>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
