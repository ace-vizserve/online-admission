import AuthGuard from "@/components/auth/auth-guard";
import UnauthenticatedGuard from "@/components/auth/unauthenticated-guard";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

let session: { user: { email: string } } | null = null;
vi.mock("@/hooks/use-session", () => ({ default: () => ({ session, passwordResetState: false }) }));
vi.mock("@/config/admin", () => ({ ADMIN_EMAILS: ["admin@hfse.test"] }));

function App({ start, state }: { start: string; state?: unknown }) {
  return (
    <MemoryRouter initialEntries={[{ pathname: start, state }]}>
      <Routes>
        <Route
          path="/login"
          element={
            <UnauthenticatedGuard>
              <p>Login page</p>
            </UnauthenticatedGuard>
          }
        />
        <Route path="/admission/dashboard" element={<p>Dashboard</p>} />
        <Route path="/admin/move-student" element={<p>Admin</p>} />
        <Route
          path="/admission/students/:id"
          element={
            <AuthGuard>
              <p>Student profile</p>
            </AuthGuard>
          }
        />
        <Route
          path="/admission/services/events/:slug"
          element={
            <AuthGuard>
              <p>Event form</p>
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  session = null;
});

describe("Return to the requested page after login", () => {
  it("sends a signed-out parent to login, then back to the event once they sign in", () => {
    const { rerender } = render(<App start="/admission/services/events/trip" />);
    expect(screen.getByText("Login page")).toBeTruthy();

    session = { user: { email: "parent@example.com" } };
    rerender(<App start="/admission/services/events/trip" />);
    expect(screen.getByText("Event form")).toBeTruthy();
  });

  it("goes back to the page asked for once signed in", () => {
    session = { user: { email: "parent@example.com" } };
    render(<App start="/login" state={{ from: "/admission/services/events/trip" }} />);
    expect(screen.getByText("Event form")).toBeTruthy();
  });

  it("goes to the dashboard when nothing was asked for, or the path is not a portal page", () => {
    session = { user: { email: "parent@example.com" } };
    const { unmount } = render(<App start="/login" />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
    unmount();
    render(<App start="/login" state={{ from: "//evil.example.com/x" }} />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("sends the next person to the dashboard after a sign-out on another family's page", () => {
    session = { user: { email: "first@example.com" } };
    const { rerender } = render(<App start="/admission/students/X" />);
    expect(screen.getByText("Student profile")).toBeTruthy();

    session = null;
    rerender(<App start="/admission/students/X" />);
    expect(screen.getByText("Login page")).toBeTruthy();

    session = { user: { email: "second@example.com" } };
    rerender(<App start="/admission/students/X" />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("keeps sending admins to their own page", () => {
    session = { user: { email: "admin@hfse.test" } };
    render(<App start="/login" state={{ from: "/admission/services/events/trip" }} />);
    expect(screen.getByText("Admin")).toBeTruthy();
  });
});
