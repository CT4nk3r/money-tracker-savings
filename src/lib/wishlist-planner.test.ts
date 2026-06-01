import { describe, expect, it } from "vitest";
import { planWishlistFunding } from "@/lib/wishlist-planner";

const candidates = [
  { id: "a", rank: 1, neededSourceMinor: 500 },
  { id: "b", rank: 2, neededSourceMinor: 500 },
  { id: "c", rank: 3, neededSourceMinor: 500 },
];

describe("planWishlistFunding", () => {
  it("leaves deposits unallocated in manual mode", () => {
    expect(planWishlistFunding(1000, "manual", candidates)).toEqual([]);
  });

  it("fills ranked items from the top first", () => {
    expect(planWishlistFunding(750, "top_first", candidates)).toEqual([
      { itemId: "a", sourceAmountMinor: 500 },
      { itemId: "b", sourceAmountMinor: 250 },
    ]);
  });

  it("splits by rank weight and then fills remaining capacity", () => {
    expect(planWishlistFunding(600, "weighted_split", candidates)).toEqual([
      { itemId: "a", sourceAmountMinor: 300 },
      { itemId: "b", sourceAmountMinor: 200 },
      { itemId: "c", sourceAmountMinor: 100 },
    ]);
  });

  it("does not allocate more than a candidate needs", () => {
    expect(
      planWishlistFunding(1000, "weighted_split", [
        { id: "a", rank: 1, neededSourceMinor: 100 },
        { id: "b", rank: 2, neededSourceMinor: 100 },
      ]),
    ).toEqual([
      { itemId: "a", sourceAmountMinor: 100 },
      { itemId: "b", sourceAmountMinor: 100 },
    ]);
  });
});
