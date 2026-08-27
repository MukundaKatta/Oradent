import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("autenticação e navegação em pt-BR", () => {
  it("usa o catálogo pt-BR nos fluxos de autenticação", () => {
    const login = source("./login/page.tsx");
    const register = source("./register/page.tsx");

    expect(login).toContain("ptBR.auth.login.title");
    expect(login).toContain("ptBR.auth.login.submit");
    expect(register).toContain("ptBR.auth.register.title");
    expect(register).toContain("ptBR.auth.register.submit");
    expect(login).not.toContain("Welcome back");
    expect(register).not.toContain("Create your account");
  });

  it("usa o catálogo pt-BR no shell global e mantém seus destinos", () => {
    const sidebar = source("../../components/layout/Sidebar.tsx");
    const topBar = source("../../components/layout/TopBar.tsx");
    const commandPalette = source("../../components/layout/CommandPalette.tsx");
    const notifications = source("../../components/layout/NotificationPanel.tsx");

    expect(sidebar).toContain("ptBR.shell.navigation.dashboard");
    expect(topBar).toContain("ptBR.shell.search.placeholder");
    expect(commandPalette).toContain("ptBR.shell.commandPalette.label");
    expect(notifications).toContain("ptBR.shell.notifications.title");
    expect(sidebar).toContain('href: "/patients"');
    expect(commandPalette).toContain('href: "/appointments/new"');
  });

  it("autentica pelo cliente de API configurado e preserva a localização de erros", () => {
    const login = source("./login/page.tsx");

    expect(login).toContain('import { apiPost } from "@/lib/api"');
    expect(login).toContain("const result = await apiPost<{");
    expect(login).toContain("const token = result.token || result.accessToken;");
    expect(login).toContain('throw new Error("Login response did not include a token")');
    expect(login).toContain("localizeErrorMessage(error.message, ptBR.auth.login.unexpectedError)");
    expect(login).not.toContain('fetch("/api/auth/login"');
    expect(login).not.toContain("const response = await");
  });

  it("mantém o layout pt-BR sem fonte remota", () => {
    const layout = source("../layout.tsx");

    expect(layout).toContain('<html lang="pt-BR">');
    expect(layout).not.toContain("next/font/google");
    expect(layout).not.toContain("dmSans");
  });
});
