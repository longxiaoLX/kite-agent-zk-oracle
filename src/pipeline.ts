import { KiteZKOracleEngine } from "./oracle.js";
import { AgentOracleProof } from "./types.js";
import { type Hex } from "viem";

export interface BatchOracleRequest {
  proofs: AgentOracleProof[];
  strictEpochOrdering?: boolean;
  stopOnFirstRejection?: boolean;
}

export interface BatchOracleSummary {
  totalProcessed: number;
  acceptedCount: number;
  rejectedCount: number;
  anchoredDigests: Hex[];
  rejections: Array<{
    feedId: Hex;
    epoch: bigint;
    reason: string;
  }>;
}

export class BatchOraclePipeline {
  constructor(private readonly engine: KiteZKOracleEngine) {}

  public async processBatch(request: BatchOracleRequest): Promise<BatchOracleSummary> {
    const summary: BatchOracleSummary = {
      totalProcessed: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      anchoredDigests: [],
      rejections: [],
    };

    const batchSeenEpochs = new Map<string, bigint>();

    for (const proof of request.proofs) {
      summary.totalProcessed++;

      if (request.strictEpochOrdering) {
        const lastSeen = batchSeenEpochs.get(proof.feedId.toLowerCase());
        if (lastSeen !== undefined && proof.computationEpoch <= lastSeen) {
          summary.rejectedCount++;
          summary.rejections.push({
            feedId: proof.feedId,
            epoch: proof.computationEpoch,
            reason: `Strict ordering violation: epoch ${proof.computationEpoch} <= ${lastSeen}`,
          });
          if (request.stopOnFirstRejection) break;
          continue;
        }
      }

      const res = await this.engine.verifyOracleProof(proof);
      if (res.valid) {
        summary.acceptedCount++;
        summary.anchoredDigests.push(res.attestationDigest);
        batchSeenEpochs.set(proof.feedId.toLowerCase(), proof.computationEpoch);
      } else {
        summary.rejectedCount++;
        summary.rejections.push({
          feedId: res.feedId,
          epoch: res.epoch,
          reason: res.rejectionReason ?? "Unknown validation failure",
        });
        if (request.stopOnFirstRejection) break;
      }
    }

    return summary;
  }
}
