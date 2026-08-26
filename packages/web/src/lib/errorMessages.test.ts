import { describe, expect, it } from "vitest";

import { ptBR } from "@/i18n";
import { localizeErrorMessage } from "./errorMessages";

describe("localizeErrorMessage", () => {
  it("traduz códigos e mensagens de credenciais conhecidas", () => {
    expect(
      localizeErrorMessage("INVALID_CREDENTIALS", ptBR.auth.login.unexpectedError)
    ).toBe(ptBR.auth.login.invalidCredentials);
    expect(
      localizeErrorMessage("Invalid email or password.", ptBR.auth.login.unexpectedError)
    ).toBe(ptBR.auth.login.invalidCredentials);
  });

  it("traduz códigos de cadastro conhecidos", () => {
    expect(
      localizeErrorMessage("REGISTRATION_FAILED", ptBR.auth.register.unexpectedError)
    ).toBe(ptBR.auth.register.registrationFailed);
  });
  it("não exibe uma mensagem externa desconhecida", () => {
    expect(
      localizeErrorMessage("Database connection refused", ptBR.shell.errorBoundary.unexpectedError)
    ).toBe(ptBR.shell.errorBoundary.unexpectedError);
  });
});
