import { render, renderHook, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { Form } from "@/components/ui/form";
import { DocumentConfig, STUDENT_DOCUMENTS } from "./document-config";
import { DocumentSubFields } from "./document-sub-fields";
import { ReadHints } from "./read-hints";
import { SharedUploadFormState } from "./types";

const passportCfg = STUDENT_DOCUMENTS.find((d) => d.name === "passport")!;
const passCfg = STUDENT_DOCUMENTS.find((d) => d.name === "pass")!;
const idPictureCfg = STUDENT_DOCUMENTS.find((d) => d.name === "idPicture")!;

function renderFields(cfg: DocumentConfig, hints?: ReadHints) {
  const { result } = renderHook(() => useForm<Record<string, unknown>>({ defaultValues: { toFollowDocs: [] } }));
  return render(
    <Form {...result.current}>
      <DocumentSubFields
        cfg={cfg}
        form={result.current}
        formState={{} as SharedUploadFormState}
        setUploadRequirements={vi.fn()}
        hints={hints}
      />
    </Form>,
  );
}

describe("DocumentSubFields", () => {
  it("renders the passport number and expiry with their usual descriptions", () => {
    renderFields(passportCfg);
    expect(screen.getByText("Passport Number")).toBeInTheDocument();
    expect(screen.getByText(passportCfg.passportNumberDescription!)).toBeInTheDocument();
    expect(screen.getByText("Passport expiration date.")).toBeInTheDocument();
  });

  it("shows what the OCR check read in place of a passport field's description", () => {
    renderFields(passportCfg, { number: <p>From your passport</p>, expiry: <p>Your passport shows 1 Jan 2020</p> });
    expect(screen.getByText("From your passport")).toBeInTheDocument();
    expect(screen.getByText("Your passport shows 1 Jan 2020")).toBeInTheDocument();
    expect(screen.queryByText(passportCfg.passportNumberDescription!)).not.toBeInTheDocument();
    expect(screen.queryByText("Passport expiration date.")).not.toBeInTheDocument();
  });

  it("keeps a pass's usual descriptions (passes aren't read)", () => {
    renderFields(passCfg, { expiry: <p>Your pass shows 1 Jan 2020</p> });
    expect(screen.getByText(passCfg.passDescription!)).toBeInTheDocument();
    expect(screen.getByText("Pass expiration date.")).toBeInTheDocument();
    expect(screen.queryByText("Your pass shows 1 Jan 2020")).not.toBeInTheDocument();
  });

  it("renders nothing for documents without detail fields", () => {
    const { container } = renderFields(idPictureCfg);
    expect(container).toBeEmptyDOMElement();
  });
});
