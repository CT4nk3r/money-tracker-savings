import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Banknote, Goal, ListOrdered } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto grid min-h-dvh max-w-6xl content-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="grid gap-7">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Banknote className="size-4" aria-hidden />
            Multi-currency savings tracker
          </div>
          <div className="grid gap-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-6xl">
              Savings Ledger
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Set aside money in HUF, EUR, USD, or another supported currency,
              fund goals directly, and fill ranked wishlist bars until an item is
              ready to buy.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SignUpButton>
              <Button size="lg">
                Create account
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </SignInButton>
          </div>
        </div>
        <Card className="border-primary/20 bg-card/80">
          <CardContent className="grid gap-5 p-6">
            <div className="flex items-start gap-3">
              <Goal className="mt-1 size-5 text-primary" aria-hidden />
              <div>
                <div className="font-medium">Goal funding</div>
                <p className="text-sm text-muted-foreground">
                  Track flights, hotels, deposits, or emergency funds in their own
                  currency.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ListOrdered className="mt-1 size-5 text-primary" aria-hidden />
              <div>
                <div className="font-medium">Ranked wishlist</div>
                <p className="text-sm text-muted-foreground">
                  Choose manual funding, top item first, or weighted split when
                  new savings are deposited.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
