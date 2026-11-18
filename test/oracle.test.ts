import { describe, it, expect } from "vitest";
import { KiteZKOracleEngine } from "../src/oracle.js";
import { AgentOracleProof, KITE_TESTNET_CONFIG } from "../src/types.js";

describe("KiteZKOracleEngine", () => {
  it("verifies and anchors valid oracle feed proofs", async () => {
    const engine = new KiteZKOracleEngine(KITE_TESTNET_CONFIG, () => true);

    const proof: AgentOracleProof = {
      feedId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      dataHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      value: 42000000000n,
      computationEpoch: 1n,
      x402ReceiptHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
      zkProof: "0xabcdef123456",
    };

    const res1 = await engine.verifyOracleProof(proof);
    expect(res1.valid).toBe(true);
    expect(res1.epoch).toBe(1n);

    // Reject duplicate epoch
    const res2 = await engine.verifyOracleProof(proof);
    expect(res2.valid).toBe(false);
    expect(res2.rejectionReason).toContain("Epoch rollback or replay detected");

    // Accept next epoch 2
    const res3 = await engine.verifyOracleProof({ ...proof, computationEpoch: 2n });
    expect(res3.valid).toBe(true);
  });
});
