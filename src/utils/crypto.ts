import { encodePacked, keccak256, type Hex } from "viem";

const DOMAIN_FEED = keccak256(Buffer.from("KITE_ORACLE_FEED_V1", "utf-8"));

export function computeOracleDigest(
  feedId: Hex,
  dataHash: Hex,
  value: bigint,
  epoch: bigint,
  x402ReceiptHash: Hex
): Hex {
  return keccak256(
    encodePacked(
      ["bytes32", "bytes32", "bytes32", "int256", "uint64", "bytes32"],
      [DOMAIN_FEED, feedId, dataHash, value, epoch, x402ReceiptHash]
    )
  );
}
