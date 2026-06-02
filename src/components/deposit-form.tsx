"use client";

import { useState } from "react";
import { createDepositFormAction } from "@/app/actions";
import { ActionForm, ActionSubmitButton } from "@/components/action-form";
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
  const [accountId, setAccountId] = useState("");
  const isJointDeposit = accountId.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Money Aside</CardTitle>
      </CardHeader>
      <CardContent>
        <ActionForm action={createDepositFormAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="deposit-amount">Amount</Label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input id="deposit-amount" name="amount" inputMode="decimal" required />
              <CurrencySelect />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-mode">Wishlist funding</Label>
            {isJointDeposit ? (
              <input type="hidden" name="fundingMode" value="manual" />
            ) : null}
            <FundingModeSelect
              key={isJointDeposit ? "joint-manual" : "personal-funding"}
              defaultValue={isJointDeposit ? "manual" : defaultFundingMode}
              disabled={isJointDeposit}
            />
            {isJointDeposit ? (
              <p className="text-xs text-muted-foreground">
                Joint account deposits stay unallocated until you assign them to a shared goal.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-account">Saving space</Label>
            <AccountScopeSelect
              id="deposit-account"
              accounts={accounts}
              value={accountId}
              onChange={(event) => setAccountId(event.currentTarget.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-note">Note</Label>
            <Input id="deposit-note" name="note" placeholder="Salary, cash envelope, bonus" />
          </div>
          <ActionSubmitButton type="submit" pendingLabel="Adding...">
            Add savings
          </ActionSubmitButton>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
