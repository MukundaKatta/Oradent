import { describe, expect, it } from "vitest";
import { formatUploadButtonLabel, imageTypeLabel, IMAGE_TYPE_OPTIONS } from "./imagingLabels";

describe("imaging upload labels", () => {
  it("uses the localized upload label while preserving the selected file count", () => {
    expect(formatUploadButtonLabel(3)).toBe("Enviar (3)");
  });
});

describe("imageTypeLabel", () => {
  it("maps every server ImageType enum value to a Portuguese label", () => {
    expect(imageTypeLabel("PERIAPICAL")).toBe("Periapical");
    expect(imageTypeLabel("BITEWING")).toBe("Interproximal");
    expect(imageTypeLabel("PANORAMIC")).toBe("Panorâmica");
    expect(imageTypeLabel("CEPHALOMETRIC")).toBe("Cefalométrica");
    expect(imageTypeLabel("CBCT")).toBe("TCFC");
    // The combined INTRAORAL_PHOTO/EXTRAORAL_PHOTO enum values are the part
    // that's easy to get wrong mapping back from the shorter UI keys.
    expect(imageTypeLabel("INTRAORAL_PHOTO")).toBe("Foto intraoral");
    expect(imageTypeLabel("EXTRAORAL_PHOTO")).toBe("Foto extraoral");
    expect(imageTypeLabel("OTHER")).toBe("Outro");
  });

  it("falls back to the raw value for an unmapped type instead of throwing", () => {
    expect(imageTypeLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});

describe("IMAGE_TYPE_OPTIONS", () => {
  it("covers all 8 ImageType enum values with a distinct label each", () => {
    expect(IMAGE_TYPE_OPTIONS).toHaveLength(8);
    const values = IMAGE_TYPE_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(8);
  });
});
