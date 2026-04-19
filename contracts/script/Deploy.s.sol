// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {WattCityMedal} from "../WattCityMedal.sol";

/*
 * Phase 8 W2 — deploy WattCityMedal to any EVM chain.
 *
 * Usage (Base Sepolia, requires funded DEPLOYER_PRIVATE_KEY):
 *   forge script contracts/script/Deploy.s.sol \
 *     --rpc-url $BASE_SEPOLIA_RPC_URL \
 *     --private-key $DEPLOYER_PRIVATE_KEY \
 *     --broadcast \
 *     --verify --etherscan-api-key $BASESCAN_API_KEY
 *
 * Usage (local anvil fallback):
 *   anvil &                                    # in another shell
 *   forge script contracts/script/Deploy.s.sol \
 *     --rpc-url http://127.0.0.1:8545 \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 *     --broadcast
 *
 * Script is pure-broadcast: no post-deploy mint, no ownership transfer,
 * no paymaster. The relayer EOA takes over via `transferOwnership` in a
 * follow-up tx so the deployer key stays cold.
 */
contract Deploy is Script {
    function run() external returns (WattCityMedal medal) {
        vm.startBroadcast();
        medal = new WattCityMedal();
        vm.stopBroadcast();
        console.log("WattCityMedal deployed at:", address(medal));
        console.log("Owner:", medal.owner());
        console.log("Name:", medal.name());
        console.log("Symbol:", medal.symbol());
    }
}
