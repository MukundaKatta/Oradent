import { describe, expect, it } from "vitest";
import { formatUploadButtonLabel } from "./imagingLabels";

describe("imaging upload labels", () => {
  it("uses the localized upload label while preserving the selected file count", () => {
    expect(formatUploadButtonLabel(3)).toBe("Enviar (3)");
  });
});
