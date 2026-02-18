// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FreeForHumans.sol";

contract DebugWorldIdTest is Test {
    using ByteHasher for bytes;

    // Compute the expected externalNullifierHash
    function test_computeExternalNullifierHash() public view {
        string memory appId = "app_fab7195de0d7e7590784989dd6934941";
        string memory action = "claim";
        
        // Step 1: hash the appId
        uint256 appIdHash = abi.encodePacked(appId).hashToField();
        console.log("appId hash:", appIdHash);
        console.log("appId hash (hex):");
        console.logBytes32(bytes32(appIdHash));
        
        // Step 2: hash (appIdHash || action)
        uint256 extNull = abi.encodePacked(appIdHash, action).hashToField();
        console.log("externalNullifierHash:", extNull);
        console.log("externalNullifierHash (hex):");
        console.logBytes32(bytes32(extNull));
        
        // Compare with deployed value
        uint256 deployed = 0x00de377c395d8d84917a3973e6fd4b3622d18ae816d47f11b0ebf535c41d0529;
        console.log("deployed externalNullifierHash:", deployed);
        assertEq(extNull, deployed, "External nullifier mismatch!");
    }

    // Test signal hash computation
    function test_computeSignalHash() public view {
        // Example signal (address as string with 0x prefix)
        string memory signalString = "0x1234567890123456789012345678901234567890";
        
        uint256 signalHash = abi.encodePacked(signalString).hashToField();
        console.log("Signal hash for", signalString);
        console.log("  = ", signalHash);
        console.logBytes32(bytes32(signalHash));
    }

    // Test with ACTUAL failed transaction values
    // Replace these with values from a real failed tx
    function test_reproduceFailedClaim() public {
        // TODO: Fill these in with actual values from a failed transaction
        // You can get these from the browser console or network tab
        
        // Example structure - replace with real values:
        /*
        uint256 campaignId = 0;
        address recipient = 0x...;
        string memory signalString = "0x..."; // The exact signal used
        uint256 root = ...;
        uint256 nullifierHash = ...;
        uint256[8] memory proof = [...];
        uint256 groupId = 1; // or 2
        
        // Deploy contract for testing
        FreeForHumans ffh = new FreeForHumans(
            0x57f928158C3EE7CDad1e4D8642503c4D0201f611, // World ID Router
            "app_fab7195de0d7e7590784989dd6934941",
            "claim",
            address(this) // relayer
        );
        
        // Call claim - this will fail with the same error as production
        ffh.claim(campaignId, recipient, signalString, root, nullifierHash, proof, groupId);
        */
    }
}
