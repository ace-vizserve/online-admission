import AuthGuard from "@/components/auth/auth-guard";
import UnauthenticatedGuard from "@/components/auth/unauthenticated-guard";
import Login from "@/pages/auth/login";
import Registration from "@/pages/auth/Registration";
import { Checkout } from "@/pages/private/Checkout";
import Dashboard from "@/pages/private/dashboard";
import Homepage from "@/pages/public/home-page";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={"/login"} />} />
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
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
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
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
