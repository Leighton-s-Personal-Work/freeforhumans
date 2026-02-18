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

    // Test with ACTUAL failed transaction values from 2026-02-18 15:37:36
    function test_reproduceFailedClaim() public {
        // Values from actual failed transaction
        uint256 campaignId = 0;
        address recipient = 0x3dF41D9d0ba00D8FBe5A9896bb01eFC4b3787b7C;
        string memory signalString = "0x3dF41D9d0ba00D8FBe5A9896bb01eFC4b3787b7C";
        uint256 root = 17220767757580218896255134819665275026374621391810559233991249701183278482152;
        uint256 nullifierHash = 7438841890599614723191991615568079517616199282286453537514517379588378147471;
        uint256[8] memory proof = [
            uint256(16542883155819276778865916237179670965524213979740441533673361806529097547774),
            uint256(9196665714128308050819656635588292618761404740959721469023756617211638175189),
            uint256(10234579263381449932171216503500445184195929869427594860962136097178831366058),
            uint256(42953246149513128046817056232968801155648313463569697950089309722697798785),
            uint256(14143309806641496538548298017498662537554169515776422414032080793282868133678),
            uint256(10757361477259563941494386184974401623429892762134044228155561014016883823180),
            uint256(10552389025166112168706437773681132019132284302197954730523912173379993988959),
            uint256(17772890902844846921039260016402126831965232253787042410502221056901575868997)
        ];
        uint256 groupId = 1;

        // First, compute what signal hash we're producing
        uint256 signalHash = abi.encodePacked(signalString).hashToField();
        console.log("Our signalHash from string:", signalHash);
        console.logBytes32(bytes32(signalHash));
        
        // Also compute what it would be if we hashed the address directly
        uint256 signalHashFromAddr = abi.encodePacked(recipient).hashToField();
        console.log("signalHash from address bytes:", signalHashFromAddr);
        console.logBytes32(bytes32(signalHashFromAddr));
        
        // Get the externalNullifierHash we're using
        uint256 extNull = 0x00de377c395d8d84917a3973e6fd4b3622d18ae816d47f11b0ebf535c41d0529;
        console.log("externalNullifierHash:", extNull);

        // Try calling verifyProof directly on the World ID Router (mainnet fork)
        // This will tell us exactly what's failing
        IWorldID worldId = IWorldID(0x57f928158C3EE7CDad1e4D8642503c4D0201f611);
        
        console.log("Calling verifyProof with:");
        console.log("  root:", root);
        console.log("  groupId:", groupId);
        console.log("  signalHash:", signalHash);
        console.log("  nullifierHash:", nullifierHash);
        console.log("  extNull:", extNull);
        
        // This will revert with the actual error from World ID
        worldId.verifyProof(
            root,
            groupId,
            signalHash,
            nullifierHash,
            extNull,
            proof
        );
    }

    // Test what signal hash IDKit likely produced
    function test_compareSignalHashes() public view {
        address addr = 0x3dF41D9d0ba00D8FBe5A9896bb01eFC4b3787b7C;
        string memory addrString = "0x3dF41D9d0ba00D8FBe5A9896bb01eFC4b3787b7C";
        
        // Hash the string (42 bytes of ASCII)
        uint256 hashFromString = abi.encodePacked(addrString).hashToField();
        console.log("Hash from STRING (42 bytes):", hashFromString);
        console.logBytes32(bytes32(hashFromString));
        
        // Hash the address (20 bytes)
        uint256 hashFromAddr = abi.encodePacked(addr).hashToField();
        console.log("Hash from ADDRESS (20 bytes):", hashFromAddr);
        console.logBytes32(bytes32(hashFromAddr));
        
        // Hash lowercase string
        string memory lowerString = "0x3df41d9d0ba00d8fbe5a9896bb01efc4b3787b7c";
        uint256 hashFromLower = abi.encodePacked(lowerString).hashToField();
        console.log("Hash from LOWERCASE string:", hashFromLower);
        console.logBytes32(bytes32(hashFromLower));
    }
}
