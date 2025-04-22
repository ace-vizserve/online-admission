import AuthGuard from "@/components/auth/auth-guard";
import UnauthenticatedGuard from "@/components/auth/unauthenticated-guard";
import AdmissionLayout from "@/components/layout/admission";
import ForgotPassword from "@/pages/auth/forgot-password";
import Login from "@/pages/auth/login";
import Registration from "@/pages/auth/Registration";
import { Checkout } from "@/pages/private/Checkout";
import Dashboard from "@/pages/private/dashboard";
import StudentProfile from "@/pages/private/student-profile";
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
          {/* <Route path="enrollment" element={<Enrollment />} />
  <Route path="documents" element={<Documents />} /> */}

          <Route path="*" element={<h1>404 Page not found</h1>} />
        </Route>

        <Route path="*" element={<h1>404 Page not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
