import { type Hex } from "viem";

export interface FeedEntry {
  feedId: Hex;
  provider: string;
  value: bigint;
  weight: number;
  timestamp: number;
}

export class OracleFeedAggregator {
  private feeds: Map<string, FeedEntry[]> = new Map();

  public submitFeed(entry: FeedEntry): void {
    const key = entry.feedId.toLowerCase();
    const list = this.feeds.get(key) ?? [];
    list.push({ ...entry });
    this.feeds.set(key, list);
  }

  public getAggregatedValue(feedId: Hex): bigint {
    const key = feedId.toLowerCase();
    const list = this.feeds.get(key) ?? [];
    if (list.length === 0) {
      throw new Error(`No oracle feeds registered for ${feedId}`);
    }

    let totalWeight = 0;
    let weightedSum = 0n;

    for (const item of list) {
      totalWeight += item.weight;
      weightedSum += item.value * BigInt(item.weight);
    }

    return weightedSum / BigInt(totalWeight);
  }

  public clearFeed(feedId: Hex): void {
    this.feeds.delete(feedId.toLowerCase());
  }
}
