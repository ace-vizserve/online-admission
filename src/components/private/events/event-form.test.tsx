import { SisError } from "@/lib/sis";
import EventFormPage from "@/pages/private/services/event-form";
import type { ParentEventDetail, RegistrationBody } from "@/types/events";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

let detail: ParentEventDetail;
let saveError: unknown = null;
const saved: RegistrationBody[] = [];

vi.mock("@/hooks/use-events", () => ({
  useEvent: () => ({ data: detail, isPending: false, error: null }),
  useSaveRegistration: () => ({
    isPending: false,
    mutate: (body: RegistrationBody, opts: { onSuccess?: () => void; onError?: (e: unknown) => void }) => {
      saved.push(body);
      if (saveError) opts.onError?.(saveError);
      else opts.onSuccess?.();
    },
  }),
}));

function fixture(): ParentEventDetail {
  return {
    event: {
      slug: "trip",
      title: "Educational Field Trip",
      startsOn: "2026-11-20",
      endsOn: null,
      timeLabel: "8:15 am – 12:15 pm",
      venue: "Mint Museum of Toys",
      scopeLabel: "Primary",
      closesAt: "2026-11-13T09:00:00.000Z",
      canRegister: true,
      children: [],
      description: "",
      answerMode: "consent",
    },
    form: {
      sections: [
        {
          id: "trip",
          title: "Trip details",
          description: "",
          scope: "child",
          allowingOnly: true,
          questions: [
            q({ id: "allergy", type: "short", label: "Food allergies", required: true }),
            q({ id: "shadow", type: "pick_one", label: "Shadow teacher?", choices: ["Yes", "No"] }),
            q({
              id: "shadowName",
              type: "short",
              label: "Name of the shadow teacher",
              required: true,
              showWhen: { questionId: "shadow", equals: "Yes" },
            }),
          ],
        },
        {
          id: "sign",
          title: "Sign",
          description: "",
          scope: "family",
          allowingOnly: false,
          questions: [q({ id: "sig", type: "signature", label: "E-signature", required: true, agreement: "I agree." })],
        },
      ],
    },
    children: [
      { studentNumber: "S1", name: "Ian Louise Lim", levelLabel: "P3", className: "Courtesy", canRegister: true },
      { studentNumber: "S2", name: "Mia Lim", levelLabel: "P1", className: "Kindness", canRegister: true },
    ],
    submission: null,
    registrations: {},
    prefill: { parentName: "Sheila Lim", parentPhone: "9123 4567" },
  };
}

function q(over: Partial<ParentEventDetail["form"]["sections"][number]["questions"][number]>) {
  return {
    id: "q",
    type: "short" as const,
    label: "Q",
    help: "",
    required: false,
    imageUrl: null,
    choices: [],
    allowOther: false,
    agreement: "",
    showWhen: null,
    ...over,
  };
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admission/services/events/trip"]}>
      <Routes>
        <Route path="/admission/services/events/:slug" element={<EventFormPage />} />
        <Route path="/admission/services/events" element={<p>Events list</p>} />
        <Route path="/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>,
  );

function LoginProbe() {
  const location = useLocation();
  return <p>Login from {(location.state as { from?: string } | null)?.from ?? "nowhere"}</p>;
}

const childCard = (name: string) => screen.getByText(name).closest("[data-child]") as HTMLElement;
const choose = (name: string, option: RegExp) => fireEvent.click(within(childCard(name)).getByRole("radio", { name: option }));
const button = (name: string | RegExp) => screen.getByRole("button", { name });

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  detail = fixture();
  saveError = null;
  saved.length = 0;
});

