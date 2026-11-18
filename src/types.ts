import { type Hex } from "viem";
import { z } from "zod";

export interface KiteNetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  oracleRegistryAddress?: Hex;
  zkVerifierAddress?: Hex;
}

export const KITE_TESTNET_CONFIG: KiteNetworkConfig = {
  chainId: 2368,
  name: "Kite Testnet",
  rpcUrl: "https://rpc-testnet.gokite.ai",
  oracleRegistryAddress: "0x1234567890123456789012345678901234567890",
  zkVerifierAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
};

export const KITE_MAINNET_CONFIG: KiteNetworkConfig = {
  chainId: 2366,
  name: "Kite Mainnet",
  rpcUrl: "https://rpc.gokite.ai",
};

export interface AgentOracleProof {
  feedId: Hex;
  dataHash: Hex;
  value: bigint;
  computationEpoch: bigint;
  x402ReceiptHash: Hex;
  zkProof: Hex;
}

export const AgentOracleProofSchema = z.object({
  feedId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  dataHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  value: z.bigint(),
  computationEpoch: z.bigint().min(0n),
  x402ReceiptHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  zkProof: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export interface OracleVerificationResult {
  valid: boolean;
  feedId: Hex;
  value: bigint;
  epoch: bigint;
  attestationDigest: Hex;
  rejectionReason?: string;
  verifiedAt: number;
}
