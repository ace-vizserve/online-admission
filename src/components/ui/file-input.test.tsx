/**
 * Upload-dialog refactor, Phase 1 — `file-input.tsx` fixes.
 * Covers: friendly rejection messages (fixed: previously showed the raw react-dropzone
 * rejection string) and the keyboard-trap fix (fixed: previously called preventDefault/
 * stopPropagation unconditionally for every key, including Tab).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { FileRejection } from "react-dropzone";

import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem, friendlyRejectionMessage } from "./file-input";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

function rejection(code: string, message = ""): FileRejection {
  return {
    file: new File([""], "file"),
    errors: [{ code, message }],
  } as FileRejection;
}

describe("friendlyRejectionMessage", () => {
  it("returns a size-limit message for file-too-large (unchanged behavior)", () => {
    const message = friendlyRejectionMessage(rejection("file-too-large"), 4 * 1024 * 1024, 1, {});
    expect(message).toContain("too large");
    expect(message).toContain("4MB");
  });

  it("returns a curated message listing accepted extensions for file-invalid-type (fixed: was the raw dropzone string)", () => {
    const message = friendlyRejectionMessage(rejection("file-invalid-type", "File type must be application/pdf"), 1, 1, {
      "application/pdf": [".pdf"],
    });

    expect(message).toContain("isn't supported");
    expect(message).toContain(".pdf");
    expect(message).not.toContain("File type must be");
  });

  it("falls back to a generic message for file-invalid-type when no accept map is known", () => {
    const message = friendlyRejectionMessage(rejection("file-invalid-type"), 1, 1, {});
    expect(message).toBe("This file type isn't supported.");
  });

  it("returns a curated message for too-many-files", () => {
    const message = friendlyRejectionMessage(rejection("too-many-files"), 1, 4, {});
    expect(message).toContain("up to 4 files");
  });

  it("falls back to the raw dropzone message for an unrecognized rejection code", () => {
    const message = friendlyRejectionMessage(rejection("some-other-code", "Some raw dropzone message"), 1, 1, {});
    expect(message).toBe("Some raw dropzone message");
  });
});

function Harness({ maxSize = 4 * 1024 * 1024 }: { maxSize?: number }) {
  const [value, setValue] = useState<File[] | null>(null);

  return (
    <>
      <button type="button">before</button>
      <FileUploader
        value={value}
        onValueChange={setValue}
        dropzoneOptions={{ accept: { "application/pdf": [".pdf"] }, maxSize, maxFiles: 1 }}>
        <FileInput data-testid="drop-target">
          <span>Click to upload or drag and drop</span>
        </FileInput>
        <FileUploaderContent>
          {(value ?? []).map((file, i) => (
            <FileUploaderItem key={i} index={i}>
              {file.name}
            </FileUploaderItem>
          ))}
        </FileUploaderContent>
      </FileUploader>
      <button type="button">after</button>
    </>
  );
}

function getHiddenInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("FileUploader", () => {
  it("shows the size-limit message for an oversized file (end-to-end through react-dropzone)", async () => {
    const { container } = render(<Harness maxSize={10} />);
    const input = getHiddenInput(container);

    const oversizedFile = new File([new Uint8Array(1000)], "big.pdf", { type: "application/pdf" });

    const user = userEvent.setup();
    await user.upload(input, oversizedFile);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("too large"));
  });

  it("does not block Tab from moving focus out of the uploader (fixed keyboard trap)", async () => {
    render(<Harness />);

    const before = screen.getByRole("button", { name: "before" });
    const after = screen.getByRole("button", { name: "after" });

    const user = userEvent.setup();
    await user.click(before);
    expect(before).toHaveFocus();

    // Tab from "before" first lands on the FileUploader wrapper div (tabIndex=0), then on the
    // FileInput dropzone root div (also focusable via getRootProps()), before finally reaching
    // "after". If the uploader's keydown handler still called preventDefault unconditionally,
    // none of these Tabs would ever move focus past the first focusable div.
    await user.tab();
    await user.tab();
    await user.tab();

    expect(after).toHaveFocus();
  });
});
