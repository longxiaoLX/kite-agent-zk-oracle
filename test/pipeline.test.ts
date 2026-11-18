import { describe, it, expect } from "vitest";
import { KiteZKOracleEngine } from "../src/oracle.js";
import { BatchOraclePipeline } from "../src/pipeline.js";
import { AgentOracleProof, KITE_TESTNET_CONFIG } from "../src/types.js";

describe("BatchOraclePipeline", () => {
  it("processes heterogeneous batch of oracle proofs with strict ordering", async () => {
    const engine = new KiteZKOracleEngine(KITE_TESTNET_CONFIG, () => true);
    const pipeline = new BatchOraclePipeline(engine);

    const proofs: AgentOracleProof[] = [
      {
        feedId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        dataHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        value: 1000n,
        computationEpoch: 1n,
        x402ReceiptHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        zkProof: "0x01",
      },
      {
        feedId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        dataHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        value: 2000n,
        computationEpoch: 1n,
        x402ReceiptHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
        zkProof: "0x02",
      },
    ];

    const res = await pipeline.processBatch({ proofs, strictEpochOrdering: true });
    expect(res.totalProcessed).toBe(2);
    expect(res.acceptedCount).toBe(2);
    expect(res.rejectedCount).toBe(0);
    expect(res.anchoredDigests).toHaveLength(2);
  });
});
