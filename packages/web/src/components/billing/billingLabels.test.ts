import { describe, expect, it } from "vitest";
import { formatBillingCurrency, getLedgerTypeLabel } from "./billingLabels";

describe("billing presentation labels", () => {
  it("presents ledger types in Brazilian Portuguese", () => {
    expect(getLedgerTypeLabel("charge")).toBe("Cobrança");
    expect(getLedgerTypeLabel("insurance")).toBe("Convênio");
  });

  it("formats displayed financial values in BRL without changing the numeric amount", () => {
    expect(formatBillingCurrency(1234.5)).toContain("R$");
    expect(formatBillingCurrency(1234.5)).toContain("1.234,50");
  });
});
