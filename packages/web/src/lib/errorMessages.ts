import { ptBR } from "@/i18n";

const invalidCredentialMessages = new Set([
  "INVALID_CREDENTIALS",
  "INVALID_EMAIL_OR_PASSWORD",
  "UNAUTHORIZED",
]);

const registrationMessages = new Set([
  "REGISTRATION_FAILED",
  "EMAIL_ALREADY_EXISTS",
  "EMAIL_ALREADY_REGISTERED",
]);

function errorToken(message: string): string {
  return message.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function localizeErrorMessage(message: unknown, fallback: string): string {
  if (typeof message !== "string" || !message.trim()) return fallback;

  const token = errorToken(message);

  if (
    invalidCredentialMessages.has(token) ||
    /invalid (email or )?password|invalid credentials/i.test(message)
  ) {
    return ptBR.auth.login.invalidCredentials;
  }

  if (
    registrationMessages.has(token) ||
    /registration failed|email already (exists|registered)/i.test(message)
  ) {
    return ptBR.auth.register.registrationFailed;
  }

  return fallback;
}
