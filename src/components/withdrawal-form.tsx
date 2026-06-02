"use client";

import { withdrawSavingsFormAction } from "@/app/actions";
import { ActionForm, ActionSubmitButton } from "@/components/action-form";
import {
  AccountScopeSelect,
  CurrencySelect,
} from "@/components/money-form-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WithdrawalForm({
  accounts,
}: {
  accounts: { id: string; name: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw Money</CardTitle>
      </CardHeader>
      <CardContent>
        <ActionForm action={withdrawSavingsFormAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="withdraw-amount">Amount</Label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input id="withdraw-amount" name="amount" inputMode="decimal" required />
              <CurrencySelect />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="withdraw-account">Saving space</Label>
            <AccountScopeSelect id="withdraw-account" accounts={accounts} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="withdraw-note">Note</Label>
            <Input id="withdraw-note" name="note" placeholder="Cash out, bank transfer" />
          </div>
          <ActionSubmitButton type="submit" variant="outline" pendingLabel="Withdrawing...">
            Withdraw
          </ActionSubmitButton>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
