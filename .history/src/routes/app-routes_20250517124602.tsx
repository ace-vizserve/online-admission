import AuthGuard from "@/components/auth/auth-guard";
import UnauthenticatedGuard from "@/components/auth/unauthenticated-guard";
import AdmissionLayout from "@/components/layout/admission";
import NewStudentLayout from "@/components/layout/new-student-layout";
import OldStudentLayout from "@/components/layout/old-student-layout";
// import UploadFiles from "@/components/private/uploaded/upload-files";
import ForgotPassword from "@/pages/auth/forgot-password";
import Login from "@/pages/auth/login";
import Registration from "@/pages/auth/Registration";
import UpdatePassword from "@/pages/auth/update-password";
import NotFound from "@/pages/not-found";
import { Checkout } from "@/pages/private/Checkout";
import Dashboard from "@/pages/private/dashboard";
import Documents from "@/pages/private/documents";
import ApplicationSubmitted from "@/pages/private/enrol-student/application-submitted";
import EnrolStudent from "@/pages/private/enrol-student/enrol-student";
import EnrollmentInformation from "@/pages/private/enrol-student/new/enrollment-information";
import FamilyInformation from "@/pages/private/enrol-student/new/family-information";
import StudentInformation from "@/pages/private/enrol-student/new/student-information";
import UploadRequirements from "@/pages/private/enrol-student/new/upload-requiremts";
import OldEnrollmentInformation from "@/pages/private/enrol-student/old/old-enrollment-information";
import OldFamilyInformation from "@/pages/private/enrol-student/old/old-family-information";
import OldStudentInformation from "@/pages/private/enrol-student/old/old-student-information";
import OldUploadRequirements from "@/pages/private/enrol-student/old/old-upload-requirements";
import { Enrollment } from "@/pages/private/Enrollment";
import { Files } from "@/pages/private/files";
import { SchoolYear } from "@/pages/private/school-year";
import SingleEnrol from "@/pages/private/Single-enrol";
import StudentProfile from "@/pages/private/student-profile";
import Uploaded from "@/pages/private/uploaded";
import Homepage from "@/pages/public/home-page";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

function AppRoutes() {
  return (
    <BrowserRouter>
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
          path="/checkout"
          element={
            <UnauthenticatedGuard>
              <Checkout />
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
            index
            path="students/:id"
            element={
              <AuthGuard>
                <StudentProfile />
              </AuthGuard>
            }
          />

          <Route
            index
            path="enrolment"
            element={
              <AuthGuard>
                <Enrollment />
              </AuthGuard>
            }
          />

          <Route
            index
            path="single-student/:id"
            element={
              <AuthGuard>
                <SingleEnrol />
              </AuthGuard>
            }
          />

          <Route
            index
            path="documents"
            element={
              <AuthGuard>
                <Documents />
              </AuthGuard>
            }
          />

          <Route
            index
            path="uploaded-documents/:id"
            element={
              <AuthGuard>
                <UploadFiles />
              </AuthGuard>
            }
          />

          <Route
            index
            path="student-file/:id"
            element={
              <AuthGuard>
                <Files />
              </AuthGuard>
            }
          />

          <Route
            index
            path="document-file/:id"
            element={
              <AuthGuard>
                <Uploaded />
              </AuthGuard>
            }
          />

          <Route
            index
            path="documents/student-enrolment/:id"
            element={
              <AuthGuard>
                <SchoolYear />
              </AuthGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          index
          path="enrol-student"
          element={
            <AuthGuard>
              <EnrolStudent />
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
            index
            path="/enrol-student/:id/family-info"
            element={
              <AuthGuard>
                <OldFamilyInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="/enrol-student/:id/enrollment-info"
            element={
              <AuthGuard>
                <OldEnrollmentInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="/enrol-student/:id/documents"
            element={
              <AuthGuard>
                <OldUploadRequirements />
              </AuthGuard>
            }
          />
        </Route>

        <Route element={<NewStudentLayout />}>
          <Route
            index
            path="/enrol-student/new/student-info"
            element={
              <AuthGuard>
                <StudentInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="/enrol-student/new/family-info"
            element={
              <AuthGuard>
                <FamilyInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="/enrol-student/new/enrollment-info"
            element={
              <AuthGuard>
                <EnrollmentInformation />
              </AuthGuard>
            }
          />
          <Route
            index
            path="/enrol-student/new/upload-requirements"
            element={
              <AuthGuard>
                <UploadRequirements />
              </AuthGuard>
            }
          />
        </Route>

        <Route
          index
          path="/application-submitted"
          element={
            <AuthGuard>
              <ApplicationSubmitted />
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
