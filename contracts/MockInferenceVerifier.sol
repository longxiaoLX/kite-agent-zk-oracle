// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract MockInferenceVerifier {
    bool public shouldAccept = true;

    function setShouldAccept(bool _accept) external {
        shouldAccept = _accept;
    }

    function verifyProof(
        bytes calldata,
        uint256[4] calldata
    ) external view returns (bool) {
        return shouldAccept;
    }
}
