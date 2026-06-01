export type WishlistFundingMode = "manual" | "top_first" | "weighted_split";

export type WishlistFundingCandidate = {
  id: string;
  rank: number;
  neededSourceMinor: number;
};

export type WishlistFundingPlan = {
  itemId: string;
  sourceAmountMinor: number;
};

export function planWishlistFunding(
  amountMinor: number,
  mode: WishlistFundingMode,
  candidates: WishlistFundingCandidate[],
) {
  if (mode === "manual" || amountMinor <= 0) {
    return [];
  }

  const ordered = candidates
    .filter((candidate) => candidate.neededSourceMinor > 0)
    .sort((a, b) => a.rank - b.rank);

  if (mode === "top_first") {
    const plan: WishlistFundingPlan[] = [];
    let remaining = amountMinor;

    for (const candidate of ordered) {
      if (remaining <= 0) {
        break;
      }

      const sourceAmountMinor = Math.min(remaining, candidate.neededSourceMinor);
      plan.push({ itemId: candidate.id, sourceAmountMinor });
      remaining -= sourceAmountMinor;
    }

    return plan;
  }

  const weighted = ordered.map((candidate, index) => ({
    ...candidate,
    weight: ordered.length - index,
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let remaining = amountMinor;

  const plan = weighted.map((candidate) => {
    const share = Math.floor((amountMinor * candidate.weight) / totalWeight);
    const sourceAmountMinor = Math.min(share, candidate.neededSourceMinor, remaining);
    remaining -= sourceAmountMinor;
    return { itemId: candidate.id, sourceAmountMinor };
  });

  for (const candidate of weighted) {
    if (remaining <= 0) {
      break;
    }

    const existing = plan.find((item) => item.itemId === candidate.id);
    const alreadyPlanned = existing?.sourceAmountMinor ?? 0;
    const capacity = candidate.neededSourceMinor - alreadyPlanned;
    const extra = Math.min(capacity, remaining);

    if (existing) {
      existing.sourceAmountMinor += extra;
    }

    remaining -= extra;
  }

  return plan.filter((item) => item.sourceAmountMinor > 0);
}
