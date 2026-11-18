// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IZKInferenceVerifier {
    function verifyProof(
        bytes calldata proof,
        uint256[4] calldata publicInputs
    ) external view returns (bool);
}

/**
 * @title KiteAgentZKOracle
 * @notice On-chain verifiable AI state & oracle feed registry on Kite Chain
 */
contract KiteAgentZKOracle {
    address public owner;
    address public zkVerifier;

    struct OracleAnchor {
        bytes32 dataHash;
        int256 value;
        uint64 epoch;
        bytes32 x402ReceiptHash;
        uint256 timestamp;
    }

    mapping(bytes32 => uint64) public latestEpochs;
    mapping(bytes32 => mapping(uint64 => OracleAnchor)) public anchors;

    event OracleFeedAnchored(
        bytes32 indexed feedId,
        uint64 indexed epoch,
        int256 value,
        bytes32 dataHash,
        bytes32 x402ReceiptHash,
        bytes32 attestationDigest
    );
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    error Unauthorized();
    error NonContractVerifier();
    error MonotonicEpochViolation(uint64 submittedEpoch, uint64 storedEpoch);
    error InvalidZKProof();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _zkVerifier) {
        if (_zkVerifier.code.length == 0) revert NonContractVerifier();
        owner = msg.sender;
        zkVerifier = _zkVerifier;
    }

    function updateVerifier(address _newVerifier) external onlyOwner {
        if (_newVerifier.code.length == 0) revert NonContractVerifier();
        emit VerifierUpdated(zkVerifier, _newVerifier);
        zkVerifier = _newVerifier;
    }

    function anchorFeed(
        bytes32 feedId,
        bytes32 dataHash,
        int256 value,
        uint64 epoch,
        bytes32 x402ReceiptHash,
        bytes calldata zkProof
    ) external returns (bytes32 attestationDigest) {
        uint64 currentEpoch = latestEpochs[feedId];
        if (epoch <= currentEpoch) {
            revert MonotonicEpochViolation(epoch, currentEpoch);
        }

        uint256[4] memory publicInputs = [
            uint256(feedId),
            uint256(dataHash),
            uint256(value),
            uint256(epoch)
        ];

        bool valid = IZKInferenceVerifier(zkVerifier).verifyProof(zkProof, publicInputs);
        if (!valid) revert InvalidZKProof();

        latestEpochs[feedId] = epoch;
        anchors[feedId][epoch] = OracleAnchor({
            dataHash: dataHash,
            value: value,
            epoch: epoch,
            x402ReceiptHash: x402ReceiptHash,
            timestamp: block.timestamp
        });

        attestationDigest = keccak256(
            abi.encodePacked(feedId, dataHash, value, uint256(epoch), x402ReceiptHash)
        );

        emit OracleFeedAnchored(
            feedId,
            epoch,
            value,
            dataHash,
            x402ReceiptHash,
            attestationDigest
        );
    }
}
