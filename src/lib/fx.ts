import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { exchangeRates } from "@/db/schema";
import { convertMinorAmount } from "@/lib/money";

type FrankfurterRateResponse = {
  base: string;
  quote: string;
  amount: number;
  rate: number;
  date: string;
};

const cacheWindowMs = 12 * 60 * 60 * 1000;

export async function getExchangeRate(baseCurrency: string, quoteCurrency: string) {
  if (baseCurrency === quoteCurrency) {
    return { rate: 1, exchangeRateId: null };
  }

  const db = getDb();
  const recentBoundary = new Date(Date.now() - cacheWindowMs);
  const [cached] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, baseCurrency),
        eq(exchangeRates.quoteCurrency, quoteCurrency),
        gte(exchangeRates.fetchedAt, recentBoundary),
      ),
    )
    .orderBy(desc(exchangeRates.fetchedAt))
    .limit(1);

  if (cached) {
    return { rate: Number(cached.rate), exchangeRateId: cached.id };
  }

  const response = await fetch(
    `https://api.frankfurter.dev/v2/rate/${baseCurrency}/${quoteCurrency}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`No live FX rate available for ${baseCurrency}/${quoteCurrency}.`);
  }

  const payload = (await response.json()) as FrankfurterRateResponse;
  const [rateRow] = await db
    .insert(exchangeRates)
    .values({
      baseCurrency,
      quoteCurrency,
      rate: String(payload.rate),
      providerDate: payload.date,
    })
    .returning();

  return { rate: payload.rate, exchangeRateId: rateRow.id };
}

export async function convertWithRateSnapshot(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string,
) {
  const { rate, exchangeRateId } = await getExchangeRate(fromCurrency, toCurrency);

  return {
    amountMinor: convertMinorAmount(amountMinor, fromCurrency, toCurrency, rate),
    rate,
    exchangeRateId,
  };
}
