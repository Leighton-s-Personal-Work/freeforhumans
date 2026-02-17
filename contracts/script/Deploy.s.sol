// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FreeForHumans.sol";

/// @title DeployFreeForHumans
/// @notice Deployment script for FreeForHumans contract
/// @dev Look up World ID Router addresses at: https://docs.world.org/world-id/reference/address-book
contract DeployFreeForHumans is Script {
    // World ID Router addresses per chain
    // World Chain: https://docs.world.org/world-id/reference/address-book
    address constant WORLD_CHAIN_ROUTER = 0x57f928158C3EE7CDad1e4D8642503c4D0201f611;
    // Base: confirmed from spec
    address constant BASE_ROUTER = 0xBCC7e5910178AFFEEeBA573ba6903E9869594163;

    // RPC URLs
    string constant WORLD_CHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public";
    string constant BASE_RPC = "https://mainnet.base.org";

    function run() external {
        // Generic deployment - uses env vars for all config
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 appId = vm.envUint("WORLD_APP_ID");
        address relayer = vm.envAddress("RELAYER_ADDRESS");
        address worldIdRouter = vm.envAddress("WORLD_ID_ROUTER");

        vm.startBroadcast(deployerPrivateKey);

        FreeForHumans freeForHumans = new FreeForHumans(
            worldIdRouter,
            appId,
            relayer
        );

        console.log("FreeForHumans deployed to:", address(freeForHumans));
        console.log("World ID Router:", worldIdRouter);
        console.log("App ID:", appId);
        console.log("Relayer:", relayer);

        vm.stopBroadcast();
    }

    /// @notice Deploy to World Chain mainnet
    /// @dev Run: forge script script/Deploy.s.sol:DeployFreeForHumans --sig "deployWorldChain()" --rpc-url https://worldchain-mainnet.g.alchemy.com/public --broadcast --verify
    function deployWorldChain() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 appId = vm.envUint("WORLD_APP_ID");
        address relayer = vm.envAddress("RELAYER_ADDRESS");

        console.log("Deploying to World Chain...");
        console.log("World ID Router:", WORLD_CHAIN_ROUTER);
        console.log("App ID:", appId);
        console.log("Relayer:", relayer);

        vm.startBroadcast(deployerPrivateKey);

        FreeForHumans freeForHumans = new FreeForHumans(
            WORLD_CHAIN_ROUTER,
            appId,
            relayer
        );

        console.log("FreeForHumans deployed to World Chain:", address(freeForHumans));

        vm.stopBroadcast();
    }

    /// @notice Deploy to Base mainnet
    /// @dev Run: forge script script/Deploy.s.sol:DeployFreeForHumans --sig "deployBase()" --rpc-url https://mainnet.base.org --broadcast --verify
    function deployBase() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 appId = vm.envUint("WORLD_APP_ID");
        address relayer = vm.envAddress("RELAYER_ADDRESS");

        console.log("Deploying to Base...");
        console.log("World ID Router:", BASE_ROUTER);
        console.log("App ID:", appId);
        console.log("Relayer:", relayer);

        vm.startBroadcast(deployerPrivateKey);

        FreeForHumans freeForHumans = new FreeForHumans(
            BASE_ROUTER,
            appId,
            relayer
        );

        console.log("FreeForHumans deployed to Base:", address(freeForHumans));

        vm.stopBroadcast();
    }
}
