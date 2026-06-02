import { createDeposit } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AccountScopeSelect,
  CurrencySelect,
  FundingModeSelect,
} from "@/components/money-form-controls";

export function DepositForm({
  accounts,
  defaultFundingMode,
}: {
  accounts: { id: string; name: string }[];
  defaultFundingMode: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Money Aside</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createDeposit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="deposit-amount">Amount</Label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input id="deposit-amount" name="amount" inputMode="decimal" required />
              <CurrencySelect />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-mode">Wishlist funding</Label>
            <FundingModeSelect defaultValue={defaultFundingMode} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-account">Saving space</Label>
            <AccountScopeSelect id="deposit-account" accounts={accounts} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-note">Note</Label>
            <Input id="deposit-note" name="note" placeholder="Salary, cash envelope, bonus" />
          </div>
          <Button type="submit">Add savings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
