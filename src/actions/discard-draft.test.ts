import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/drafts", () => ({ deleteDraftRemote: vi.fn() }));

const { discardDraft } = await import("./discard-draft");
const { deleteDraftRemote } = await import("@/actions/drafts");

function seedLocalDraft(draftId: string, type: "hfse-is" | "viz-school") {
  const key = `enrolNewStudent:draft:${draftId}:${type}`;
  localStorage.setItem(key, JSON.stringify({ state: { draftId, type }, version: 0 }));
  return key;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(deleteDraftRemote).mockResolvedValue(undefined);
});

describe("discardDraft", () => {
  it("removes the local draft and calls deleteDraftRemote", async () => {
    const key = seedLocalDraft("draft-1", "hfse-is");

    await discardDraft("draft-1", "hfse-is");

    expect(localStorage.getItem(key)).toBeNull();
    expect(deleteDraftRemote).toHaveBeenCalledWith("draft-1");
  });

  it("does nothing when draftId is undefined (no local removal, no remote call)", async () => {
    const key = seedLocalDraft("draft-1", "hfse-is");

    await discardDraft(undefined, "hfse-is");

    expect(localStorage.getItem(key)).not.toBeNull();
    expect(deleteDraftRemote).not.toHaveBeenCalled();
  });

  it("swallows a deleteDraftRemote failure — local removal already succeeded", async () => {
    const key = seedLocalDraft("draft-1", "viz-school");
    vi.mocked(deleteDraftRemote).mockRejectedValueOnce(new Error("network down"));

    await expect(discardDraft("draft-1", "viz-school")).resolves.toBeUndefined();

    expect(localStorage.getItem(key)).toBeNull();
    expect(deleteDraftRemote).toHaveBeenCalledWith("draft-1");
  });

  it("dispatches the draft-list-changed event via the underlying local removal", async () => {
    seedLocalDraft("draft-1", "hfse-is");
    const listener = vi.fn();
    window.addEventListener("draft-list-changed", listener);

    await discardDraft("draft-1", "hfse-is");

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("draft-list-changed", listener);
  });
});
