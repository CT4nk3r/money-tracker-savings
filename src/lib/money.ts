import { getCurrency } from "@/lib/currencies";

export function parseAmountToMinor(input: FormDataEntryValue | string, currency: string) {
  const raw = String(input).trim().replace(",", ".");
  const currencyInfo = getCurrency(currency);

  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("Enter a positive amount.");
  }

  const [whole, fraction = ""] = raw.split(".");

  if (fraction.length > currencyInfo.decimals) {
    throw new Error(`${currency} supports ${currencyInfo.decimals} decimal places.`);
  }

  const paddedFraction = fraction.padEnd(currencyInfo.decimals, "0");
  const amount = Number(whole) * 10 ** currencyInfo.decimals + Number(paddedFraction || 0);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Enter a positive amount.");
  }

  return amount;
}

export function formatMoney(amountMinor: number, currency: string) {
  const currencyInfo = getCurrency(currency);

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: currencyInfo.decimals,
    maximumFractionDigits: currencyInfo.decimals,
  }).format(amountMinor / 10 ** currencyInfo.decimals);
}

export function convertMinorAmount(amountMinor: number, from: string, to: string, rate: number) {
  const fromCurrency = getCurrency(from);
  const toCurrency = getCurrency(to);
  const major = amountMinor / 10 ** fromCurrency.decimals;
  const convertedMajor = major * rate;

  return Math.round(convertedMajor * 10 ** toCurrency.decimals);
}

export function clampProgress(currentMinor: number, targetMinor: number) {
  if (targetMinor <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((currentMinor / targetMinor) * 100));
}
