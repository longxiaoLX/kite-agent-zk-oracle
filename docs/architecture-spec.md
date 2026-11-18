# Kite Agent ZK Oracle Specification

## 1. Overview
The protocol provides cryptographic guarantees for off-chain AI inference results piped into smart contracts on Kite Chain (EIP-155: 2368 testnet / 2366 mainnet).

## 2. Groth16 Snark Proof Verifier
Decoupled verifier architecture allows swapping out mock verifiers for compiled Snarkjs/Circom verification contracts without breaking ABI compatibility.

## 3. x402 Micropayment Stream
Each oracle update requires a cryptographic EIP-712 payment receipt hash bound directly to the attestation digest.
