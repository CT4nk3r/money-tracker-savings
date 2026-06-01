import { currencyCodes } from "@/lib/currencies";

type CurrencySelectProps = {
  name?: string;
  defaultValue?: string;
};

export function CurrencySelect({
  name = "currency",
  defaultValue = "HUF",
}: CurrencySelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {currencyCodes.map((currency) => (
        <option key={currency} value={currency}>
          {currency}
        </option>
      ))}
    </select>
  );
}

export function FundingModeSelect({
  name = "fundingMode",
  defaultValue = "manual",
}: {
  name?: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <option value="manual">Manual</option>
      <option value="top_first">Top item first</option>
      <option value="weighted_split">Weighted split</option>
    </select>
  );
}
