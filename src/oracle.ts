import { type Hex } from "viem";
import {
  AgentOracleProof,
  AgentOracleProofSchema,
  KiteNetworkConfig,
  KITE_TESTNET_CONFIG,
  OracleVerificationResult
} from "./types.js";
import { computeOracleDigest } from "./utils/crypto.js";

export type ZKOracleProofVerifier = (
  proof: AgentOracleProof,
  publicInputs: readonly [Hex, Hex, bigint, bigint]
) => boolean | Promise<boolean>;

export class KiteZKOracleEngine {
  private config: KiteNetworkConfig;
  private knownEpochs: Map<string, bigint> = new Map();

  constructor(
    config: KiteNetworkConfig = KITE_TESTNET_CONFIG,
    private readonly verifyProof?: ZKOracleProofVerifier
  ) {
    this.config = config;
  }

  public async verifyOracleProof(
    proof: AgentOracleProof
  ): Promise<OracleVerificationResult> {
    const parseResult = AgentOracleProofSchema.safeParse(proof);
    if (!parseResult.success) {
      return {
        valid: false,
        feedId: proof.feedId,
        value: proof.value,
        epoch: proof.computationEpoch,
        attestationDigest: "0x00" as Hex,
        rejectionReason: `Schema validation failed: ${parseResult.error.message}`,
        verifiedAt: Date.now(),
      };
    }

    const feedKey = proof.feedId.toLowerCase();
    const lastEpoch = this.knownEpochs.get(feedKey) ?? -1n;
    if (proof.computationEpoch <= lastEpoch) {
      return {
        valid: false,
        feedId: proof.feedId,
        value: proof.value,
        epoch: proof.computationEpoch,
        attestationDigest: "0x00" as Hex,
        rejectionReason: `Epoch rollback or replay detected: submitted epoch ${proof.computationEpoch} <= stored epoch ${lastEpoch}`,
        verifiedAt: Date.now(),
      };
    }

    const digest = computeOracleDigest(
      proof.feedId,
      proof.dataHash,
      proof.value,
      proof.computationEpoch,
      proof.x402ReceiptHash
    );

    if (this.verifyProof) {
      const publicInputs = [
        proof.feedId,
        proof.dataHash,
        proof.value,
        proof.computationEpoch,
      ] as const;

      try {
        const isValid = await this.verifyProof(proof, publicInputs);
        if (!isValid) {
          return {
            valid: false,
            feedId: proof.feedId,
            value: proof.value,
            epoch: proof.computationEpoch,
            attestationDigest: digest,
            rejectionReason: "Groth16 ZK proof verification failed against verifier key",
            verifiedAt: Date.now(),
          };
        }
      } catch (err) {
        return {
          valid: false,
          feedId: proof.feedId,
          value: proof.value,
          epoch: proof.computationEpoch,
          attestationDigest: digest,
          rejectionReason: `Verifier execution error: ${err instanceof Error ? err.message : String(err)}`,
          verifiedAt: Date.now(),
        };
      }
    }

    this.knownEpochs.set(feedKey, proof.computationEpoch);

    return {
      valid: true,
      feedId: proof.feedId,
      value: proof.value,
      epoch: proof.computationEpoch,
      attestationDigest: digest,
      verifiedAt: Date.now(),
    };
  }

  public getLatestEpoch(feedId: Hex): bigint {
    return this.knownEpochs.get(feedId.toLowerCase()) ?? 0n;
  }
}
