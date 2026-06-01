import { DepositForm } from "@/components/deposit-form";
import { ProgressSummary } from "@/components/progress-summary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { convertWithRateSnapshot } from "@/lib/fx";
import { getDashboardData, requireUserId } from "@/lib/data";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const clerkUserId = await requireUserId();
  const data = await getDashboardData(clerkUserId);
  const displayBalances = await Promise.all(
    data.balances.map(async (balance) => {
      if (balance.currency === data.settings.displayCurrency) {
        return balance.amountMinor;
      }

      const converted = await convertWithRateSnapshot(
        balance.amountMinor,
        balance.currency,
        data.settings.displayCurrency,
      );
      return converted.amountMinor;
    }),
  );
  const totalDisplayMinor = displayBalances.reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="grid gap-6 pb-20 md:pb-0">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
        <p className="text-muted-foreground">
          Unallocated balances, active goals, wishlist readiness, and recent ledger activity.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Unallocated Savings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="text-4xl font-semibold">
                {formatMoney(totalDisplayMinor, data.settings.displayCurrency)}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.balances.length ? (
                  data.balances.map((balance) => (
                    <Badge key={balance.currency} variant="secondary">
                      {formatMoney(balance.amountMinor, balance.currency)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No savings deposited yet.</span>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Goals</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                {data.goals.length ? (
                  data.goals.map((goal) => (
                    <ProgressSummary
                      key={goal.id}
                      label={goal.name}
                      savedAmountMinor={goal.savedAmountMinor}
                      targetAmountMinor={goal.targetAmountMinor}
                      currency={goal.currency}
                      status={goal.status}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Create a goal to start tracking.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Wishlist Bars</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                {data.wishlist.length ? (
                  data.wishlist.map((item) => (
                    <ProgressSummary
                      key={item.id}
                      label={`${item.rank}. ${item.title}`}
                      savedAmountMinor={item.savedAmountMinor}
                      targetAmountMinor={item.currentPriceMinor}
                      currency={item.currency}
                      status={item.status}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Add ranked wishlist items.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="grid gap-4">
          <DepositForm defaultFundingMode={data.settings.defaultFundingMode} />
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.transactions.length ? (
                data.transactions.map((transaction) => (
                  <div key={transaction.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{transaction.type.replaceAll("_", " ")}</span>
                      <span>{formatMoney(transaction.amountMinor, transaction.currency)}</span>
                    </div>
                    {transaction.note ? (
                      <p className="text-xs text-muted-foreground">{transaction.note}</p>
                    ) : null}
                    <Separator className="mt-3" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
