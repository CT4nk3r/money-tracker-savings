import { updateSettings } from "@/app/actions";
import { CurrencySelect, FundingModeSelect } from "@/components/money-form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getOrCreateSettings, requireUserId } from "@/lib/data";

export default async function SettingsPage() {
  const clerkUserId = await requireUserId();
  const settings = await getOrCreateSettings(clerkUserId);

  return (
    <div className="grid max-w-2xl gap-6 pb-20 md:pb-0">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="text-muted-foreground">
          Choose the display currency and default ranked-wishlist funding behavior.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="grid gap-5">
            <div className="grid gap-2">
              <Label>Display currency</Label>
              <CurrencySelect
                name="displayCurrency"
                defaultValue={settings.displayCurrency}
              />
            </div>
            <div className="grid gap-2">
              <Label>Default wishlist funding</Label>
              <FundingModeSelect
                name="defaultFundingMode"
                defaultValue={settings.defaultFundingMode}
              />
            </div>
            <Button type="submit">Save settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
