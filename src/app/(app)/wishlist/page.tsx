import {
  allocateToWishlistFormAction,
  createWishlistItemFormAction,
  purchaseWishlistItemFormAction,
  updateWishlistPriceFormAction,
} from "@/app/actions";
import { ActionForm, ActionSubmitButton } from "@/components/action-form";
import { CurrencySelect } from "@/components/money-form-controls";
import { ProgressSummary } from "@/components/progress-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getWishlistView, requireUserId } from "@/lib/data";
import { formatMoney } from "@/lib/money";

export default async function WishlistPage() {
  const clerkUserId = await requireUserId();
  const items = await getWishlistView(clerkUserId);

  return (
    <div className="grid gap-6 pb-20 md:pb-0">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Ranked Wishlist</h1>
        <p className="text-muted-foreground">
          Rank things you want, fill their bars, adjust discount prices, and mark them purchased.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New Wishlist Item</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createWishlistItemFormAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="wishlist-title">Title</Label>
                <Input id="wishlist-title" name="title" required placeholder="Hotel in Vienna" />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="wishlist-current">Current price</Label>
                  <Input id="wishlist-current" name="currentPrice" inputMode="decimal" required />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <CurrencySelect />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wishlist-original">Original price</Label>
                <Input id="wishlist-original" name="originalPrice" inputMode="decimal" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wishlist-rank">Rank</Label>
                <Input id="wishlist-rank" name="rank" type="number" min="1" defaultValue="1" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wishlist-url">URL</Label>
                <Input id="wishlist-url" name="url" type="url" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wishlist-notes">Notes</Label>
                <Textarea id="wishlist-notes" name="notes" rows={3} />
              </div>
              <ActionSubmitButton type="submit" pendingLabel="Adding...">
                Add item
              </ActionSubmitButton>
            </ActionForm>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {items.length ? (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="grid gap-5 p-6">
                  <ProgressSummary
                    label={`${item.rank}. ${item.title}`}
                    savedAmountMinor={item.savedAmountMinor}
                    targetAmountMinor={item.currentPriceMinor}
                    currency={item.currency}
                    status={item.status}
                  />
                  {item.originalPriceMinor !== item.currentPriceMinor ? (
                    <div className="text-sm text-muted-foreground">
                      Original price: {formatMoney(item.originalPriceMinor, item.currency)}
                    </div>
                  ) : null}
                  {item.status === "purchased" ? null : (
                    <div className="grid gap-3 xl:grid-cols-3">
                      {item.savedAmountMinor < item.currentPriceMinor ? (
                        <ActionForm action={allocateToWishlistFormAction} className="grid gap-3">
                          <input type="hidden" name="wishlistItemId" value={item.id} />
                          <Input
                            name="amount"
                            inputMode="decimal"
                            required
                            placeholder="Allocate"
                          />
                          <CurrencySelect />
                          <ActionSubmitButton type="submit" pendingLabel="Allocating...">
                            Allocate
                          </ActionSubmitButton>
                        </ActionForm>
                      ) : null}
                      <ActionForm action={updateWishlistPriceFormAction} className="grid gap-3">
                        <input type="hidden" name="wishlistItemId" value={item.id} />
                        <Input
                          name="currentPrice"
                          inputMode="decimal"
                          required
                          placeholder="New price"
                        />
                        <ActionSubmitButton
                          type="submit"
                          variant="outline"
                          pendingLabel="Updating..."
                        >
                          Update price
                        </ActionSubmitButton>
                      </ActionForm>
                      <ActionForm action={purchaseWishlistItemFormAction} className="grid content-start">
                        <input type="hidden" name="wishlistItemId" value={item.id} />
                        <ActionSubmitButton
                          type="submit"
                          disabled={item.savedAmountMinor < item.currentPriceMinor}
                          pendingLabel="Purchasing..."
                        >
                          Mark purchased
                        </ActionSubmitButton>
                      </ActionForm>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No wishlist items yet. Add ranked items to start filling bars.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
