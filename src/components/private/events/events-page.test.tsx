import type { ParentEventList, ParentEventRow } from "@/types/events";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Events from "@/pages/private/services/events";

let data: ParentEventList | undefined;
vi.mock("@/hooks/use-events", () => ({
  useEvents: () => ({ data, isPending: data == null, error: null }),
}));

const ian = (status: "registered" | "not_joining" | "not_registered") => ({
  studentNumber: "S1",
  name: "Ian Louise",
  status,
});
const mia = (status: "registered" | "not_joining" | "not_registered") => ({
  studentNumber: "S2",
  name: "Mia",
  status,
});

function row(over: Partial<ParentEventRow>): ParentEventRow {
  return {
    slug: "e",
    title: "Event",
    startsOn: "2026-11-20",
    endsOn: null,
    timeLabel: "Fri, 8:00 am – 1:00 pm",
    venue: "School hall",
    scopeLabel: "Whole school",
    closesAt: "2026-11-13T09:00:00.000Z",
    canRegister: true,
    children: [ian("not_registered")],
    ...over,
  };
}

const fixture = (): ParentEventList => {
  const open = [
    row({ slug: "trip", title: "Science Centre trip", closesAt: "2026-10-30T09:00:00.000Z" }),
    row({
      slug: "ptc",
      title: "Parent–Teacher Conference",
      closesAt: "2026-11-03T09:00:00.000Z",
      children: [ian("not_registered"), mia("not_registered")],
    }),
    row({
      slug: "sports",
      title: "Sports Day",
      children: [ian("registered"), mia("not_joining")],
    }),
  ];
  return { open, mine: [open[2]], academicYears: ["AY2026"] };
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-29T02:00:00.000Z"));
  data = fixture();
});
afterEach(() => vi.useRealTimers());

const renderPage = () =>
  render(
    <MemoryRouter>
      <Events />
    </MemoryRouter>,
  );

describe("Events page", () => {
  it("warns about events closing soon that still need a registration", () => {
    renderPage();
    expect(screen.getByText("2 events closing soon still need you to register")).toBeTruthy();
  });

  it("shows one badge per child when statuses differ, with Edit", () => {
    renderPage();
    const sports = screen.getByText("Sports Day").closest("[data-event-row]") as HTMLElement;
    expect(within(sports).getByText("Ian Louise · Registered")).toBeTruthy();
    expect(within(sports).getByText("Mia · Not joining")).toBeTruthy();
    expect(within(sports).getByRole("link", { name: "Edit" }).getAttribute("href")).toBe(
      "/admission/services/events/sports",
    );
  });

  it("shows Register for an event with no answers", () => {
    renderPage();
    const trip = screen.getByText("Science Centre trip").closest("[data-event-row]") as HTMLElement;
    expect(within(trip).getByRole("link", { name: "Register" })).toBeTruthy();
    expect(within(trip).getByText("Not registered yet")).toBeTruthy();
  });

  it("says so when no events are open", () => {
    data = { open: [], mine: [], academicYears: ["AY2026"] };
    renderPage();
    expect(screen.getByText("No events are open for your children right now.")).toBeTruthy();
  });
});
