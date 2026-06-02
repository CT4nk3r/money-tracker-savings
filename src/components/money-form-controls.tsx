import type { ComponentProps } from "react";
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
  ...selectProps
}: {
  name?: string;
  defaultValue?: string;
} & Omit<ComponentProps<"select">, "children" | "name" | "defaultValue">) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      {...selectProps}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <option value="manual">Manual</option>
      <option value="top_first">Top item first</option>
      <option value="weighted_split">Weighted split</option>
    </select>
  );
}

export function AccountScopeSelect({
  accounts,
  name = "accountId",
  defaultValue = "",
  ...selectProps
}: {
  accounts: { id: string; name: string }[];
  name?: string;
  defaultValue?: string;
} & Omit<ComponentProps<"select">, "children" | "name" | "defaultValue">) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      {...selectProps}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <option value="">Personal savings</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}
