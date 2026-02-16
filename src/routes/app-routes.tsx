import AuthGuard from "@/components/auth/auth-guard";
import UnauthenticatedGuard from "@/components/auth/unauthenticated-guard";
import ErrorPage from "@/components/error-page";
import AdmissionLayout from "@/components/layout/admission";
import NewStudentLayout from "@/components/layout/new-student-layout";
import OldStudentLayout from "@/components/layout/old-student-layout";
import ScrollToTop from "@/components/layout/scroll-to-top";
import CurrentLearnerLayout from "@/components/layout/vizschool/current-learner-layout";
import NewLearnerLayout from "@/components/layout/vizschool/new-learner-layout";
import ForgotPassword from "@/pages/auth/forgot-password";
import Login from "@/pages/auth/login";
import Registration from "@/pages/auth/Registration";
import UpdatePassword from "@/pages/auth/update-password";
import NotFound from "@/pages/not-found";
import AdmissionGuidelines from "@/pages/private/admission-guidelines";
import Dashboard from "@/pages/private/dashboard";
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
import PendingTasks from "@/pages/private/pending-tasks";
import SingleEnrol from "@/pages/private/Single-enrol";
import StudentPhoto from "@/pages/private/student-photo";
import StudentProfile from "@/pages/private/student-profile";
import Uploaded from "@/pages/private/uploaded";
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
            path="pending-tasks"
            element={
              <AuthGuard>
                <PendingTasks />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
