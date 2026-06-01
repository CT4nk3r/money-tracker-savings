import { describe, expect, it } from "vitest";
import {
  clampProgress,
  convertMinorAmount,
  formatMoney,
  parseAmountToMinor,
} from "@/lib/money";

describe("money helpers", () => {
  it("parses decimal and zero-decimal currencies into minor units", () => {
    expect(parseAmountToMinor("123.45", "EUR")).toBe(12345);
    expect(parseAmountToMinor("10000", "HUF")).toBe(10000);
  });

  it("rejects extra fraction digits for a currency", () => {
    expect(() => parseAmountToMinor("100.50", "HUF")).toThrow(
      "HUF supports 0 decimal places.",
    );
  });

  it("converts between different minor-unit currencies", () => {
    expect(convertMinorAmount(10000, "HUF", "EUR", 0.0026)).toBe(2600);
    expect(convertMinorAmount(1999, "EUR", "HUF", 390)).toBe(7796);
  });

  it("formats money with the configured currency precision", () => {
    expect(formatMoney(10000, "HUF")).toContain("10,000");
    expect(formatMoney(12345, "EUR")).toContain("123.45");
  });

  it("clamps progress at 100 percent", () => {
    expect(clampProgress(50, 100)).toBe(50);
    expect(clampProgress(150, 100)).toBe(100);
  });
});
