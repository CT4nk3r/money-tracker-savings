import { allocateToGoal, createGoal } from "@/app/actions";
import { CurrencySelect } from "@/components/money-form-controls";
import { ProgressSummary } from "@/components/progress-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getGoalsView, requireUserId } from "@/lib/data";

export default async function GoalsPage() {
  const clerkUserId = await requireUserId();
  const goals = await getGoalsView(clerkUserId);

  return (
    <div className="grid gap-6 pb-20 md:pb-0">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Goals</h1>
        <p className="text-muted-foreground">
          Create savings targets and allocate unassigned balance directly to them.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
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
                <Label htmlFor="goal-notes">Notes</Label>
                <Textarea id="goal-notes" name="notes" rows={3} />
              </div>
              <Button type="submit">Create goal</Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {goals.length ? (
            goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="grid gap-5 p-6">
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
