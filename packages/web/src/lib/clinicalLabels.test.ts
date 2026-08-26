import { describe, expect, it } from "vitest";
import {
  formatBleedingAriaLabel,
  formatToothAriaLabel,
  formatUpdatedByLabel,
} from "./clinicalLabels";

describe("clinical accessibility labels", () => {
  it("preserves the tooth number and description in Portuguese", () => {
    expect(formatToothAriaLabel(14, "Primeiro molar superior direito")).toBe(
      "Dente 14: Primeiro molar superior direito"
    );
  });

  it("preserves the periodontal site and tooth number", () => {
    expect(formatBleedingAriaLabel("MB", 14)).toBe(
      "Sangramento, sítio MB, dente 14"
    );
  });

  it("preserves the API-provided clinician name in update metadata", () => {
    expect(formatUpdatedByLabel("Dra. Ana")).toBe("por Dra. Ana");
  });
});
