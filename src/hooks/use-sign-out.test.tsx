import { useSignOut } from "@/hooks/use-sign-out";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";

const logout = vi.fn(async () => {});
vi.mock("@/actions/auth", () => ({ userLogout: () => logout() }));

function LoginProbe() {
  const location = useLocation();
  return <p>Login state: {JSON.stringify(location.state)}</p>;
}

let signOut: () => Promise<void> = async () => {};
function Page() {
  signOut = useSignOut();
  return <p>Student page</p>;
}

describe("useSignOut", () => {
  it("signs out, forgets cached data and goes to login with nothing remembered", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["student-profile", "E1"], { name: "Previous family" });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/admission/students/X"]}>
          <Routes>
            <Route path="/admission/students/:id" element={<Page />} />
            <Route path="/login" element={<LoginProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await act(() => signOut());

    expect(logout).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(["student-profile", "E1"])).toBeUndefined();
    expect(screen.getByText("Login state: null")).toBeTruthy();
  });
});
