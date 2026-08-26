import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatAge,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatPhone,
  formatRelativeDate,
  formatTime,
} from "./formatters";

describe("formatadores pt-BR", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("exibe moeda, data e hora no padrão brasileiro", () => {
    const appointment = "2025-01-15T14:30:00";

    expect(formatCurrency(1234.5)).toBe("R$ 1.234,50");
    expect(formatDate(appointment)).toBe("15/01/2025");
    expect(formatDateTime(appointment)).toBe("15/01/2025 14:30");
    expect(formatTime(appointment)).toBe("14:30");
  });

  it("traduz unidades, idade, telefone e distância relativa", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-20T12:00:00"));

    expect(formatRelativeDate("2025-05-17T12:00:00")).toBe("há 3 dias");
    expect(formatAge("1990-05-20")).toBe("35 anos");
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatFileSize(1536)).toBe("1,5 KB");
  });

  it("usa fallback em português quando não há valor", () => {
    expect(formatDate(null)).toBe("Não informado");
    expect(formatDateTime(undefined)).toBe("Não informado");
    expect(formatTime(null)).toBe("Não informado");
    expect(formatRelativeDate(undefined)).toBe("Não informado");
    expect(formatPhone(null)).toBe("Não informado");
    expect(formatAge(undefined)).toBe("Não informado");
  });
});
