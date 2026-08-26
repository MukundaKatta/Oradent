import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("mensagens de erro em pt-BR", () => {
  it("normaliza mensagens externas antes de renderizá-las", () => {
    const login = source("../app/(auth)/login/page.tsx");
    const register = source("../app/(auth)/register/page.tsx");
    const errorBoundary = source("../components/layout/ErrorBoundary.tsx");

    expect(login).toContain(
      "localizeErrorMessage(error.message, ptBR.auth.login.unexpectedError)"
    );
    expect(register).toContain(
      "localizeErrorMessage(error.message, ptBR.auth.register.unexpectedError)"
    );
    expect(errorBoundary).toContain(
      "localizeErrorMessage(this.state.error?.message, ptBR.shell.errorBoundary.unexpectedError)"
    );
  });
});