describe("Event form", () => {
  it("has four steps with both children allowing and continues to the next child", () => {
    renderPage();
    choose("Ian Louise Lim", /Allowing my child to join/);
    choose("Mia Lim", /Allowing my child to join/);
    expect(screen.getByText(/Step 1 of 4/)).toBeTruthy();

    fireEvent.click(button(/Continue to Ian/));
    expect(screen.getByText(/Step 2 of 4/)).toBeTruthy();
    expect(button(/Continue to Mia/)).toBeTruthy();
  });

  it("drops a child's step when not allowing and asks for the reason", () => {
    renderPage();
    choose("Ian Louise Lim", /Allowing my child to join/);
    choose("Mia Lim", /Not allowing/);

    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy();
    expect(within(childCard("Mia Lim")).getByLabelText(/Reason for not allowing your child to attend/)).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "Steps" })).queryByText("Mia")).toBeNull();
  });

  it("does not let a hidden required question block Continue", () => {
    renderPage();
    choose("Ian Louise Lim", /Allowing my child to join/);
    choose("Mia Lim", /Allowing my child to join/);
    fireEvent.click(button(/Continue to Ian/));

    fireEvent.change(screen.getByLabelText(/Food allergies/), { target: { value: "Peanuts" } });
    fireEvent.click(button(/Continue to Mia/));

    expect(screen.getByText(/Step 3 of 4/)).toBeTruthy();
  });

  it("blocks Continue on a visible required question", () => {
    renderPage();
    choose("Ian Louise Lim", /Allowing my child to join/);
    choose("Mia Lim", /Not allowing/);
    fireEvent.change(screen.getByLabelText(/Reason for not allowing/), { target: { value: "Away" } });
    fireEvent.click(button(/Continue to Ian/));
    fireEvent.click(button(/^Continue$/));

    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy();
    expect(screen.getByText("This question is required.")).toBeTruthy();
  });

  it("shows the closed message and disables the form on 409", () => {
    saveError = new SisError("Registration for this event has closed.", 409);
    renderPage();
    choose("Ian Louise Lim", /Not allowing/);
    choose("Mia Lim", /Not allowing/);
    for (const input of screen.getAllByLabelText(/Reason for not allowing/)) {
      fireEvent.change(input, { target: { value: "Away that week" } });
    }
    fireEvent.click(button("Register"));

    expect(saved).toHaveLength(1);
    expect(saved[0].children.map((c) => c.consent)).toEqual(["not_allowing", "not_allowing"]);
    expect(screen.getByText("Registration for this event has closed.")).toBeTruthy();
    expect((button("Register") as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends only visible answers and the signature", () => {
    renderPage();
    choose("Ian Louise Lim", /Allowing my child to join/);
    choose("Mia Lim", /Not allowing/);
    fireEvent.change(screen.getByLabelText(/Reason for not allowing/), { target: { value: "Away" } });
    fireEvent.click(button(/Continue to Ian/));
    fireEvent.change(screen.getByLabelText(/Food allergies/), { target: { value: "None" } });
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.change(screen.getByLabelText(/Name of the shadow teacher/), { target: { value: "Ms Tan" } });
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    fireEvent.click(button(/^Continue$/));
    fireEvent.change(screen.getByLabelText(/Your full name/), { target: { value: "Sheila Lim" } });
    fireEvent.click(button("Register"));

    expect(saved[0]).toEqual({
      parentName: "Sheila Lim",
      parentPhone: "9123 4567",
      children: [
        { studentNumber: "S1", consent: "allowing", answers: { allergy: "None", shadow: "No" } },
        { studentNumber: "S2", consent: "not_allowing", reason: "Away", answers: {} },
      ],
      familyAnswers: {},
      signatureName: "Sheila Lim",
    });
    expect(screen.getByText("Events list")).toBeTruthy();
  });

  it("jumps to the step of the first server error", () => {
    saveError = new SisError("Check the highlighted answers.", 400, undefined, undefined, {
      error: "Check the highlighted answers.",
      errors: { "S1.allergy": "Enter some text." },
    });
    renderPage();
    choose("Ian Louise Lim", /Allowing my child to join/);
    choose("Mia Lim", /Not allowing/);
    fireEvent.change(screen.getByLabelText(/Reason for not allowing/), { target: { value: "Away" } });
    fireEvent.click(button(/Continue to Ian/));
    fireEvent.change(screen.getByLabelText(/Food allergies/), { target: { value: "x" } });
    fireEvent.click(button(/^Continue$/));
    fireEvent.change(screen.getByLabelText(/Your full name/), { target: { value: "Sheila Lim" } });
    fireEvent.click(button("Register"));

    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy();
    expect(screen.getByText("Enter some text.")).toBeTruthy();
    const input = screen.getByLabelText(/Food allergies/);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-describedby") ?? "")?.textContent).toBe("Enter some text.");
    // The answer carries the message; no generic banner on top.
    expect(screen.queryByText("Check the highlighted answers.")).toBeNull();
  });

  it("shows a child who can no longer register read-only and leaves them out of the save", () => {
    detail.children[1].canRegister = false;
    detail.registrations = { S2: { status: "registered", reason: null, answers: {} } };
    renderPage();

    const mia = childCard("Mia Lim");
    expect(within(mia).getByText("No longer able to register for this event.")).toBeTruthy();
    expect(within(mia).getByText("Registered")).toBeTruthy();
    expect(within(mia).queryByRole("radio")).toBeNull();

    choose("Ian Louise Lim", /Not allowing/);
    fireEvent.change(screen.getByLabelText(/Reason for not allowing/), { target: { value: "Away" } });
    fireEvent.click(button("Save changes"));

    expect(saved[0].children).toEqual([{ studentNumber: "S1", consent: "not_allowing", reason: "Away", answers: {} }]);
  });

  it("sends a parent whose session ended to login, to come back to this event", () => {
    saveError = new SisError("Please sign in again.", 401);
    renderPage();
    choose("Ian Louise Lim", /Not allowing/);
    choose("Mia Lim", /Not allowing/);
    for (const input of screen.getAllByLabelText(/Reason for not allowing/)) {
      fireEvent.change(input, { target: { value: "Away" } });
    }
    fireEvent.click(button("Register"));

    expect(screen.getByText("Login from /admission/services/events/trip")).toBeTruthy();
  });
});
