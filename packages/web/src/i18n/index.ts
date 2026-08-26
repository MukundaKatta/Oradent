import { clinicalPtBR } from "./clinical-pt-BR";
import { ptBR } from "./pt-BR";

export { clinicalPtBR, ptBR };

export const translations = {
  ...ptBR,
  clinical: clinicalPtBR,
} as const;

export type TranslationCatalog = typeof translations;

function humanize(path: string): string {
  const key = path.split(".").filter(Boolean).pop() ?? path;
  const value = key.replace(/[_-]+/g, " ").trim();

  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : path;
}

export function t(path: string, fallback?: string): string {
  const value = path.split(".").filter(Boolean).reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;

    return (current as Record<string, unknown>)[key];
  }, translations);

  return typeof value === "string" ? value : fallback ?? humanize(path);
}
