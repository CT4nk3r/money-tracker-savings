export const currencies = [
  { code: "HUF", name: "Hungarian Forint", decimals: 0 },
  { code: "EUR", name: "Euro", decimals: 2 },
  { code: "USD", name: "US Dollar", decimals: 2 },
  { code: "GBP", name: "British Pound", decimals: 2 },
  { code: "CHF", name: "Swiss Franc", decimals: 2 },
  { code: "JPY", name: "Japanese Yen", decimals: 0 },
  { code: "CAD", name: "Canadian Dollar", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", decimals: 2 },
  { code: "PLN", name: "Polish Zloty", decimals: 2 },
  { code: "CZK", name: "Czech Koruna", decimals: 2 },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

export const currencyCodes = currencies.map((currency) => currency.code);

export function isCurrencyCode(value: string): value is CurrencyCode {
  return currencyCodes.includes(value as CurrencyCode);
}

export function getCurrency(code: string) {
  const currency = currencies.find((item) => item.code === code);

  if (!currency) {
    throw new Error(`Unsupported currency: ${code}`);
  }

  return currency;
}
