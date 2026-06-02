import { currentUser } from "@clerk/nextjs/server";
import {
  acceptSavingsAccountInvite,
  allocateToGoal,
  createGoal,
  createSavingsAccount,
} from "@/app/actions";
import { AccountScopeSelect, CurrencySelect } from "@/components/money-form-controls";
import { ProgressSummary } from "@/components/progress-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getGoalsView,
  getPendingSavingsInvitesForEmails,
  getSavingsAccountsForUser,
  requireUserId,
} from "@/lib/data";

export default async function GoalsPage() {
  const clerkUserId = await requireUserId();
  const user = await currentUser();
  const emails = user?.emailAddresses.map((email) => email.emailAddress) ?? [];
  const [goals, accounts, invites] = await Promise.all([
    getGoalsView(clerkUserId),
    getSavingsAccountsForUser(clerkUserId),
    getPendingSavingsInvitesForEmails(emails),
  ]);
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]));

  return (
    <div className="grid gap-6 pb-20 md:pb-0">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Goals</h1>
        <p className="text-muted-foreground">
          Create savings targets and allocate unassigned balance directly to them.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>New Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createGoal} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="goal-name">Name</Label>
                  <Input id="goal-name" name="name" required placeholder="Summer flight" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goal-target">Target amount</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input id="goal-target" name="targetAmount" inputMode="decimal" required />
                    <CurrencySelect />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goal-account">Saving space</Label>
                  <AccountScopeSelect id="goal-account" accounts={accounts} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goal-notes">Notes</Label>
                  <Textarea id="goal-notes" name="notes" rows={3} />
                </div>
                <Button type="submit">Create goal</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Joint Accounts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <form action={createSavingsAccount} className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="joint-name">Account name</Label>
                  <Input id="joint-name" name="name" required placeholder="Trip together" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="joint-email">Invite email</Label>
                  <Input
                    id="joint-email"
                    name="invitedEmail"
                    type="email"
                    required
                    placeholder="partner@example.com"
                  />
                </div>
                <Button type="submit">Create and invite</Button>
              </form>
              <div className="grid gap-2">
                {accounts.length ? (
                  accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{account.name}</span>
                      <Badge variant="secondary">{account.role}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No joint accounts yet.
                  </p>
                )}
              </div>
              {invites.length ? (
                <div className="grid gap-2">
                  {invites.map((invite) => (
                    <form
                      key={invite.id}
                      action={acceptSavingsAccountInvite}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <span>
                        Invitation to <span className="font-medium">{invite.accountName}</span>
                      </span>
                      <Button size="sm" type="submit">
                        Accept
                      </Button>
                    </form>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4">
          {goals.length ? (
            goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="grid gap-5 p-6">
                  {goal.accountId ? (
                    <Badge className="w-fit" variant="outline">
                      {accountNameById.get(goal.accountId) ?? "Joint account"}
                    </Badge>
                  ) : null}
                  <ProgressSummary
                    label={goal.name}
                    savedAmountMinor={goal.savedAmountMinor}
                    targetAmountMinor={goal.targetAmountMinor}
                    currency={goal.currency}
                    status={goal.status}
                  />
                  <form action={allocateToGoal} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <input type="hidden" name="goalId" value={goal.id} />
                    <Input name="amount" inputMode="decimal" required placeholder="Allocate amount" />
                    <CurrencySelect />
                    <Button type="submit">Allocate</Button>
                  </form>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No goals yet. Add one to start assigning savings.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
