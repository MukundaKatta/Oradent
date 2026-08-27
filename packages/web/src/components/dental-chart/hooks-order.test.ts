import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("componentes do odontograma", () => {
  it("declara hooks antes do retorno para um dente inexistente", () => {
    const surfaceSelector = source("./SurfaceSelector.tsx");
    const toothSvg = source("./ToothSVG.tsx");

    expect(surfaceSelector.indexOf("const handleClick = useCallback")).toBeLessThan(
      surfaceSelector.indexOf("if (!tooth) return null")
    );
    expect(toothSvg.indexOf("const surfaceColorMap = useMemo")).toBeLessThan(
      toothSvg.indexOf("if (!tooth) return null")
    );
    expect(toothSvg.indexOf("const handleSurfaceClick = useCallback")).toBeLessThan(
      toothSvg.indexOf("if (!tooth) return null")
    );
  });
});
