import { describe, it, expect } from "vitest";
import { OracleFeedAggregator } from "../src/feed.js";

describe("OracleFeedAggregator", () => {
  it("computes weighted average oracle values accurately", () => {
    const agg = new OracleFeedAggregator();
    const feedId = "0xfeed000000000000000000000000000000000000000000000000000000000001";

    agg.submitFeed({
      feedId,
      provider: "node-a",
      value: 100n,
      weight: 1,
      timestamp: Date.now(),
    });

    agg.submitFeed({
      feedId,
      provider: "node-b",
      value: 200n,
      weight: 3,
      timestamp: Date.now(),
    });

    // (100 * 1 + 200 * 3) / 4 = 700 / 4 = 175
    expect(agg.getAggregatedValue(feedId)).toBe(175n);
  });
});
